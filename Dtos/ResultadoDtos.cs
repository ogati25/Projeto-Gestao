// DTOs/RelatorioItemDto.cs
namespace Projeto_Gestao.DTOs;

/// <summary>
/// Representa uma linha normalizada no relatório,
/// independente de ser Computador, Monitor ou Celular.
/// </summary>
public class RelatorioItemDto
{
    public string Id            { get; set; } = string.Empty;
    public string Categoria     { get; set; } = string.Empty;   // Computador | Monitor | Celular
    public string Modelo        { get; set; } = string.Empty;
    public string Codigo        { get; set; } = string.Empty;
    public string Usuario       { get; set; } = string.Empty;
    public string Setor         { get; set; } = string.Empty;
    public string Status        { get; set; } = string.Empty;
    public bool   Ativo         { get; set; }
    public DateTime DataAquisicao { get; set; }
    public decimal PrecoAquisicao { get; set; }
    public string? Observacoes  { get; set; }

    // ── Campos específicos (preenchidos conforme a categoria) ──
    public string? Detalhes     { get; set; }   // resumo de specs em texto livre
}

/// <summary>
/// Resultado completo do relatório com os itens e os totalizadores.
/// </summary>
public class RelatorioResultadoDto
{
    public DateTime   GeradoEm     { get; set; } = DateTime.Now;
    public DateTime?  PeriodoInicio { get; set; }
    public DateTime?  PeriodoFim    { get; set; }

    public int TotalItens         { get; set; }
    public int TotalAtivos        { get; set; }
    public int TotalInativos      { get; set; }
    public int TotalEmManutencao  { get; set; }

    public int TotalComputadores  { get; set; }
    public int TotalMonitores     { get; set; }
    public int TotalCelulares     { get; set; }

    public decimal ValorTotalEstoque { get; set; }

    public List<RelatorioItemDto> Itens { get; set; } = new();
}