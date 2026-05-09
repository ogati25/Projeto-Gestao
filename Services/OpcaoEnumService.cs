using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class OpcaoEnumService
{
    private readonly IMongoCollection<OpcaoEnum> _opcoes;

    public OpcaoEnumService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _opcoes = database.GetCollection<OpcaoEnum>("OpcoesEnum");

        // índice único em (Tipo + Valor) para evitar duplicatas
        var index = Builders<OpcaoEnum>.IndexKeys
            .Ascending(o => o.Tipo)
            .Ascending(o => o.Valor);
        var indexModel = new CreateIndexModel<OpcaoEnum>(index, new CreateIndexOptions { Unique = true });
        _opcoes.Indexes.CreateOneAsync(indexModel);
    }

    // retorna todos os tipos agrupados: { "SistemaOperacional": ["Windows10", ...], ... }
    public async Task<Dictionary<string, List<string>>> GetAllAgrupadosAsync()
    {
        var lista = await _opcoes.Find(_ => true).SortBy(o => o.Tipo).ThenBy(o => o.Valor).ToListAsync();
        return lista
            .GroupBy(o => o.Tipo)
            .ToDictionary(g => g.Key, g => g.Select(o => o.Valor).ToList());
    }

    // retorna os valores de um tipo específico: ["Windows10", "Windows11", ...]
    public async Task<List<string>> GetByTipoAsync(string tipo)
    {
        var lista = await _opcoes
            .Find(o => o.Tipo == tipo)
            .SortBy(o => o.Valor)
            .ToListAsync();
        return lista.Select(o => o.Valor).ToList();
    }

    // verifica se um valor existe para um tipo — usado para validação
    public async Task<bool> ExisteAsync(string tipo, string valor)
    {
        var count = await _opcoes.CountDocumentsAsync(o => o.Tipo == tipo && o.Valor == valor);
        return count > 0;
    }

    // adiciona uma nova opção — retorna false se já existir
    public async Task<bool> CreateAsync(string tipo, string valor)
    {
        if (await ExisteAsync(tipo, valor)) return false;

        await _opcoes.InsertOneAsync(new OpcaoEnum { Tipo = tipo, Valor = valor });
        return true;
    }

    // remove uma opção pelo tipo + valor
    public async Task<bool> DeleteAsync(string tipo, string valor)
    {
        var resultado = await _opcoes.DeleteOneAsync(o => o.Tipo == tipo && o.Valor == valor);
        return resultado.DeletedCount > 0;
    }
}
