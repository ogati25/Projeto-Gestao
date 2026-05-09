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
        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
        return true;
    }

    public async Task UpdateSenhaAsync(string id, string novaSenha)
    {
        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return;

        usuarioExistente.Senha = _passwordHasher.HashPassword(usuarioExistente, novaSenha);
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
}
