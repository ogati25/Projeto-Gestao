using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;
using Microsoft.AspNetCore.Authorization;

namespace Projeto_Gestao.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChipsController : ControllerBase
{
    private readonly ChipService _service;

    public ChipsController(ChipService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var chip = await _service.GetByIdAsync(id);
        return chip is null ? NotFound() : Ok(chip);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Chip chip)
    {
        await _service.CreateAsync(chip);
        return CreatedAtAction(nameof(GetById), new { id = chip.Id }, chip);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Chip chip)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, chip);
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
