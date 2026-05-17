namespace Projeto_Gestao.Settings;

public class EmailSettings
{
    public string SmtpHost { get; set; } = null!;
    public int SmtpPort { get; set; }
    public string RemetentEmail { get; set; } = null!;
    public string RemetentNome { get; set; } = null!;
    public string Senha { get; set; } = null!;

    /// <summary>
    /// URL base do frontend — usada para montar os links nos e-mails.
    /// Ex: "http://localhost:5500" ou "https://meusite.com"
    /// </summary>
    public string UrlBase { get; set; } = null!;
}
