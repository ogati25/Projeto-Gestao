using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;

namespace Projeto_Gestao.Models;

public class Ramal : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public string? Cor { get; set; }

    public string? Tipo { get; set; }

    public bool Configurado { get; set; }

    public string? Linha { get; set; }
}