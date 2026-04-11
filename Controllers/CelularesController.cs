using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CelularesController : ControllerBase
{
    private readonly CelularService _service;

    public CelularesController(CelularService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    // retorna o celular com chips e contas whatsapp resolvidos
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var celular = await _service.GetByIdComChipsAsync(id);
        return celular is null ? NotFound() : Ok(celular);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Celular celular)
    {
        await _service.CreateAsync(celular);
        return CreatedAtAction(nameof(GetById), new { id = celular.Id }, celular);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Celular celular)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, celular);
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
