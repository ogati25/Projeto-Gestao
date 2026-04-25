using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Identity;
using Projeto_Gestao.Enums;

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

        // Inicializa o PasswordHasher
        _passwordHasher = new PasswordHasher<Usuario>();

        // Opcional: Criar índice único para o campo Email para evitar duplicatas e acelerar buscas
        var indexKeysDefinition = Builders<Usuario>.IndexKeys.Ascending(u => u.Email);
        var indexModel = new CreateIndexModel<Usuario>(indexKeysDefinition, new CreateIndexOptions { Unique = true });
        _usuarios.Indexes.CreateOneAsync(indexModel); // Fire-and-forget (executa em segundo plano)
    }

    // ========== MÉTODOS DE LEITURA ==========
    // READ (por Id)
    public async Task<Usuario?> GetByIdAsync(string id) =>
        await _usuarios.Find(u => u.Id == id).FirstOrDefaultAsync();
    
    // READ (por Email)
    public async Task<Usuario?> GetByEmailAsync(string email) =>
        await _usuarios.Find(u => u.Email == email).FirstOrDefaultAsync();
    
    // ========== CRIAÇÃO ==========
    public async Task CreateAsync(Usuario usuario)
    {
        usuario.Id = null; // MongoDB gera automaticamente

        // Aplica hash na senha ANTES de salvar
        usuario.Senha = _passwordHasher.HashPassword(usuario, usuario.Senha);
        usuario.CriadoEm = DateTime.UtcNow;
        await _usuarios.InsertOneAsync(usuario);
    }
    
    // ========== ATUALIZAÇÕES ESPECÍFICAS ==========
    /// Atualiza apenas Nome, Sobrenome e Setor. Preserva Email e Senha.
    public async Task UpdateDadosPessoaisAsync(string id, string nome, string sobrenome, Setor setor)
    {
        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return;

        usuarioExistente.Nome = nome;
        usuarioExistente.Sobrenome = sobrenome;
        usuarioExistente.Setor = setor;

        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
    }
    
    /// Atualiza apenas o Email. Verifica se o novo email já não está em uso.
    /// Preserva todos os outros campos.
    public async Task<bool> UpdateEmailAsync(string id, string novoEmail)
    {
        // Verifica se o email já existe em outro usuário
        var usuarioComEmail = await GetByEmailAsync(novoEmail);
        if (usuarioComEmail != null && usuarioComEmail.Id != id)
            return false; // Email já está em uso

        var usuarioExistente = await GetByIdAsync(id);
        if (usuarioExistente == null) return false;

        usuarioExistente.Email = novoEmail;
        await _usuarios.ReplaceOneAsync(u => u.Id == id, usuarioExistente);
        return true;
    }

    /// Atualiza apenas a Senha (aplica hash automaticamente).
    /// Preserva todos os outros campos.
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

    // ========== AUTENTICAÇÃO COM HASH ==========
    public async Task<Usuario?> AuthenticateAsync(string email, string senha)
    {
        var usuario = await GetByEmailAsync(email);
        if (usuario == null) return null;

        var resultado = _passwordHasher.VerifyHashedPassword(usuario, usuario.Senha, senha);
        return resultado == PasswordVerificationResult.Success ? usuario : null;
    }
}