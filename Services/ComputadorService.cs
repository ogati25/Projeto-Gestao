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

    public async Task<List<Computador>> GetAllAsync() =>
        await _computadores.Find(_ => true).ToListAsync();

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
