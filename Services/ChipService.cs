using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class ChipService
{
    private readonly IMongoCollection<Chip> _chips;

    public ChipService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _chips = database.GetCollection<Chip>("Chips");
    }

    public async Task<List<Chip>> GetAllAsync() =>
        await _chips.Find(_ => true).ToListAsync();

    public async Task<Chip?> GetByIdAsync(string id) =>
        await _chips.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Chip chip) =>
        await _chips.InsertOneAsync(chip);

    public async Task UpdateAsync(string id, Chip chip) =>
        await _chips.ReplaceOneAsync(c => c.Id == id, chip);

    public async Task DeleteAsync(string id) =>
        await _chips.DeleteOneAsync(c => c.Id == id);

    // busca múltiplos chips por uma lista de IDs
    // usado pelo CelularService para resolver os chips e contas whatsapp
    public async Task<List<Chip>> GetByIdsAsync(List<string> ids)
    {
        var filtro = Builders<Chip>.Filter.In(c => c.Id, ids);
        return await _chips.Find(filtro).ToListAsync();
    }

    // atualiza apenas o campo CelularId de um chip (vinculação/desvinculação)
    public async Task PatchCelularIdAsync(string id, string? celularId)
    {
        var update = Builders<Chip>.Update.Set(c => c.CelularId, celularId);
        await _chips.UpdateOneAsync(c => c.Id == id, update);
    }
}
