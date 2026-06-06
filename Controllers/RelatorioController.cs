// Controllers/RelatorioController.cs
using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.DTOs;
using Projeto_Gestao.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace Projeto_Gestao.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RelatorioController : ControllerBase
{
    private readonly RelatorioService _service;

    public RelatorioController(RelatorioService service) => _service = service;

    // ─────────────────────────────────────────────────────────────────────────
    // GET api/relatorio/preview?dataInicio=2024-01-01&dataFim=2024-12-31
    //
    // Retorna JSON com os dados estruturados — usado pelo front para o preview
    // antes de gerar o arquivo final.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("preview")]
    [ProducesResponseType(typeof(RelatorioResultadoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPreview(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        CancellationToken ct)
    {
        var erroValidacao = ValidarDatas(dataInicio, dataFim);
        if (erroValidacao is not null)
            return BadRequest(new { Erro = erroValidacao });

        var filtro    = new RelatorioFiltroDto { DataInicio = dataInicio, DataFim = dataFim };
        var resultado = await _service.GerarResultadoAsync(filtro);
        return Ok(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET api/relatorio/pdf?dataInicio=2024-01-01&dataFim=2024-12-31
    //
    // Retorna o arquivo PDF para download direto.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GerarPdf(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        CancellationToken ct)
    {
        var erroValidacao = ValidarDatas(dataInicio, dataFim);
        if (erroValidacao is not null)
            return BadRequest(new { Erro = erroValidacao });

        var filtro   = new RelatorioFiltroDto { DataInicio = dataInicio, DataFim = dataFim };
        var pdfBytes = await _service.GerarPdfAsync(filtro);

        var nomeArquivo = GerarNomeArquivo("Relatorio-Ativos", dataInicio, dataFim, "pdf");

        return File(
            pdfBytes,
            "application/pdf",
            nomeArquivo
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET api/relatorio/excel?dataInicio=2024-01-01&dataFim=2024-12-31
    //
    // Retorna o arquivo Excel (.xlsx) para download direto.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("excel")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GerarExcel(
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        CancellationToken ct)
    {
        var erroValidacao = ValidarDatas(dataInicio, dataFim);
        if (erroValidacao is not null)
            return BadRequest(new { Erro = erroValidacao });

        var filtro      = new RelatorioFiltroDto { DataInicio = dataInicio, DataFim = dataFim };
        var excelBytes  = await _service.GerarExcelAsync(filtro);

        var nomeArquivo = GerarNomeArquivo("Relatorio-Ativos", dataInicio, dataFim, "xlsx");

        return File(
            excelBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            nomeArquivo
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────────────────────────────────────

    private static string? ValidarDatas(DateTime? inicio, DateTime? fim)
    {
        if (inicio.HasValue && fim.HasValue && inicio > fim)
            return "A data de início não pode ser posterior à data de fim.";

        if (inicio.HasValue && inicio.Value > DateTime.Today)
            return "A data de início não pode ser no futuro.";

        return null;
    }

    private static string GerarNomeArquivo(
        string prefixo, DateTime? inicio, DateTime? fim, string extensao)
    {
        var periodo = (inicio, fim) switch
        {
            ({ } i, { } f) => $"{i:yyyy-MM-dd}_ate_{f:yyyy-MM-dd}",
            ({ } i, null)  => $"a-partir-de_{i:yyyy-MM-dd}",
            (null, { } f)  => $"ate_{f:yyyy-MM-dd}",
            _              => $"completo_{DateTime.Now:yyyy-MM-dd}"
        };

        return $"{prefixo}_{periodo}.{extensao}";
    }
}