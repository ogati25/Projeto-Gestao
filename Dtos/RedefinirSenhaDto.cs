using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class RedefinirSenhaDto
{
    [Required(ErrorMessage = "O token é obrigatório.")]
    public string Token { get; set; } = null!;

    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres.")]
    public string NovaSenha { get; set; } = null!;
}
