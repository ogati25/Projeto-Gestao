using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class ComputadorService
{
    private readonly IMongoCollection<Computador> _computadores;
    private readonly ProcessadorService _processadorService;

    public ComputadorService(IOptions<MongoDbSettings> settings, ProcessadorService processadorService)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _computadores = database.GetCollection<Computador>("Computadores");
        _processadorService = processadorService;
    }

    public async Task<List<object>> GetAllAsync()
    {
        var lista = await _computadores.Find(_ => true).ToListAsync();

        // Carrega todos os processadores de uma vez para evitar N+1 queries
        var todosProcessadores = await _processadorService.GetAllAsync();
        var procDict = todosProcessadores.ToDictionary(p => p.Id!, p => p);

        return lista.Select(c =>
        {
            Processador? proc = c.ProcessadorId != null && procDict.TryGetValue(c.ProcessadorId, out var p) ? p : null;
            return (object)MapearComputador(c, proc);
        }).ToList();
    }

    private static object MapearComputador(Computador c, Processador? processador = null) => new
    {
        c.Id,
        c.Codigo,
        c.Usuario,
        c.DataAquisicao,
        c.PrecoAquisicao,
        c.Ativo,
        c.Setor,
        c.Observacoes,
        c.Status,
        c.Modelo,
        c.Tipo,
        Processador = processador,
        c.GeracaoRAM,
        c.QuantidadeSlots,
        c.MemoriaRAM,
        c.MemoriaRAMTotal,
        c.VelocidadeRAM,
        c.QuantidadeDiscos,
        c.Discos,
        c.QuantidadePlacasVideo,
        c.PlacasVideo,
        c.QuantidadeConectoresVideo,
        c.ConectoresVideo,
        c.SistemaOperacional,
        c.AtivacaoSO,
        c.Office,
        c.AtivacaoOffice,
        c.IP
    };

    public async Task<Computador?> GetByIdAsync(string id) =>
        await _computadores.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Computador computador)
    {
        computador.MemoriaRAMTotal = computador.MemoriaRAM.Sum(m => (int)m);
        await _computadores.InsertOneAsync(computador);
    }

    public async Task UpdateAsync(string id, Computador computador)
    {
        var anterior = await GetByIdAsync(id);
        computador.MemoriaRAMTotal = computador.MemoriaRAM?.Sum(m => (int)m) ?? 0;
        computador.Id     = id;
        computador.Codigo = anterior?.Codigo ?? computador.Codigo; // preserva o Codigo original
        await _computadores.ReplaceOneAsync(c => c.Id == id, computador);
    }

    public async Task DeleteAsync(string id) =>
        await _computadores.DeleteOneAsync(c => c.Id == id);

    public async Task<object?> GetByIdComProcessadorAsync(string id)
    {
        var computador = await GetByIdAsync(id);
        if (computador == null) return null;

        Processador? processador = null;
        if (computador.ProcessadorId != null)
            processador = await _processadorService.GetByIdAsync(computador.ProcessadorId);

        return new
        {
            computador.Id,
            computador.Codigo,
            computador.Usuario,
            computador.DataAquisicao,
            computador.PrecoAquisicao,
            computador.Ativo,
            computador.Setor,
            computador.Observacoes,
            computador.Status,
            computador.Modelo,
            computador.Tipo,
            Processador = processador,
            computador.GeracaoRAM,
            computador.QuantidadeSlots,
            computador.MemoriaRAM,
            computador.MemoriaRAMTotal,
            computador.VelocidadeRAM,
            computador.QuantidadeDiscos,
            computador.Discos,
            computador.QuantidadePlacasVideo,
            computador.PlacasVideo,
            computador.QuantidadeConectoresVideo,
            computador.ConectoresVideo,
            computador.SistemaOperacional,
            computador.AtivacaoSO,
            computador.Office,
            computador.AtivacaoOffice,
            computador.IP
        };
    }
}
