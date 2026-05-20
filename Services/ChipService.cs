using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class ChipService
{
    private readonly IMongoCollection<Chip>    _chips;
    private readonly IMongoCollection<Celular> _celulares;

    public ChipService(IOptions<MongoDbSettings> settings)
    {
        var client   = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _chips     = database.GetCollection<Chip>("Chips");
        _celulares = database.GetCollection<Celular>("Celulares");
    }

    // ── Leitura ───────────────────────────────────────────────

    public async Task<List<Chip>> GetAllAsync() =>
        await _chips.Find(_ => true).ToListAsync();

    public async Task<Chip?> GetByIdAsync(string id) =>
        await _chips.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task<List<Chip>> GetByIdsAsync(List<string> ids)
    {
        var filtro = Builders<Chip>.Filter.In(c => c.Id, ids);
        return await _chips.Find(filtro).ToListAsync();
    }

    // ── Criação ───────────────────────────────────────────────

    public async Task CreateAsync(Chip chip)
    {
        // Valida: o celularId informado não pode já ter esse chip em outro slot
        if (!string.IsNullOrEmpty(chip.CelularId))
        {
            var conflito = await ChecarConflitoCelular(chip.CelularId, excludeChipId: null);
            // Apenas verifica se o celular existe
            var celular = await _celulares.Find(c => c.Id == chip.CelularId).FirstOrDefaultAsync();
            if (celular == null)
                throw new InvalidOperationException("Celular informado não existe.");
        }

        await _chips.InsertOneAsync(chip);

        // Atualiza ChipIds no celular se foi vinculado
        if (!string.IsNullOrEmpty(chip.CelularId) && !string.IsNullOrEmpty(chip.Id))
            await AdicionarChipNoCelularAsync(chip.CelularId, chip.Id);
    }

    // ── Atualização ───────────────────────────────────────────

    public async Task UpdateAsync(string id, Chip chip)
    {
        var anterior = await GetByIdAsync(id);
        var celularAnteriorId = anterior?.CelularId;

        // Preserva Id e Codigo originais
        chip.Id     = id;
        chip.Codigo = anterior?.Codigo ?? chip.Codigo;

        // Valida: se mudou de celular, o novo celular existe?
        if (!string.IsNullOrEmpty(chip.CelularId) && chip.CelularId != celularAnteriorId)
        {
            var celular = await _celulares.Find(c => c.Id == chip.CelularId).FirstOrDefaultAsync();
            if (celular == null)
                throw new InvalidOperationException("Celular informado não existe.");
        }

        await _chips.ReplaceOneAsync(c => c.Id == id, chip);

        // Celular mudou ou foi removido → remove chip do celular anterior
        if (!string.IsNullOrEmpty(celularAnteriorId) && celularAnteriorId != chip.CelularId)
            await RemoverChipDoCelularAsync(celularAnteriorId, id);

        // Vincula ao novo celular
        if (!string.IsNullOrEmpty(chip.CelularId) && chip.CelularId != celularAnteriorId)
            await AdicionarChipNoCelularAsync(chip.CelularId, id);

        // Se o celularId foi apagado (campo vazio no modal), remove do celular anterior
        if (string.IsNullOrEmpty(chip.CelularId) && !string.IsNullOrEmpty(celularAnteriorId))
            await RemoverChipDoCelularAsync(celularAnteriorId, id);
    }

    // ── Exclusão ──────────────────────────────────────────────

    public async Task DeleteAsync(string id)
    {
        var chip = await GetByIdAsync(id);
        if (!string.IsNullOrEmpty(chip?.CelularId))
            await RemoverChipDoCelularAsync(chip.CelularId, id);
        await _chips.DeleteOneAsync(c => c.Id == id);
    }

    // ── Helpers ───────────────────────────────────────────────

    // Adiciona chipId no array ChipIds do celular (sem duplicar)
    private async Task AdicionarChipNoCelularAsync(string celularId, string chipId)
    {
        var upd = Builders<Celular>.Update.AddToSet(c => c.ChipIds, chipId);
        await _celulares.UpdateOneAsync(c => c.Id == celularId, upd);
    }

    // Remove chipId do array ChipIds do celular
    private async Task RemoverChipDoCelularAsync(string celularId, string chipId)
    {
        var upd = Builders<Celular>.Update.Pull(c => c.ChipIds, chipId);
        await _celulares.UpdateOneAsync(c => c.Id == celularId, upd);
    }

    // Verifica se um celular já tem chips vinculados a outro chip (para validação futura)
    private async Task<bool> ChecarConflitoCelular(string celularId, string? excludeChipId)
    {
        var filtro = Builders<Chip>.Filter.And(
            Builders<Chip>.Filter.Eq(c => c.CelularId, celularId),
            excludeChipId != null
                ? Builders<Chip>.Filter.Ne(c => c.Id, excludeChipId)
                : Builders<Chip>.Filter.Empty
        );
        return await _chips.Find(filtro).AnyAsync();
    }

    // Usado pelo CelularService para desatualização legacy (mantido para compatibilidade)
    public async Task PatchCelularIdAsync(string id, string? celularId)
    {
        var upd = Builders<Chip>.Update.Set(c => c.CelularId, celularId);
        await _chips.UpdateOneAsync(c => c.Id == id, upd);
    }
}
