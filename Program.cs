using Projeto_Gestao.Settings;
using Projeto_Gestao.Services;


var builder = WebApplication.CreateBuilder(args);

// configurações do MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// configurações do serviço de e-mail (Gmail SMTP)
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddSingleton<EmailService>();

// registro dos services
// ProcessadorService primeiro pois ComputadorService depende dele
// ChipService primeiro pois CelularService depende dele
builder.Services.AddSingleton<OpcaoEnumService>();
builder.Services.AddSingleton<ProcessadorService>();
builder.Services.AddSingleton<ChipService>();
builder.Services.AddSingleton<ComputadorService>();
builder.Services.AddSingleton<CelularService>();
builder.Services.AddSingleton<MonitorService>();
builder.Services.AddSingleton<MouseService>();
builder.Services.AddSingleton<TecladoService>();
builder.Services.AddSingleton<FoneService>();
builder.Services.AddSingleton<RamalService>();
builder.Services.AddSingleton<ExtraService>();
builder.Services.AddSingleton<UsuarioService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
