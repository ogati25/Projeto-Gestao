using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class CelularService
{
    private readonly IMongoCollection<Celular> _celulares;
    private readonly ChipService _chipService;

    public CelularService(IOptions<MongoDbSettings> settings, ChipService chipService)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _celulares = database.GetCollection<Celular>("Celulares");
        _chipService = chipService;
    }

    public async Task<List<Celular>> GetAllAsync()
    {
        var celulares = await _celulares.Find(_ => true).ToListAsync();
        // Sincroniza ChipIds de cada celular com base nos chips que apontam para ele
        // Garante consistência mesmo para dados criados antes do fix de vinculação bidirecional
        var todosChips = await _chipService.GetAllAsync();
        foreach (var cel in celulares)
        {
            // Chips que apontam para este celular, excluindo os que são apenas contas WhatsApp
            // (o vínculo de WhatsApp não deve preencher o slot físico de chip do celular)
            var chipsDoCelular = todosChips
                .Where(c => c.CelularId == cel.Id
                         && !string.IsNullOrEmpty(c.Id)
                         && !cel.ContasWhatsapp.Contains(c.Id!))
                .Select(c => c.Id!)
                .Distinct()
                .ToList();

            // Se o ChipIds do celular está desatualizado, corrige no banco silenciosamente
            var faltando = chipsDoCelular.Except(cel.ChipIds).ToList();
            var sobrando = cel.ChipIds.Except(chipsDoCelular).ToList();
            if (faltando.Any() || sobrando.Any())
            {
                var upd = Builders<Celular>.Update.Set(c => c.ChipIds, chipsDoCelular);
                await _celulares.UpdateOneAsync(c => c.Id == cel.Id, upd);
                cel.ChipIds = chipsDoCelular;
            }
        }
        return celulares;
    }

    public async Task<Celular?> GetByIdAsync(string id) =>
        await _celulares.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Celular celular)
    {
        await _celulares.InsertOneAsync(celular);
        await VincularChipsAsync(celular.Id!, celular.ChipIds, celular.ContasWhatsapp);
    }

    public async Task UpdateAsync(string id, Celular celular)
    {
        // Descobre quais chips estavam vinculados antes para desvincular os removidos
        var anterior = await GetByIdAsync(id);
        var antigosChipIds   = anterior?.ChipIds        ?? new List<string>();
        var antigosWhatsapp  = anterior?.ContasWhatsapp ?? new List<string>();

        var filtro = Builders<Celular>.Filter.Eq(c => c.Id, id);
        var update = Builders<Celular>.Update
            .Set(c => c.Codigo,         anterior?.Codigo ?? celular.Codigo)  // preserva o Codigo original
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

        await VincularChipsAsync(id, celular.ChipIds, celular.ContasWhatsapp, antigosChipIds, antigosWhatsapp);
    }

    public async Task DeleteAsync(string id)
    {
        var celular = await GetByIdAsync(id);
        if (celular != null)
        {
            var todos = celular.ChipIds.Union(celular.ContasWhatsapp).Distinct().ToList();
            await DesvincularChipsAsync(todos);
        }
        await _celulares.DeleteOneAsync(c => c.Id == id);
    }

    // ── helpers de vinculação ──────────────────────────────────

    private async Task VincularChipsAsync(
        string celularId,
        List<string> chipIds,
        List<string> contasWhatsapp,
        List<string>? antigosChipIds = null,
        List<string>? antigosWhatsapp = null)
    {
        // Chips físicos (slot) e contas WhatsApp são tratados separadamente:
        // - chipIds: chip inserido fisicamente → recebe CelularId
        // - contasWhatsapp: apenas referência de conta → NÃO altera CelularId do chip
        var novosChipsFisicos = chipIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

        // Desvincular chips físicos que saíram
        if (antigosChipIds != null)
        {
            var removidos = antigosChipIds.Except(novosChipsFisicos).ToList();
            await DesvincularChipsAsync(removidos);
        }

        // Vincular apenas chips físicos → atualiza CelularId no chip
        foreach (var chipId in novosChipsFisicos)
            await _chipService.PatchCelularIdAsync(chipId, celularId);
    }

    private async Task DesvincularChipsAsync(List<string> chipIds)
    {
        foreach (var chipId in chipIds)
            await _chipService.PatchCelularIdAsync(chipId, null);
    }

    // busca o celular com chips e contas whatsapp resolvidos
    public async Task<object?> GetByIdComChipsAsync(string id)
    {
        var celular = await GetByIdAsync(id);
        if (celular == null) return null;

        // resolve os chips pelo ID
        var chips = celular.ChipIds.Any()
            ? await _chipService.GetByIdsAsync(celular.ChipIds)
            : new List<Chip>();

        // resolve as contas whatsapp pelo ID, retorna só número e dono
        var whatsappChips = celular.ContasWhatsapp.Any()
            ? await _chipService.GetByIdsAsync(celular.ContasWhatsapp)
            : new List<Chip>();

        var contasWhatsapp = whatsappChips.Select(c => new
        {
            c.Numero,
            c.Dono
        });

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
            Chips = chips,
            ContasWhatsapp = contasWhatsapp
        };
    }
}
