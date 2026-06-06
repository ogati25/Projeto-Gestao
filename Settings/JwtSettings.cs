namespace Projeto_Gestao.Settings;

public class JwtSettings
{
    public string SecretKey { get; set; } = null!;
    public int ExpiracaoHoras { get; set; } = 8;
}