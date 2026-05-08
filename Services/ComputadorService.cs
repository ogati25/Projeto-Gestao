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
        return lista.Select(c => (object)MapearComputador(c)).ToList();
    }

    private static object MapearComputador(Computador c) => new
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
        c.GeracaoRAM,
        c.QuantidadeSlots,
        c.MemoriaRAM,
        c.MemoriaRAMTotal,
        c.VelocidadeRAM,
        c.QuantidadeDiscos,
        Discos = c.Discos.Select(d => new { Tipo = d.Tipo.HasValue ? d.Tipo.ToString() : (string?)null, d.Tamanho }),
        c.QuantidadePlacasVideo,
        PlacasVideo = c.PlacasVideo.Select(p => new { Tipo = p.Tipo.HasValue ? p.Tipo.ToString() : (string?)null, p.VRAM }),
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
        // calcula a memória RAM total somando os valores do enum
        computador.MemoriaRAMTotal = computador.MemoriaRAM.Sum(m => (int)m);
        await _computadores.InsertOneAsync(computador);
    }

    public async Task UpdateAsync(string id, Computador computador)
    {
        // recalcula a memória RAM total na atualização também
        computador.MemoriaRAMTotal = computador.MemoriaRAM?.Sum(m => (int)m) ?? 0;
        computador.Id = id;
        await _computadores.ReplaceOneAsync(c => c.Id == id, computador); 
    }

    public async Task DeleteAsync(string id) =>
        await _computadores.DeleteOneAsync(c => c.Id == id);

    // busca o computador com as informações do processador resolvidas
    public async Task<object?> GetByIdComProcessadorAsync(string id)
    {
        var computador = await GetByIdAsync(id);
        if (computador == null) return null;

        Processador? processador = null;
        if (computador.ProcessadorId != null)
            processador = await _processadorService.GetByIdAsync(computador.ProcessadorId);

        // retorna um objeto anônimo com os dados do computador e o processador resolvido
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
            Discos = computador.Discos.Select(d => new { Tipo = d.Tipo.HasValue ? d.Tipo.ToString() : (string?)null, d.Tamanho }),
            computador.QuantidadePlacasVideo,
            PlacasVideo = computador.PlacasVideo.Select(p => new { Tipo = p.Tipo.HasValue ? p.Tipo.ToString() : (string?)null, p.VRAM }),
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
