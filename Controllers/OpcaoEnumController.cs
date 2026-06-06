using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Services;
using Microsoft.AspNetCore.Authorization;

namespace Projeto_Gestao.Controllers;

[Authorize]
[ApiController]
[Route("api/opcoes")]
public class OpcoesEnumController : ControllerBase
{
    private readonly OpcaoEnumService _service;

    public OpcoesEnumController(OpcaoEnumService service) => _service = service;

    // GET /api/opcoes
    // retorna todos os tipos agrupados: { "SistemaOperacional": ["Windows10", ...], ... }
    // Usa JsonResult com opções customizadas para preservar as chaves em PascalCase
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var dados = await _service.GetAllAgrupadosAsync();

        // Por padrão o ASP.NET converte chaves de Dictionary para camelCase.
        // Usamos JsonResult com DictionaryKeyPolicy = null para preservar o case original.
        var opcoes = new System.Text.Json.JsonSerializerOptions
        {
            DictionaryKeyPolicy = null, // mantém as chaves exatamente como estão no banco
            PropertyNamingPolicy = null,
        };
        opcoes.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        return new JsonResult(dados, opcoes);
    }

    // GET /api/opcoes/{tipo}
    // retorna os valores de um tipo: ["Windows10", "Windows11", ...]
    [HttpGet("{tipo}")]
    public async Task<IActionResult> GetByTipo(string tipo)
    {
        var valores = await _service.GetByTipoAsync(tipo);
        return Ok(valores);
    }

    // POST /api/opcoes
    // body: { "tipo": "SistemaOperacional", "valor": "Windows8" }
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OpcaoEnumDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Tipo) || string.IsNullOrWhiteSpace(dto.Valor))
            return BadRequest(new { message = "Tipo e Valor são obrigatórios." });

        var criado = await _service.CreateAsync(dto.Tipo.Trim(), dto.Valor.Trim());
        if (!criado)
            return Conflict(new { message = $"'{dto.Valor}' já existe em '{dto.Tipo}'." });

        return CreatedAtAction(nameof(GetByTipo), new { tipo = dto.Tipo }, null);
    }

    // DELETE /api/opcoes/{tipo}/{valor}
    [HttpDelete("{tipo}/{valor}")]
    public async Task<IActionResult> Delete(string tipo, string valor)
    {
        var deletado = await _service.DeleteAsync(tipo, valor);
        if (!deletado)
            return NotFound(new { message = $"'{valor}' não encontrado em '{tipo}'." });

        return NoContent();
    }
}

// DTO inline — simples o suficiente para não precisar de arquivo separado
public record OpcaoEnumDto(string Tipo, string Valor);
