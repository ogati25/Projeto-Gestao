using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Projeto_Gestao.Settings;
using Projeto_Gestao.Services;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args        = args,
    WebRootPath = "view"
});

QuestPDF.Settings.License = LicenseType.Community;

// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Email
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

// JWT
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

var jwtKey = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey não configurada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer   = false,
            ValidateAudience = false,
            ClockSkew        = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddSingleton<JwtService>();
builder.Services.AddTransient<EmailService>();
builder.Services.AddSingleton<DashboardService>();
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
builder.Services.AddSingleton<RelatorioService>();

var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:5500";

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
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

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication(); // <- novo, antes do Authorization
app.UseAuthorization();
app.MapControllers();
app.Run();