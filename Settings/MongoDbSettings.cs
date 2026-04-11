// O appsettings.json é um arquivo de texto. Esse arquivo aqui é uma classe C# que representa aquelas configurações dentro do código. O .NET lê o JSON e preenche essa classe automaticamente

namespace Projeto_Gestao.Settings;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = null!;
    public string DatabaseName { get; set; } = null!;
}