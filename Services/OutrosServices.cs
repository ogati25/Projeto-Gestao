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

    public async Task UpdateAsync(string id, Projeto_Gestao.Models.Monitor monitor) =>
    await _monitores.ReplaceOneAsync(m => m.Id == id, monitor);

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

    public async Task UpdateAsync(string id, Mouse mouse) =>
        await _mouses.ReplaceOneAsync(m => m.Id == id, mouse);

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

    public async Task UpdateAsync(string id, Teclado teclado) =>
        await _teclados.ReplaceOneAsync(t => t.Id == id, teclado);

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

    public async Task UpdateAsync(string id, Fone fone) =>
        await _fones.ReplaceOneAsync(f => f.Id == id, fone);

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

    public async Task UpdateAsync(string id, Ramal ramal) =>
        await _ramais.ReplaceOneAsync(r => r.Id == id, ramal);

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

    public async Task UpdateAsync(string id, Extra extra) =>
        await _extras.ReplaceOneAsync(e => e.Id == id, extra);

    public async Task DeleteAsync(string id) =>
        await _extras.DeleteOneAsync(e => e.Id == id);
}
