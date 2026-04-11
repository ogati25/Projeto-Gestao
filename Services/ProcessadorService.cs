using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class ProcessadorService
{
    private readonly IMongoCollection<Processador> _processadores;

    public ProcessadorService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _processadores = database.GetCollection<Processador>("Processadores");
    }

    public async Task<List<Processador>> GetAllAsync() =>
        await _processadores.Find(_ => true).ToListAsync();

    public async Task<Processador?> GetByIdAsync(string id) =>
        await _processadores.Find(p => p.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Processador processador) =>
        await _processadores.InsertOneAsync(processador);

    public async Task UpdateAsync(string id, Processador processador) =>
        await _processadores.ReplaceOneAsync(p => p.Id == id, processador);

    public async Task DeleteAsync(string id) =>
        await _processadores.DeleteOneAsync(p => p.Id == id);
}
