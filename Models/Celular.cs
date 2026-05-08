using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Celular : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    [Range(0, int.MaxValue, ErrorMessage = "Memória RAM inválida.")]
    public int MemoriaRAM { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Armazenamento inválido.")]
    public int Armazenamento { get; set; }

    public TipoConectorCarregador? Conectividade { get; set; }  // estático → enum

    public string? Operadora { get; set; }  // dinâmico → string?

    [MaximoElementos(2)]
    public List<string> ChipIds { get; set; } = new();

    [MaximoElementos(6)]
    public List<string> ContasWhatsapp { get; set; } = new();
}
