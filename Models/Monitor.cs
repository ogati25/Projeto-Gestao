using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Monitor : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    [Range(1, 100)]
    public float Tamanho { get; set; }

    public Resolucao Resolucao { get; set; }

    public int Frequencia { get; set; }

    public bool HDMI { get; set; }
    public bool DisplayPort { get; set; }
    public bool VGA { get; set; }
    public bool DVI { get; set; }
}