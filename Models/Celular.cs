using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Celular : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    [Range(1, int.MaxValue, ErrorMessage = "Memória RAM inválida.")]
    public int MemoriaRAM { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Armazenamento inválido.")]
    public int Armazenamento { get; set; }

    public TipoConectorCarregador Conectividade { get; set; }

    // lista de IDs dos chips que estão no celular, máximo 2
    [MaximoElementos(2)]
    public List<string> ChipIds { get; set; } = new();

    // lista de IDs dos chips usados como whatsapp, máximo 6
    [MaximoElementos(6)]
    public List<string> ContasWhatsapp { get; set; } = new();
}