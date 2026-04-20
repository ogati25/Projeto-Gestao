using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;

namespace Projeto_Gestao.Dtos;

public class UsuarioUpdateDadosPessoaisDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    public string Nome { get; set; } = null!;

    [Required(ErrorMessage = "O sobrenome é obrigatório.")]
    public string Sobrenome { get; set; } = null!;

    [Required(ErrorMessage = "O setor é obrigatório.")]
    public Setor Setor { get; set; }
}