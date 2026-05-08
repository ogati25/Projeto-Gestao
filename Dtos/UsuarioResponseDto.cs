namespace Projeto_Gestao.Dtos;

public class UsuarioResponseDto
{
    public string Id { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string Sobrenome { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Setor { get; set; } = null!;  // dinâmico → string
    public DateTime CriadoEm { get; set; }
}
