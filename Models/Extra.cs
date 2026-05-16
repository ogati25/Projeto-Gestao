using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Extra : Equipamento
{
    [Required]
    public string Categoria { get; set; } = null!;

    public string? Descricao { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Quantidade inválida.")]
    public int Quantidade { get; set; }
}