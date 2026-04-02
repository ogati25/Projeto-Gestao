// É quem realmente fala com o MongoDB. Toda a lógica de buscar, criar, editar e deletar fica aqui

using MongoDB.Driver;
using InventarioAtivos.Models;
using InventarioAtivos.Settings;
using Microsoft.Extensions.Options;

namespace InventarioAtivos.Services;

public class ProdutoService
{
    private readonly IMongoCollection<Produto> _produtos;

    public ProdutoService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _produtos = database.GetCollection<Produto>("Produtos"); 
    }

    public async Task<List<Produto>> GetAllAsync() =>
        await _produtos.Find(_ => true).ToListAsync();

    public async Task<Produto?> GetByIdAsync(string id) =>
        await _produtos.Find(p => p.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Produto produto) =>
        await _produtos.InsertOneAsync(produto);

    public async Task UpdateAsync(string id, Produto produto) =>
        await _produtos.ReplaceOneAsync(p => p.Id == id, produto);

    public async Task DeleteAsync(string id) =>
        await _produtos.DeleteOneAsync(p => p.Id == id);
}