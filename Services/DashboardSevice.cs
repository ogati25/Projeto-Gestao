using MongoDB.Driver;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;
using Computador = Projeto_Gestao.Models.Computador;
using Monitor    = Projeto_Gestao.Models.Monitor;
using Celular    = Projeto_Gestao.Models.Celular;

namespace Projeto_Gestao.Services;

public class DashboardService
{
    private readonly IMongoCollection<Computador> _computadores;
    private readonly IMongoCollection<Monitor>    _monitores;
    private readonly IMongoCollection<Celular>    _celulares;

    public DashboardService(IOptions<MongoDbSettings> settings)
    {
        var client   = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _computadores = database.GetCollection<Computador>("Computadores");
        _monitores    = database.GetCollection<Monitor>("Monitores");
        _celulares    = database.GetCollection<Celular>("Celulares");
    }

    // ✅ Valores exatos das strings no MongoDB
    private static readonly string[] StatusManutencao = ["EmManutenção", "NecessitaManutenção"];

    // ── Total de itens ────────────────────────────────────────────────────────
    public async Task<object> GetTotaisAsync()
    {
        var totalComp = await _computadores.CountDocumentsAsync(_ => true);
        var totalMon  = await _monitores.CountDocumentsAsync(_ => true);
        var totalCel  = await _celulares.CountDocumentsAsync(_ => true);

        return new
        {
            Total        = totalComp + totalMon + totalCel,
            Computadores = totalComp,
            Monitores    = totalMon,
            Celulares    = totalCel
        };
    }

    // ── Em manutenção (card + tabela) ─────────────────────────────────────────
    public async Task<object> GetBaixoEstoqueAsync()
    {
        // ✅ Filtro por string, fortemente tipado via lambda
        var filtroComp = Builders<Computador>.Filter.In(c => c.Status, StatusManutencao);
        var filtroMon  = Builders<Monitor>.Filter.In(m => m.Status, StatusManutencao);
        var filtroCel  = Builders<Celular>.Filter.In(c => c.Status, StatusManutencao);

        var compManut = await _computadores.CountDocumentsAsync(filtroComp);
        var monManut  = await _monitores.CountDocumentsAsync(filtroMon);
        var celManut  = await _celulares.CountDocumentsAsync(filtroCel);

        return new
        {
            Total        = compManut + monManut + celManut,
            Computadores = compManut,
            Monitores    = monManut,
            Celulares    = celManut
        };
    }

    // ── Distribuição por categoria (gráfico pizza + barras) ───────────────────
    public async Task<object> GetDistribuicaoPorCategoriaAsync()
    {
        var totalComp = await _computadores.CountDocumentsAsync(_ => true);
        var totalMon  = await _monitores.CountDocumentsAsync(_ => true);
        var totalCel  = await _celulares.CountDocumentsAsync(_ => true);
        var total     = totalComp + totalMon + totalCel;

        return new
        {
            Categorias = new[]
            {
                new { Nome = "Computadores", Quantidade = totalComp, Percentual = total > 0 ? Math.Round((double)totalComp / total * 100, 1) : 0.0 },
                new { Nome = "Monitores",    Quantidade = totalMon,  Percentual = total > 0 ? Math.Round((double)totalMon  / total * 100, 1) : 0.0 },
                new { Nome = "Celulares",    Quantidade = totalCel,  Percentual = total > 0 ? Math.Round((double)totalCel  / total * 100, 1) : 0.0 }
            }
        };
    }

    // ── Ativos vs Inativos por categoria ──────────────────────────────────────
    public async Task<object> GetOcupacaoPorCategoriaAsync()
    {
        var compAtivos = await _computadores.CountDocumentsAsync(c => c.Ativo == true);
        var compTotal  = await _computadores.CountDocumentsAsync(_ => true);
        var monAtivos  = await _monitores.CountDocumentsAsync(m => m.Ativo == true);
        var monTotal   = await _monitores.CountDocumentsAsync(_ => true);
        var celAtivos  = await _celulares.CountDocumentsAsync(c => c.Ativo == true);
        var celTotal   = await _celulares.CountDocumentsAsync(_ => true);

        return new
        {
            Categorias = new[]
            {
                new { Nome = "Computadores", Ativos = compAtivos, Inativos = compTotal - compAtivos, Total = compTotal, Percentual = compTotal > 0 ? Math.Round((double)compAtivos / compTotal * 100, 1) : 0.0 },
                new { Nome = "Monitores",    Ativos = monAtivos,  Inativos = monTotal  - monAtivos,  Total = monTotal,  Percentual = monTotal  > 0 ? Math.Round((double)monAtivos  / monTotal  * 100, 1) : 0.0 },
                new { Nome = "Celulares",    Ativos = celAtivos,  Inativos = celTotal  - celAtivos,  Total = celTotal,  Percentual = celTotal  > 0 ? Math.Round((double)celAtivos  / celTotal  * 100, 1) : 0.0 }
            }
        };
    }

    // ── Itens em manutenção para a tabela ─────────────────────────────────────
    public async Task<object> GetItensCriticosAsync(int limite = 10)
    {
        // ✅ Filtro por string, fortemente tipado via lambda
        var filtroComp = Builders<Computador>.Filter.In(c => c.Status, StatusManutencao);
        var filtroMon  = Builders<Monitor>.Filter.In(m => m.Status, StatusManutencao);
        var filtroCel  = Builders<Celular>.Filter.In(c => c.Status, StatusManutencao);

        var computadores = await _computadores.Find(filtroComp).Limit(limite).ToListAsync();
        var monitores    = await _monitores.Find(filtroMon).Limit(limite).ToListAsync();
        var celulares    = await _celulares.Find(filtroCel).Limit(limite).ToListAsync();

        var itens = new List<object>();
        itens.AddRange(computadores.Select(c => (object)new { Id = c.Id, Nome = c.Modelo, SKU = c.Codigo, Categoria = "Computador", Status = c.Status, Ativo = c.Ativo }));
        itens.AddRange(monitores.Select(m   => (object)new { Id = m.Id, Nome = m.Modelo, SKU = m.Codigo, Categoria = "Monitor",    Status = m.Status, Ativo = m.Ativo }));
        itens.AddRange(celulares.Select(c   => (object)new { Id = c.Id, Nome = c.Modelo, SKU = c.Codigo, Categoria = "Celular",    Status = c.Status, Ativo = c.Ativo }));

        return new { Itens = itens.Take(limite).ToList() };
    }

    // ── Atividades recentes ───────────────────────────────────────────────────
    public async Task<object> GetAtividadesRecentesAsync(int limite = 10)
    {
        var sortComp = Builders<Computador>.Sort.Descending(c => c.DataAquisicao);
        var sortMon  = Builders<Monitor>.Sort.Descending(m => m.DataAquisicao);
        var sortCel  = Builders<Celular>.Sort.Descending(c => c.DataAquisicao);

        var computadores = await _computadores.Find(_ => true).Sort(sortComp).Limit(limite).ToListAsync();
        var monitores    = await _monitores.Find(_ => true).Sort(sortMon).Limit(limite).ToListAsync();
        var celulares    = await _celulares.Find(_ => true).Sort(sortCel).Limit(limite).ToListAsync();

        var atividades = new List<(DateTime Data, object Item)>();
        atividades.AddRange(computadores.Select(c => (c.DataAquisicao, (object)new { Id = c.Id, Nome = c.Modelo, Categoria = "Computador", DataAquisicao = c.DataAquisicao, Status = c.Status, Usuario = c.Usuario })));
        atividades.AddRange(monitores.Select(m   => (m.DataAquisicao, (object)new { Id = m.Id, Nome = m.Modelo, Categoria = "Monitor",    DataAquisicao = m.DataAquisicao, Status = m.Status, Usuario = m.Usuario })));
        atividades.AddRange(celulares.Select(c   => (c.DataAquisicao, (object)new { Id = c.Id, Nome = c.Modelo, Categoria = "Celular",    DataAquisicao = c.DataAquisicao, Status = c.Status, Usuario = c.Usuario })));

        var recentes = atividades.OrderByDescending(a => a.Data).Take(limite).Select(a => a.Item).ToList();
        return new { Atividades = recentes };
    }

    // ── Resumo completo ───────────────────────────────────────────────────────
    public async Task<object> GetResumoCompletoAsync()
    {
        var totais       = await GetTotaisAsync();
        var baixoEstoque = await GetBaixoEstoqueAsync();
        var distribuicao = await GetDistribuicaoPorCategoriaAsync();
        var ocupacao     = await GetOcupacaoPorCategoriaAsync();
        var criticos     = await GetItensCriticosAsync(10);
        var atividades   = await GetAtividadesRecentesAsync(10);

        return new
        {
            Totais        = totais,
            BaixoEstoque  = baixoEstoque,
            Distribuicao  = distribuicao,
            Ocupacao      = ocupacao,
            ItensCriticos = criticos,
            Atividades    = atividades
        };
    }
}