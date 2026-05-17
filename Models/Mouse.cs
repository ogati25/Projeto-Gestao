using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Mouse : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public string? Tipo { get; set; }          // dinâmico → string? (era TipoPeriferico)
    public string? Conectividade { get; set; } // dinâmico → string? (era Conectividade)
}
