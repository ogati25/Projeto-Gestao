using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Identity;

namespace Projeto_Gestao.Services;

public class UsuarioService
{
    private readonly IMongoCollection<Usuario> _usuarios;
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public UsuarioService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _usuarios = database.GetCollection<Usuario>("Usuarios");

        _passwordHasher = new PasswordHasher<Usuario>();

        var indexKeysDefinition = Builders<Usuario>.IndexKeys.Ascending(u => u.Email);
        var indexModel = new CreateIndexModel<Usuario>(indexKeysDefinition, new CreateIndexOptions { Unique = true });
        _usuarios.Indexes.CreateOneAsync(indexModel);
    }

    // ========== LEITURA ==========

    public async Task<Usuario?> GetByIdAsync(string id) =>
        await _usuarios.Find(u => u.Id == id).FirstOrDefaultAsync();

    public async Task<Usuario?> GetByEmailAsync(string email) =>
        await _usuarios.Find(u => u.Email == email).FirstOrDefaultAsync();

    // ========== CRIAÇÃO ==========

    public async Task CreateAsync(Usuario usuario)
    {
        usuario.Id = null;
        usuario.Senha = _passwordHasher.HashPassword(usuario, usuario.Senha);
        usuario.CriadoEm = DateTime.UtcNow;
        await _usuarios.InsertOneAsync(usuario);
    }

    // ========== ATUALIZAÇÕES ==========

    // Setor agora é string — sem referência ao enum
    public async Task UpdateDadosPessoaisAsync(string id, string nome, string sobrenome, string setor)
    {
        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return;

        usuarioExistente.Nome = nome;
        usuarioExistente.Sobrenome = sobrenome;
        usuarioExistente.Setor = setor;
        usuarioExistente.AtualizadoEm = DateTime.UtcNow;

        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
    }

    public async Task<bool> UpdateEmailAsync(string id, string novoEmail)
    {
        var usuarioComEmail = await GetByEmailAsync(novoEmail);
        if (usuarioComEmail != null && usuarioComEmail.Id != id)
            return false;

        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return false;

        usuarioExistente.Email = novoEmail;
        usuarioExistente.AtualizadoEm = DateTime.UtcNow;
        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
        return true;
    }

    public async Task UpdateSenhaAsync(string id, string novaSenha)
    {
        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return;

        usuarioExistente.Senha = _passwordHasher.HashPassword(usuarioExistente, novaSenha);
        usuarioExistente.AtualizadoEm = DateTime.UtcNow;
        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
    }

    // ========== DELETE ==========

    public async Task DeleteAsync(string id) =>
        await _usuarios.DeleteOneAsync(u => u.Id == id);

    // ========== AUTENTICAÇÃO ==========

    public async Task<Usuario?> AuthenticateAsync(string email, string senha)
    {
        var usuario = await GetByEmailAsync(email);
        if (usuario == null) return null;

        var resultado = _passwordHasher.VerifyHashedPassword(usuario, usuario.Senha, senha);
        return resultado == PasswordVerificationResult.Success ? usuario : null;
    }

    // ========== RESET DE SENHA ==========

    /// <summary>
    /// Gera um token seguro de reset de senha para o usuario com o e-mail informado.
    /// Retorna o token gerado, ou null se o e-mail nao existir.
    /// O token expira em 1 hora.
    /// </summary>
    public async Task<(Usuario? usuario, string? token)> GerarTokenResetSenhaAsync(string email)
    {
        var usuario = await GetByEmailAsync(email);
        if (usuario == null) return (null, null);

        var token = GerarTokenSeguro();
        usuario.ResetSenhaToken       = token;
        usuario.ResetSenhaTokenExpiry = DateTime.UtcNow.AddHours(1);

        await _usuarios.ReplaceOneAsync(u => u.Id == usuario.Id, usuario);
        return (usuario, token);
    }

    /// <summary>
    /// Valida o token e, se valido, aplica o hash na nova senha e a persiste.
    /// Retorna false se o token for invalido ou expirado.
    /// </summary>
    public async Task<bool> RedefinirSenhaComTokenAsync(string token, string novaSenha)
    {
        var usuario = await _usuarios
            .Find(u => u.ResetSenhaToken == token)
            .FirstOrDefaultAsync();

        if (usuario == null) return false;
        if (usuario.ResetSenhaTokenExpiry == null || usuario.ResetSenhaTokenExpiry < DateTime.UtcNow)
            return false;

        usuario.Senha                 = _passwordHasher.HashPassword(usuario, novaSenha);
        usuario.ResetSenhaToken       = null;
        usuario.ResetSenhaTokenExpiry = null;
        usuario.AtualizadoEm          = DateTime.UtcNow;

        await _usuarios.ReplaceOneAsync(u => u.Id == usuario.Id, usuario);
        return true;
    }

    // ========== VERIFICACAO DE E-MAIL ==========

    /// <summary>
    /// Gera token de verificacao de e-mail para o usuario recem-cadastrado.
    /// Expira em 24 horas. Persiste o token no banco.
    /// </summary>
    public async Task<string> GerarTokenVerificacaoEmailAsync(string usuarioId)
    {
        var usuario = await GetByIdAsync(usuarioId);
        if (usuario == null) return string.Empty;

        var token = GerarTokenSeguro();
        usuario.EmailVerificacaoToken       = token;
        usuario.EmailVerificacaoTokenExpiry = DateTime.UtcNow.AddHours(24);

        await _usuarios.ReplaceOneAsync(u => u.Id == usuario.Id, usuario);
        return token;
    }

    /// <summary>
    /// Confirma o e-mail do usuario se o token for valido e nao expirado.
    /// Retorna false se o token for invalido ou expirado.
    /// </summary>
    public async Task<bool> ConfirmarEmailAsync(string token)
    {
        var usuario = await _usuarios
            .Find(u => u.EmailVerificacaoToken == token)
            .FirstOrDefaultAsync();

        if (usuario == null) return false;
        if (usuario.EmailVerificacaoTokenExpiry == null || usuario.EmailVerificacaoTokenExpiry < DateTime.UtcNow)
            return false;

        usuario.EmailVerificado             = true;
        usuario.EmailVerificacaoToken       = null;
        usuario.EmailVerificacaoTokenExpiry = null;
        usuario.AtualizadoEm                = DateTime.UtcNow;

        await _usuarios.ReplaceOneAsync(u => u.Id == usuario.Id, usuario);
        return true;
    }

    // ========== UTILITARIO ==========

    /// <summary>
    /// Gera um token URL-safe de 48 bytes.
    /// </summary>
    private static string GerarTokenSeguro()
    {
        var bytes = new byte[48];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
