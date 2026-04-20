using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class AuthenticateDto
{
    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email inválido.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    public string Senha { get; set; } = null!;
}