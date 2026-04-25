using Projeto_Gestao.Enums;

namespace Projeto_Gestao.Dtos;

public class UsuarioResponseDto
{
    public string Id { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string Sobrenome { get; set; } = null!;
    public string Email { get; set; } = null!;
    public Setor Setor { get; set; }
    public DateTime CriadoEm { get; set; }
}