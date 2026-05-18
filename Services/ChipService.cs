using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class ChipService
{
    private readonly IMongoCollection<Chip> _chips;
    private readonly IMongoCollection<Celular> _celulares;

    public ChipService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _chips = database.GetCollection<Chip>("Chips");
        _celulares = database.GetCollection<Celular>("Celulares");
    }

    public async Task<List<Chip>> GetAllAsync() =>
        await _chips.Find(_ => true).ToListAsync();

    public async Task<Chip?> GetByIdAsync(string id) =>
        await _chips.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Chip chip)
    {
        await _chips.InsertOneAsync(chip);
        // Se o chip foi criado ja vinculado a um celular, adiciona o chip no ChipIds do celular
        if (!string.IsNullOrEmpty(chip.CelularId) && !string.IsNullOrEmpty(chip.Id))
            await AdicionarChipNoCelularAsync(chip.CelularId, chip.Id);
    }

    public async Task UpdateAsync(string id, Chip chip)
    {
        // Verifica o celular anterior para tratar a desvinculacao/troca
        var anterior = await GetByIdAsync(id);
        var celularAnteriorId = anterior?.CelularId;

        // Preserva Id e Codigo originais — nunca podem mudar em um update
        chip.Id     = id;
        chip.Codigo = anterior?.Codigo ?? chip.Codigo;
        await _chips.ReplaceOneAsync(c => c.Id == id, chip);

        // Celular mudou ou foi removido: desvincula do celular anterior
        if (!string.IsNullOrEmpty(celularAnteriorId) && celularAnteriorId != chip.CelularId)
            await RemoverChipDoCelularAsync(celularAnteriorId, id);

        // Vincula ao novo celular (se houver e for diferente do anterior)
        if (!string.IsNullOrEmpty(chip.CelularId) && chip.CelularId != celularAnteriorId)
            await AdicionarChipNoCelularAsync(chip.CelularId, id);
    }

    public async Task DeleteAsync(string id)
    {
        var chip = await GetByIdAsync(id);
        // Desvincula do celular antes de deletar
        if (!string.IsNullOrEmpty(chip?.CelularId))
            await RemoverChipDoCelularAsync(chip.CelularId, id);
        await _chips.DeleteOneAsync(c => c.Id == id);
    }

    // Adiciona o chipId no array ChipIds do celular (sem duplicar)
    private async Task AdicionarChipNoCelularAsync(string celularId, string chipId)
    {
        var update = Builders<Celular>.Update.AddToSet(c => c.ChipIds, chipId);
        await _celulares.UpdateOneAsync(c => c.Id == celularId, update);
    }

    // Remove o chipId do array ChipIds do celular
    private async Task RemoverChipDoCelularAsync(string celularId, string chipId)
    {
        var update = Builders<Celular>.Update.Pull(c => c.ChipIds, chipId);
        await _celulares.UpdateOneAsync(c => c.Id == celularId, update);
    }

    // busca multiplos chips por uma lista de IDs
    // usado pelo CelularService para resolver os chips e contas whatsapp
    public async Task<List<Chip>> GetByIdsAsync(List<string> ids)
    {
        var filtro = Builders<Chip>.Filter.In(c => c.Id, ids);
        return await _chips.Find(filtro).ToListAsync();
    }

    // atualiza apenas o campo CelularId de um chip (vinculacao/desvinculacao pelo CelularService)
    public async Task PatchCelularIdAsync(string id, string? celularId)
    {
        var update = Builders<Chip>.Update.Set(c => c.CelularId, celularId);
        await _chips.UpdateOneAsync(c => c.Id == id, update);
    }
}
