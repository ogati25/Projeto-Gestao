using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Projeto_Gestao.Enums;

namespace Projeto_Gestao.Models.Base;

public abstract class Equipamento
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    public string Codigo { get; set; } = GerarCodigo();

    [Required]
    public string Usuario { get; set; } = null!;

    public DateTime DataAquisicao { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Preço não pode ser negativo.")]
    public decimal PrecoAquisicao { get; set; }

    [Required]
    public bool Ativo { get; set; } = true;

    [Required]
    public string Setor { get; set; } = null!;  // dinâmico → string

    [Required]
    public Status Status { get; set; }

    public string? Observacoes { get; set; }

    private static string GerarCodigo()
    {
        return Guid.NewGuid().ToString("N")[..10].ToUpper();
    }
}
