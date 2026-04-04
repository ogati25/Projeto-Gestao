using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Mouse : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public TipoPeriferico Tipo { get; set; }
    public Conectividade Conectividade { get; set; }
}