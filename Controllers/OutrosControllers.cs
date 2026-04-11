using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoresController : ControllerBase
{
    private readonly MonitorService _service;
    public MonitoresController(MonitorService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var monitor = await _service.GetByIdAsync(id);
        return monitor is null ? NotFound() : Ok(monitor);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Projeto_Gestao.Models.Monitor monitor)
    {
        await _service.CreateAsync(monitor);
        return CreatedAtAction(nameof(GetById), new { id = monitor.Id }, monitor);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Projeto_Gestao.Models.Monitor monitor)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, monitor);
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

[ApiController]
[Route("api/[controller]")]
public class MousesController : ControllerBase
{
    private readonly MouseService _service;
    public MousesController(MouseService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var mouse = await _service.GetByIdAsync(id);
        return mouse is null ? NotFound() : Ok(mouse);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Mouse mouse)
    {
        await _service.CreateAsync(mouse);
        return CreatedAtAction(nameof(GetById), new { id = mouse.Id }, mouse);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Mouse mouse)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, mouse);
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

[ApiController]
[Route("api/[controller]")]
public class TecladosController : ControllerBase
{
    private readonly TecladoService _service;
    public TecladosController(TecladoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var teclado = await _service.GetByIdAsync(id);
        return teclado is null ? NotFound() : Ok(teclado);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Teclado teclado)
    {
        await _service.CreateAsync(teclado);
        return CreatedAtAction(nameof(GetById), new { id = teclado.Id }, teclado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Teclado teclado)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, teclado);
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

[ApiController]
[Route("api/[controller]")]
public class FonesController : ControllerBase
{
    private readonly FoneService _service;
    public FonesController(FoneService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var fone = await _service.GetByIdAsync(id);
        return fone is null ? NotFound() : Ok(fone);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Fone fone)
    {
        await _service.CreateAsync(fone);
        return CreatedAtAction(nameof(GetById), new { id = fone.Id }, fone);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Fone fone)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, fone);
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

[ApiController]
[Route("api/[controller]")]
public class RamaisController : ControllerBase
{
    private readonly RamalService _service;
    public RamaisController(RamalService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var ramal = await _service.GetByIdAsync(id);
        return ramal is null ? NotFound() : Ok(ramal);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Ramal ramal)
    {
        await _service.CreateAsync(ramal);
        return CreatedAtAction(nameof(GetById), new { id = ramal.Id }, ramal);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Ramal ramal)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, ramal);
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

[ApiController]
[Route("api/[controller]")]
public class ExtrasController : ControllerBase
{
    private readonly ExtraService _service;
    public ExtrasController(ExtraService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var extra = await _service.GetByIdAsync(id);
        return extra is null ? NotFound() : Ok(extra);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Extra extra)
    {
        await _service.CreateAsync(extra);
        return CreatedAtAction(nameof(GetById), new { id = extra.Id }, extra);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Extra extra)
    {
        var existente = await _service.GetByIdAsync(id);
        if (existente is null) return NotFound();
        await _service.UpdateAsync(id, extra);
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
