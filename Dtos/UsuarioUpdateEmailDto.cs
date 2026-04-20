using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class UsuarioUpdateEmailDto
{
    [Required(ErrorMessage = "O novo email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email inválido.")]
    public string NovoEmail { get; set; } = null!;
}