using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Models;

public class OpcaoEnum
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    public string Tipo { get; set; } = null!;

    [Required]
    public string Valor { get; set; } = null!;
}
