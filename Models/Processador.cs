using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Projeto_Gestao.Models;

public class Processador
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    public string Nome { get; set; } = null!;

    [Range(0.01, 99.99, ErrorMessage = "Velocidade inválida.")]
    public float Velocidade { get; set; }

    // Tupla de int: nucleos e threads
    public (int Nucleos, int Threads) NucleosThreads { get; set; }
}