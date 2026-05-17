using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Computador : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    public string? Tipo { get; set; }              // dinâmico → string? (era TipoComputador)

    public string? ProcessadorId { get; set; }

    public string? GeracaoRAM { get; set; }        // dinâmico → string?

    [Range(0, 16)]
    public int QuantidadeSlots { get; set; }

    // Cada slot armazena o tamanho em GB como inteiro (ex: 8, 16, 32).
    // O frontend envia strings do tipo "8GB" que são convertidas para int antes do envio.
    [ListaSize(nameof(QuantidadeSlots))]
    public List<int> MemoriaRAM { get; set; } = new();

    public int MemoriaRAMTotal { get; set; }

    public int VelocidadeRAM { get; set; }

    [Range(0, 20)]
    public int QuantidadeDiscos { get; set; }

    [ListaSize(nameof(QuantidadeDiscos))]
    public List<DiscoInfo> Discos { get; set; } = new();

    [Range(0, 5)]
    public int QuantidadePlacasVideo { get; set; }

    [ListaSize(nameof(QuantidadePlacasVideo))]
    public List<PlacaVideoInfo> PlacasVideo { get; set; } = new();

    [Range(0, 15)]
    public int QuantidadeConectoresVideo { get; set; }

    // Conectores de vídeo como lista de strings dinâmicas (era List<TipoConectorVideo>)
    [ListaSize(nameof(QuantidadeConectoresVideo))]
    public List<string> ConectoresVideo { get; set; } = new();

    public string? SistemaOperacional { get; set; }  // dinâmico → string?
    public string? AtivacaoSO         { get; set; }  // dinâmico → string?
    public string? Office             { get; set; }  // dinâmico → string?
    public string? AtivacaoOffice     { get; set; }  // dinâmico → string?

    public string? IP { get; set; }
}
