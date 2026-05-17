using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Teclado : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public string? Tipo { get; set; }          // dinâmico → string? (era TipoPeriferico)
    public string? Conectividade { get; set; } // dinâmico → string? (era Conectividade)

    [Range(0, 100)]
    public int Tamanho { get; set; }

    public string? Switch { get; set; }        // dinâmico → string? (era Switch)
}
