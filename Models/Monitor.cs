using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Monitor : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    [Range(0, 100)]
    public float Tamanho { get; set; }

    public string? Resolucao { get; set; }  // dinâmico → string? (era enum Resolucao)

    public int Frequencia { get; set; }

    public bool HDMI { get; set; }
    public bool DisplayPort { get; set; }
    public bool VGA { get; set; }
    public bool DVI { get; set; }
}
