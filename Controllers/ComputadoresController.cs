using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;
using Microsoft.AspNetCore.Authorization;

namespace Projeto_Gestao.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComputadoresController : ControllerBase
{
    private readonly ComputadorService _service;

    public ComputadoresController(ComputadorService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    // retorna o computador com os dados do processador resolvidos
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var computador = await _service.GetByIdComProcessadorAsync(id);
        return computador is null ? NotFound() : Ok(computador);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Computador computador)
    {
        await _service.CreateAsync(computador);
        return CreatedAtAction(nameof(GetById), new { id = computador.Id }, computador);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Computador computador)
    { 
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, computador);
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
