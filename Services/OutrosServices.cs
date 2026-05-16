using MongoDB.Driver;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;

namespace Projeto_Gestao.Services;

public class MonitorService
{
    private readonly IMongoCollection<Projeto_Gestao.Models.Monitor> _monitores;

    public MonitorService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _monitores = database.GetCollection<Projeto_Gestao.Models.Monitor>("Monitores");
    }

    public async Task<List<Projeto_Gestao.Models.Monitor>> GetAllAsync() =>
        await _monitores.Find(_ => true).ToListAsync();

    public async Task<Projeto_Gestao.Models.Monitor?> GetByIdAsync(string id) =>
        await _monitores.Find(m => m.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Projeto_Gestao.Models.Monitor monitor) =>
        await _monitores.InsertOneAsync(monitor);

    public async Task UpdateAsync(string id, Projeto_Gestao.Models.Monitor monitor)
    {
        var filtro = Builders<Projeto_Gestao.Models.Monitor>.Filter.Eq(m => m.Id, id);
        var update = Builders<Projeto_Gestao.Models.Monitor>.Update
            .Set(m => m.Codigo,         monitor.Codigo)
            .Set(m => m.Usuario,        monitor.Usuario)
            .Set(m => m.Setor,          monitor.Setor)
            .Set(m => m.Status,         monitor.Status)
            .Set(m => m.Ativo,          monitor.Ativo)
            .Set(m => m.Observacoes,    monitor.Observacoes)
            .Set(m => m.DataAquisicao,  monitor.DataAquisicao)
            .Set(m => m.PrecoAquisicao, monitor.PrecoAquisicao)
            .Set(m => m.Modelo,         monitor.Modelo)
            .Set(m => m.Tamanho,        monitor.Tamanho)
            .Set(m => m.Resolucao,      monitor.Resolucao)
            .Set(m => m.Frequencia,     monitor.Frequencia)
            .Set(m => m.HDMI,           monitor.HDMI)
            .Set(m => m.DisplayPort,    monitor.DisplayPort)
            .Set(m => m.VGA,            monitor.VGA)
            .Set(m => m.DVI,            monitor.DVI);
        await _monitores.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _monitores.DeleteOneAsync(m => m.Id == id);
}

public class MouseService
{
    private readonly IMongoCollection<Mouse> _mouses;

    public MouseService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _mouses = database.GetCollection<Mouse>("Mouses");
    }

    public async Task<List<Mouse>> GetAllAsync() =>
        await _mouses.Find(_ => true).ToListAsync();

    public async Task<Mouse?> GetByIdAsync(string id) =>
        await _mouses.Find(m => m.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Mouse mouse) =>
        await _mouses.InsertOneAsync(mouse);

    public async Task UpdateAsync(string id, Mouse mouse)
    {
        var filtro = Builders<Mouse>.Filter.Eq(m => m.Id, id);
        var update = Builders<Mouse>.Update
            .Set(m => m.Codigo,         mouse.Codigo)
            .Set(m => m.Usuario,        mouse.Usuario)
            .Set(m => m.Setor,          mouse.Setor)
            .Set(m => m.Status,         mouse.Status)
            .Set(m => m.Ativo,          mouse.Ativo)
            .Set(m => m.Observacoes,    mouse.Observacoes)
            .Set(m => m.DataAquisicao,  mouse.DataAquisicao)
            .Set(m => m.PrecoAquisicao, mouse.PrecoAquisicao)
            .Set(m => m.Modelo,         mouse.Modelo)
            .Set(m => m.Tipo,           mouse.Tipo)
            .Set(m => m.Conectividade,  mouse.Conectividade);
        await _mouses.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _mouses.DeleteOneAsync(m => m.Id == id);
}

public class TecladoService
{
    private readonly IMongoCollection<Teclado> _teclados;

    public TecladoService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _teclados = database.GetCollection<Teclado>("Teclados");
    }

    public async Task<List<Teclado>> GetAllAsync() =>
        await _teclados.Find(_ => true).ToListAsync();

    public async Task<Teclado?> GetByIdAsync(string id) =>
        await _teclados.Find(t => t.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Teclado teclado) =>
        await _teclados.InsertOneAsync(teclado);

    public async Task UpdateAsync(string id, Teclado teclado)
    {
        var filtro = Builders<Teclado>.Filter.Eq(t => t.Id, id);
        var update = Builders<Teclado>.Update
            .Set(t => t.Codigo,         teclado.Codigo)
            .Set(t => t.Usuario,        teclado.Usuario)
            .Set(t => t.Setor,          teclado.Setor)
            .Set(t => t.Status,         teclado.Status)
            .Set(t => t.Ativo,          teclado.Ativo)
            .Set(t => t.Observacoes,    teclado.Observacoes)
            .Set(t => t.DataAquisicao,  teclado.DataAquisicao)
            .Set(t => t.PrecoAquisicao, teclado.PrecoAquisicao)
            .Set(t => t.Modelo,         teclado.Modelo)
            .Set(t => t.Tipo,           teclado.Tipo)
            .Set(t => t.Conectividade,  teclado.Conectividade)
            .Set(t => t.Tamanho,        teclado.Tamanho)
            .Set(t => t.Switch,         teclado.Switch);
        await _teclados.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _teclados.DeleteOneAsync(t => t.Id == id);
}

public class FoneService
{
    private readonly IMongoCollection<Fone> _fones;

    public FoneService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _fones = database.GetCollection<Fone>("Fones");
    }

    public async Task<List<Fone>> GetAllAsync() =>
        await _fones.Find(_ => true).ToListAsync();

    public async Task<Fone?> GetByIdAsync(string id) =>
        await _fones.Find(f => f.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Fone fone) =>
        await _fones.InsertOneAsync(fone);

    public async Task UpdateAsync(string id, Fone fone)
    {
        var filtro = Builders<Fone>.Filter.Eq(f => f.Id, id);
        var update = Builders<Fone>.Update
            .Set(f => f.Codigo,         fone.Codigo)
            .Set(f => f.Usuario,        fone.Usuario)
            .Set(f => f.Setor,          fone.Setor)
            .Set(f => f.Status,         fone.Status)
            .Set(f => f.Ativo,          fone.Ativo)
            .Set(f => f.Observacoes,    fone.Observacoes)
            .Set(f => f.DataAquisicao,  fone.DataAquisicao)
            .Set(f => f.PrecoAquisicao, fone.PrecoAquisicao)
            .Set(f => f.Modelo,         fone.Modelo)
            .Set(f => f.Tipo,           fone.Tipo)
            .Set(f => f.Microfone,      fone.Microfone)
            .Set(f => f.Conectividade,  fone.Conectividade);
        await _fones.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _fones.DeleteOneAsync(f => f.Id == id);
}

public class RamalService
{
    private readonly IMongoCollection<Ramal> _ramais;

    public RamalService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _ramais = database.GetCollection<Ramal>("Ramais");
    }

    public async Task<List<Ramal>> GetAllAsync() =>
        await _ramais.Find(_ => true).ToListAsync();

    public async Task<Ramal?> GetByIdAsync(string id) =>
        await _ramais.Find(r => r.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Ramal ramal) =>
        await _ramais.InsertOneAsync(ramal);

    public async Task UpdateAsync(string id, Ramal ramal)
    {
        var filtro = Builders<Ramal>.Filter.Eq(r => r.Id, id);
        var update = Builders<Ramal>.Update
            .Set(r => r.Codigo,         ramal.Codigo)
            .Set(r => r.Usuario,        ramal.Usuario)
            .Set(r => r.Setor,          ramal.Setor)
            .Set(r => r.Status,         ramal.Status)
            .Set(r => r.Ativo,          ramal.Ativo)
            .Set(r => r.Observacoes,    ramal.Observacoes)
            .Set(r => r.DataAquisicao,  ramal.DataAquisicao)
            .Set(r => r.PrecoAquisicao, ramal.PrecoAquisicao)
            .Set(r => r.Modelo,         ramal.Modelo)
            .Set(r => r.Cor,            ramal.Cor)
            .Set(r => r.Tipo,           ramal.Tipo)
            .Set(r => r.Configurado,    ramal.Configurado)
            .Set(r => r.Linha,          ramal.Linha)
            .Set(r => r.Numero,         ramal.Numero)
            .Set(r => r.IP,             ramal.IP)
            .Set(r => r.MAC,            ramal.MAC);
        await _ramais.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _ramais.DeleteOneAsync(r => r.Id == id);
}

public class ExtraService
{
    private readonly IMongoCollection<Extra> _extras;

    public ExtraService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _extras = database.GetCollection<Extra>("Extras");
    }

    public async Task<List<Extra>> GetAllAsync() =>
        await _extras.Find(_ => true).ToListAsync();

    public async Task<Extra?> GetByIdAsync(string id) =>
        await _extras.Find(e => e.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(Extra extra) =>
        await _extras.InsertOneAsync(extra);

    public async Task UpdateAsync(string id, Extra extra)
    {
        var filtro = Builders<Extra>.Filter.Eq(e => e.Id, id);
        var update = Builders<Extra>.Update
            .Set(e => e.Codigo,         extra.Codigo)
            .Set(e => e.Usuario,        extra.Usuario)
            .Set(e => e.Setor,          extra.Setor)
            .Set(e => e.Status,         extra.Status)
            .Set(e => e.Ativo,          extra.Ativo)
            .Set(e => e.Observacoes,    extra.Observacoes)
            .Set(e => e.DataAquisicao,  extra.DataAquisicao)
            .Set(e => e.PrecoAquisicao, extra.PrecoAquisicao)
            .Set(e => e.Categoria,      extra.Categoria)
            .Set(e => e.Descricao,      extra.Descricao)
            .Set(e => e.Quantidade,     extra.Quantidade);
        await _extras.UpdateOneAsync(filtro, update);
    }

    public async Task DeleteAsync(string id) =>
        await _extras.DeleteOneAsync(e => e.Id == id);
}
