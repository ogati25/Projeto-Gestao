using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Services;
using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _service;

    public DashboardController(DashboardService service) => _service = service;

    // GET api/dashboard
    [HttpGet]
    public async Task<IActionResult> GetResumo()
        => Ok(await _service.GetResumoCompletoAsync());

    // GET api/dashboard/totais
    [HttpGet("totais")]
    public async Task<IActionResult> GetTotais()
        => Ok(await _service.GetTotaisAsync());

    // GET api/dashboard/manutencao
    [HttpGet("manutencao")]
    public async Task<IActionResult> GetManutencao()
        => Ok(await _service.GetBaixoEstoqueAsync());

    // GET api/dashboard/distribuicao
    [HttpGet("distribuicao")]
    public async Task<IActionResult> GetDistribuicao()
        => Ok(await _service.GetDistribuicaoPorCategoriaAsync());

    // GET api/dashboard/criticos?limite=10
    [HttpGet("criticos")]
    public async Task<IActionResult> GetCriticos(
        [FromQuery][Range(1, 100)] int limite = 10)
        => Ok(await _service.GetItensCriticosAsync(limite));

    // GET api/dashboard/atividades?limite=10
    [HttpGet("atividades")]
    public async Task<IActionResult> GetAtividades(
        [FromQuery][Range(1, 100)] int limite = 10)
        => Ok(await _service.GetAtividadesRecentesAsync(limite));

    // GET api/dashboard/ocupacao
    [HttpGet("ocupacao")]
    public async Task<IActionResult> GetOcupacao()
        => Ok(await _service.GetOcupacaoPorCategoriaAsync());
}