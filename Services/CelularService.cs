using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class CelularService
{
    private readonly IMongoCollection<Celular> _celulares;
    private readonly IMongoCollection<Chip>    _chips;

    public CelularService(IOptions<MongoDbSettings> settings)
    {
        var client   = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _celulares   = database.GetCollection<Celular>("Celulares");
        _chips       = database.GetCollection<Chip>("Chips");
    }

    // ── Leitura ───────────────────────────────────────────────

    public async Task<List<Celular>> GetAllAsync() =>
        await _celulares.Find(_ => true).ToListAsync();

    public async Task<Celular?> GetByIdAsync(string id) =>
        await _celulares.Find(c => c.Id == id).FirstOrDefaultAsync();

    // ── Criação ───────────────────────────────────────────────

    public async Task CreateAsync(Celular celular)
    {
        // Valida: nenhum chipId pode já estar em outro celular
        var conflito = await ChecarConflitosChip(celular.ChipIds, excludeCelularId: null);
        if (conflito != null)
            throw new InvalidOperationException($"O chip '{conflito}' já está vinculado a outro celular.");

        await _celulares.InsertOneAsync(celular);

        // Grava CelularId nos chips físicos e limpa nos que saíram
        await SincronizarChipsFisicos(celular.Id!, celular.ChipIds, antigosChipIds: new List<string>());
    }

    // ── Atualização ───────────────────────────────────────────

    public async Task UpdateAsync(string id, Celular celular)
    {
        var anterior = await GetByIdAsync(id);

        // Valida: nenhum chipId novo pode estar em outro celular
        var conflito = await ChecarConflitosChip(celular.ChipIds, excludeCelularId: id);
        if (conflito != null)
            throw new InvalidOperationException($"O chip '{conflito}' já está vinculado a outro celular.");

        var filtro = Builders<Celular>.Filter.Eq(c => c.Id, id);
        var update = Builders<Celular>.Update
            .Set(c => c.Codigo,         anterior?.Codigo ?? celular.Codigo) // preserva Codigo original
            .Set(c => c.Usuario,        celular.Usuario)
            .Set(c => c.Setor,          celular.Setor)
            .Set(c => c.Status,         celular.Status)
            .Set(c => c.Ativo,          celular.Ativo)
            .Set(c => c.Observacoes,    celular.Observacoes)
            .Set(c => c.DataAquisicao,  celular.DataAquisicao)
            .Set(c => c.PrecoAquisicao, celular.PrecoAquisicao)
            .Set(c => c.Modelo,         celular.Modelo)
            .Set(c => c.MemoriaRAM,     celular.MemoriaRAM)
            .Set(c => c.Armazenamento,  celular.Armazenamento)
            .Set(c => c.Conectividade,  celular.Conectividade)
            .Set(c => c.ChipIds,        celular.ChipIds)
            .Set(c => c.ContasWhatsapp, celular.ContasWhatsapp);

        await _celulares.UpdateOneAsync(filtro, update);

        // Atualiza CelularId nos chips físicos com base no que foi salvo no modal
        var antigosChipIds = anterior?.ChipIds ?? new List<string>();
        await SincronizarChipsFisicos(id, celular.ChipIds, antigosChipIds);
    }

    // ── Exclusão ──────────────────────────────────────────────

    public async Task DeleteAsync(string id)
    {
        var celular = await GetByIdAsync(id);
        if (celular != null)
            await SincronizarChipsFisicos(id, novosChipIds: new List<string>(), celular.ChipIds);

        await _celulares.DeleteOneAsync(c => c.Id == id);
    }

    // ── Sincronização direta baseada no que foi salvo no modal ─
    //
    // Regra simples:
    //   - Chips que estão nos novosChipIds  → CelularId = celularId
    //   - Chips que saíram (estavam antes)  → CelularId = null
    //   - ContasWhatsapp nunca tocam CelularId do chip

    private async Task SincronizarChipsFisicos(
        string celularId,
        List<string> novosChipIds,
        List<string> antigosChipIds)
    {
        var novos   = novosChipIds.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToList();
        var antigos = antigosChipIds.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToList();

        // Chips que foram removidos do modal → limpa CelularId
        var removidos = antigos.Except(novos).ToList();
        foreach (var chipId in removidos)
        {
            var upd = Builders<Chip>.Update.Set(c => c.CelularId, (string?)null);
            await _chips.UpdateOneAsync(c => c.Id == chipId, upd);
        }

        // Chips que estão no modal → seta CelularId
        foreach (var chipId in novos)
        {
            var upd = Builders<Chip>.Update.Set(c => c.CelularId, celularId);
            await _chips.UpdateOneAsync(c => c.Id == chipId, upd);
        }
    }

    // ── Verifica se algum chip já está em outro celular ───────

    private async Task<string?> ChecarConflitosChip(List<string> chipIds, string? excludeCelularId)
    {
        foreach (var chipId in chipIds.Where(x => !string.IsNullOrEmpty(x)))
        {
            var chip = await _chips.Find(c => c.Id == chipId).FirstOrDefaultAsync();
            if (chip == null) continue;
            if (!string.IsNullOrEmpty(chip.CelularId) && chip.CelularId != excludeCelularId)
                return chip.Numero ?? chipId;
        }
        return null;
    }

    // ── Detalhe com chips e WhatsApp resolvidos ───────────────

    public async Task<object?> GetByIdComChipsAsync(string id)
    {
        var celular = await GetByIdAsync(id);
        if (celular == null) return null;

        var chips = celular.ChipIds.Any()
            ? await _chips.Find(Builders<Chip>.Filter.In(c => c.Id, celular.ChipIds)).ToListAsync()
            : new List<Chip>();

        var wppChips = celular.ContasWhatsapp.Any()
            ? await _chips.Find(Builders<Chip>.Filter.In(c => c.Id, celular.ContasWhatsapp)).ToListAsync()
            : new List<Chip>();

        return new
        {
            celular.Id,
            celular.Codigo,
            celular.Usuario,
            celular.DataAquisicao,
            celular.PrecoAquisicao,
            celular.Ativo,
            celular.Setor,
            celular.Observacoes,
            celular.Status,
            celular.Modelo,
            celular.MemoriaRAM,
            celular.Armazenamento,
            celular.Conectividade,
            Chips          = chips,
            ContasWhatsapp = wppChips.Select(c => new { c.Numero, c.Dono })
        };
    }
}
