using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Teclado : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public TipoPeriferico Tipo { get; set; }
    public Conectividade Conectividade { get; set; }

    [Range(0, 100)]
    public int Tamanho { get; set; }

    public Switch Switch { get; set; }
}