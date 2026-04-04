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

    public string? GeracaoRAM { get; set; }

    [Range(1, 16)]
    public int QuantidadeSlots { get; set; }

    [ListaSize(nameof(QuantidadeSlots))]
    public List<TipoMemoriaRAM> MemoriaRAM { get; set; } = new();

    // calculado automaticamente pelo service, não vem do frontend
    public int MemoriaRAMTotal { get; set; }

    public int VelocidadeRAM { get; set; }

    [Range(1, 20)]
    public int QuantidadeDiscos { get; set; }

    [ListaSize(nameof(QuantidadeDiscos))]
    public List<(TipoDisco Tipo, int Tamanho)> Discos { get; set; } = new();

    [Range(0, 5)]
    public int QuantidadePlacasVideo { get; set; }

    [ListaSize(nameof(QuantidadePlacasVideo))]
    public List<(TipoPlacaVideo Tipo, int VRAM)> PlacasVideo { get; set; } = new();

    [Range(0, 15)]
    public int QuantidadeConectoresVideo { get; set; }

    [ListaSize(nameof(QuantidadeConectoresVideo))]
    public List<TipoConectorVideo> ConectoresVideo { get; set; } = new();

    public SistemaOperacional SistemaOperacional { get; set; }
    public AtivacaoSO AtivacaoSO { get; set; }
    public TipoOffice Office { get; set; }
    public AtivacaoOffice AtivacaoOffice { get; set; }
}