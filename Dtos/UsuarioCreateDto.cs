using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;

namespace Projeto_Gestao.Dtos;

public class UsuarioCreateDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    public string Nome { get; set; } = null!;

    [Required(ErrorMessage = "O sobrenome é obrigatório.")]
    public string Sobrenome { get; set; } = null!;

    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email inválido.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "O setor é obrigatório.")]
    public Setor Setor { get; set; }

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres.")]
    public string Senha { get; set; } = null!;
}