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

    public async Task<List<Celular>> GetAllAsync() =>
        await _celulares.Find(_ => true).ToListAsync();

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
        var antigos  = (anterior?.ChipIds ?? new()).Union(anterior?.ContasWhatsapp ?? new()).ToList();

        await _celulares.ReplaceOneAsync(c => c.Id == id, celular);
        await VincularChipsAsync(id, celular.ChipIds, celular.ContasWhatsapp, antigos);
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
        List<string>? antigos = null)
    {
        var novos = chipIds.Union(contasWhatsapp).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

        // Desvincular chips que saíram
        if (antigos != null)
        {
            var removidos = antigos.Except(novos).ToList();
            await DesvincularChipsAsync(removidos);
        }

        // Vincular chips novos/mantidos
        foreach (var chipId in novos)
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
