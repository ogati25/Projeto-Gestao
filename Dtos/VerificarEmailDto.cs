using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class VerificarEmailDto
{
    [Required(ErrorMessage = "O token é obrigatório.")]
    public string Token { get; set; } = null!;
}
