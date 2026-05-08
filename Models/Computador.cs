using System.ComponentModel.DataAnnotations;
using Projeto_Gestao.Enums;
using Projeto_Gestao.Models.Base;
using Projeto_Gestao.Validations;

namespace Projeto_Gestao.Models;

public class Computador : Equipamento
{
    [Required]
    public string Modelo { get; set; } = null!;

    [Required]
    public TipoComputador Tipo { get; set; }

    // referência ao ID do processador
    public string? ProcessadorId { get; set; }

    public GeracaoRAM? GeracaoRAM { get; set; }

    [Range(0, 16)]
    public int QuantidadeSlots { get; set; }

    [ListaSize(nameof(QuantidadeSlots))]
    public List<TipoMemoriaRAM> MemoriaRAM { get; set; } = new();

    // calculado automaticamente pelo service, não vem do frontend
    public int MemoriaRAMTotal { get; set; }

    public int VelocidadeRAM { get; set; }

    [Range(0, 20)]
    public int QuantidadeDiscos { get; set; }

    [ListaSize(nameof(QuantidadeDiscos))]
    public List<DiscoInfo>      Discos      { get; set; } = new();

    [Range(0, 5)]
    public int QuantidadePlacasVideo { get; set; }

    [ListaSize(nameof(QuantidadePlacasVideo))]
    public List<PlacaVideoInfo> PlacasVideo { get; set; } = new();

    [Range(0, 15)]
    public int QuantidadeConectoresVideo { get; set; }

    [ListaSize(nameof(QuantidadeConectoresVideo))]
    public List<TipoConectorVideo> ConectoresVideo { get; set; } = new();

    public SistemaOperacional? SistemaOperacional { get; set; }
    public AtivacaoSO? AtivacaoSO { get; set; }
    public TipoOffice? Office { get; set; }
    public AtivacaoOffice? AtivacaoOffice { get; set; }

    public string? IP { get; set; }
}