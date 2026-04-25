using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Projeto_Gestao.Enums;

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
    public Setor Setor { get; set; }

    [Required]
    public string Senha { get; set; } = null!;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CriadoEm { get; set; }
}