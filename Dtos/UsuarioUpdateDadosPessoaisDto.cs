using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Dtos;

public class UsuarioUpdateDadosPessoaisDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    public string Nome { get; set; } = null!;

    [Required(ErrorMessage = "O sobrenome é obrigatório.")]
    public string Sobrenome { get; set; } = null!;

    [Required(ErrorMessage = "O setor é obrigatório.")]
    public string Setor { get; set; } = null!;  // dinâmico → string
}
