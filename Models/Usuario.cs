using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Projeto_Gestao.Models;

public class Usuario
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    public string Nome { get; set; } = null!;

    [Required]
    public string Sobrenome { get; set; } = null!;

    [Required]
    public string Email { get; set; } = null!;

    [Required]
    public string Setor { get; set; } = null!;  // dinâmico → string

    [Required]
    public string Senha { get; set; } = null!;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CriadoEm { get; set; }

    // ── Reset de senha ──────────────────────────────────────────────────────
    // Token gerado ao solicitar "Esqueci minha senha". Expira em 1 hora.
    public string? ResetSenhaToken { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ResetSenhaTokenExpiry { get; set; }

    // ── Verificação de e-mail ───────────────────────────────────────────────
    // Token gerado no cadastro. Expira em 24 horas.
    public bool EmailVerificado { get; set; } = false;
    public string? EmailVerificacaoToken { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? EmailVerificacaoTokenExpiry { get; set; }
}
