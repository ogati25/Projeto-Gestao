using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Projeto_Gestao.Dtos;
using Projeto_Gestao.Models;
using Projeto_Gestao.Services;

namespace Projeto_Gestao.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UsuarioService _usuarioService;
    private readonly EmailService   _emailService;

    public UsuariosController(UsuarioService usuarioService, EmailService emailService)
    {
        _usuarioService = usuarioService;
        _emailService   = emailService;
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
            Telefone = dto.Telefone,
            Senha = dto.Senha
        };

        try
        {
            await _usuarioService.CreateAsync(usuario);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return Conflict(new { message = "Este e-mail já está cadastrado." });
        }

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


    // ===================== RECUPERAÇÃO DE SENHA =====================

    // POST /api/usuarios/recuperar-senha
    // Body: RecuperarSenhaDto { email }
    // Sempre retorna 200 para não revelar se o e-mail existe (segurança)
    [HttpPost("recuperar-senha")]
    public async Task<IActionResult> RecuperarSenha([FromBody] RecuperarSenhaDto dto)
    {
        var (usuario, token) = await _usuarioService.GerarTokenResetSenhaAsync(dto.Email);

        if (usuario != null && token != null)
        {
            try
            {
                await _emailService.EnviarEmailRecuperacaoSenhaAsync(usuario.Email, usuario.Nome, token);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[EmailService] Erro ao enviar e-mail de recuperação: {ex.Message}");
            }
        }

        // Sempre responde 200 mesmo que o e-mail não exista (evita enumeração de contas)
        return Ok(new { message = "Se esse e-mail estiver cadastrado, você receberá as instruções em breve." });
    }

    // POST /api/usuarios/redefinir-senha
    // Body: RedefinirSenhaDto { token, novaSenha }
    [HttpPost("redefinir-senha")]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaDto dto)
    {
        var sucesso = await _usuarioService.RedefinirSenhaComTokenAsync(dto.Token, dto.NovaSenha);

        if (!sucesso)
            return BadRequest(new { message = "Link inválido ou expirado. Solicite um novo link de recuperação." });

        return Ok(new { message = "Senha redefinida com sucesso." });
    }

    // ===================== VERIFICAÇÃO DE E-MAIL =====================

    // POST /api/usuarios/{id}/enviar-verificacao
    // Gera e envia (ou reenvia) o e-mail de verificação para o usuário
    [HttpPost("{id}/enviar-verificacao")]
    public async Task<IActionResult> EnviarVerificacaoEmail(string id)
    {
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario == null)
            return NotFound(new { message = "Usuário não encontrado." });

        if (usuario.EmailVerificado)
            return BadRequest(new { message = "Este e-mail já foi verificado." });

        var token = await _usuarioService.GerarTokenVerificacaoEmailAsync(id);

        try
        {
            await _emailService.EnviarEmailVerificacaoAsync(usuario.Email, usuario.Nome, token);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[EmailService] Erro ao enviar e-mail de verificação: {ex.Message}");
            return StatusCode(500, new { message = "Não foi possível enviar o e-mail. Tente novamente mais tarde." });
        }

        return Ok(new { message = "E-mail de verificação enviado." });
    }

    // POST /api/usuarios/confirmar-email
    // Body: VerificarEmailDto { token }
    [HttpPost("confirmar-email")]
    public async Task<IActionResult> ConfirmarEmail([FromBody] VerificarEmailDto dto)
    {
        var sucesso = await _usuarioService.ConfirmarEmailAsync(dto.Token);

        if (!sucesso)
            return BadRequest(new { message = "Link inválido ou expirado. Solicite um novo e-mail de verificação." });

        return Ok(new { message = "E-mail confirmado com sucesso." });
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
            Setor = usuario.Setor,
            Telefone = usuario.Telefone,
            CriadoEm = usuario.CriadoEm,
            AtualizadoEm = usuario.AtualizadoEm,
            EmailVerificado = usuario.EmailVerificado
        };
    }
}
