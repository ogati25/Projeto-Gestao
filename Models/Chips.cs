using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Chip : Equipamento
{
    [Required]
    public Operadora Operadora { get; set; }

    [Required]
    [TelefoneInternacional]
    public string Numero { get; set; } = null!;

    public string? Dono { get; set; }

    // referência ao ID do celular onde o chip está
    // pode ser nulo se o chip não estiver em nenhum celular
    public string? CelularId { get; set; }
}