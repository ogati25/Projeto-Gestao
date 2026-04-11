using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Fone : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public TipoPeriferico Tipo { get; set; }

    public bool Microfone { get; set; }

    public Conectividade Conectividade { get; set; }
}