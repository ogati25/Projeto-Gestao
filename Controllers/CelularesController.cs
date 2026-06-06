using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;
using Microsoft.AspNetCore.Authorization;

namespace Projeto_Gestao.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CelularesController : ControllerBase
{
    private readonly CelularService _service;

    public CelularesController(CelularService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var celular = await _service.GetByIdComChipsAsync(id);
        return celular is null ? NotFound() : Ok(celular);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Celular celular)
    {
        try
        {
            await _service.CreateAsync(celular);
            return CreatedAtAction(nameof(GetById), new { id = celular.Id }, celular);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Celular celular)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        try
        {
            await _service.UpdateAsync(id, celular);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
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
