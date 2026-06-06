// DTOs/RelatorioFiltroDto.cs
namespace Projeto_Gestao.DTOs;

/// <summary>
/// Parâmetros de entrada para geração do relatório.
/// Todos os campos são opcionais — sem filtro = todos os registros.
/// </summary>
public class RelatorioFiltroDto
{
    /// <summary>Data de início do período (baseada em DataAquisicao).</summary>
    public DateTime? DataInicio { get; set; }

    /// <summary>Data de fim do período (baseada em DataAquisicao).</summary>
    public DateTime? DataFim { get; set; }
}