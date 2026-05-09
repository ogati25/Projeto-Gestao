using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/opcoes")]
public class OpcoesEnumController : ControllerBase
{
    private readonly OpcaoEnumService _service;

    public OpcoesEnumController(OpcaoEnumService service) => _service = service;

    // GET /api/opcoes
    // retorna todos os tipos agrupados: { "SistemaOperacional": ["Windows10", ...], ... }
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAgrupadosAsync());

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
