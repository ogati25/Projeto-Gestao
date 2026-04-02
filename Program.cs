// É o ponto de entrada da aplicação. Ele é responsável por configurar e ligar tudo

using InventarioAtivos.Settings;
using InventarioAtivos.Services;

var builder = WebApplication.CreateBuilder(args);

// Registra as configurações do MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Registra o service pra poder ser injetado nos controllers
builder.Services.AddSingleton<ProdutoService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();