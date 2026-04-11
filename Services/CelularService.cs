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

    public async Task CreateAsync(Celular celular) =>
        await _celulares.InsertOneAsync(celular);

    public async Task UpdateAsync(string id, Celular celular) =>
        await _celulares.ReplaceOneAsync(c => c.Id == id, celular);

    public async Task DeleteAsync(string id) =>
        await _celulares.DeleteOneAsync(c => c.Id == id);

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
