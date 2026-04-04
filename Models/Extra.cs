using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Extra : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public string? Caracteristicas { get; set; }
}