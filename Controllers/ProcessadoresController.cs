using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

// controller oculto, somente para uso interno/admin
// não aparece no frontend para o usuário comum
[ApiController]
[Route("api/[controller]")]
public class ProcessadoresController : ControllerBase
{
    private readonly ProcessadorService _service;

    public ProcessadoresController(ProcessadorService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var processador = await _service.GetByIdAsync(id);
        return processador is null ? NotFound() : Ok(processador);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Processador processador)
    {
        await _service.CreateAsync(processador);
        return CreatedAtAction(nameof(GetById), new { id = processador.Id }, processador);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Processador processador)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, processador);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
