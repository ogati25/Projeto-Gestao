using Microsoft.AspNetCore.Mvc;
using Projeto_Gestao.Dtos;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UsuarioService _usuarioService;

    public UsuariosController(UsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    // ===================== CRIAÇÃO =====================
    [HttpPost]
    public async Task<ActionResult<UsuarioResponseDto>> Create([FromBody] UsuarioCreateDto dto)
    {
        // Mapeia DTO para Model
        var usuario = new Usuario
        {
            Nome = dto.Nome,
            Sobrenome = dto.Sobrenome,
            Email = dto.Email,
            Setor = dto.Setor,
            Senha = dto.Senha
        };

        await _usuarioService.CreateAsync(usuario);

        // Após criação, o Id foi gerado pelo MongoDB
        var response = MapToResponse(usuario);
        return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, response);
    }

    // ===================== LEITURA =====================
    [HttpGet("{id}")]
    public async Task<ActionResult<UsuarioResponseDto>> GetById(string id)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        return Ok(MapToResponse(usuario));
    }

    [HttpGet("email/{email}")]
    public async Task<ActionResult<UsuarioResponseDto>> GetByEmail(string email)
    {
        var usuario = await _usuarioService.GetByEmailAsync(email);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        return Ok(MapToResponse(usuario));
    }

    // ===================== ATUALIZAÇÕES ESPECÍFICAS =====================
    [HttpPut("{id}/dados-pessoais")]
    public async Task<IActionResult> UpdateDadosPessoais(string id, [FromBody] UsuarioUpdateDadosPessoaisDto dto)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        await _usuarioService.UpdateDadosPessoaisAsync(id, dto.Nome, dto.Sobrenome, dto.Setor);
        return NoContent();
    }

    [HttpPut("{id}/email")]
    public async Task<IActionResult> UpdateEmail(string id, [FromBody] UsuarioUpdateEmailDto dto)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        var sucesso = await _usuarioService.UpdateEmailAsync(id, dto.NovoEmail);
        if (!sucesso)
            return BadRequest(new { message = "Este email já está em uso por outro usuário." });

        return NoContent();
    }

    [HttpPut("{id}/senha")]
    public async Task<IActionResult> UpdateSenha(string id, [FromBody] UsuarioUpdateSenhaDto dto)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        await _usuarioService.UpdateSenhaAsync(id, dto.NovaSenha);
        return NoContent();
    }

    // ===================== DELEÇÃO =====================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        await _usuarioService.DeleteAsync(id);
        return NoContent();
    }

    // ===================== AUTENTICAÇÃO (LOGIN) =====================
    [HttpPost("authenticate")]
    public async Task<ActionResult<UsuarioResponseDto>> Authenticate([FromBody] AuthenticateDto dto)
    {
        var usuario = await _usuarioService.AuthenticateAsync(dto.Email, dto.Senha);
        if (usuario == null)
            return Unauthorized(new { message = "Email ou senha inválidos." });

        return Ok(MapToResponse(usuario));
    }

    // ===================== MÉTODO AUXILIAR =====================
    private UsuarioResponseDto MapToResponse(Usuario usuario)
    {
        return new UsuarioResponseDto
        {
            Id = usuario.Id!,
            Nome = usuario.Nome,
            Sobrenome = usuario.Sobrenome,
            Email = usuario.Email,
            Setor = usuario.Setor
        };
    }
}