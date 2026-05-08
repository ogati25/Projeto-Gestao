using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Chip : Equipamento
{
    [Required]
    public string Operadora { get; set; } = null!;  // dinâmico → string

    [Required]
    [TelefoneInternacional]
    public string Numero { get; set; } = null!;

    public string? Dono { get; set; }

    public float Plano { get; set; }

    public string? CelularId { get; set; }
}
