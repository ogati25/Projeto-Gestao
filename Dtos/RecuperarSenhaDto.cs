using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class RecuperarSenhaDto
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    public string Email { get; set; } = null!;
}
