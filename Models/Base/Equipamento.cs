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
    public Setor Setor { get; set; }

    public string? Observacoes { get; set; }

    // gera um código aleatório, ajuste para o seu formato depois
    private static string GerarCodigo()
    {
        return Guid.NewGuid().ToString("N")[..10].ToUpper();
    }
}