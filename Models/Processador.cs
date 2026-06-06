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

    // double evita imprecisão de float (ex: 3.3 virava 3.299999952316284)
    [Range(0.01, 99.99, ErrorMessage = "Velocidade inválida.")]
    public double Velocidade { get; set; }

    // Classe auxiliar no lugar de tupla C# — System.Text.Json não deserializa tuplas
    public NucleosThreadsInfo? NucleosThreads { get; set; }
}

/// <summary>
/// Substitui a tupla (int Nucleos, int Threads) para compatibilidade com System.Text.Json.
/// O frontend envia { item1: N, item2: T } e o C# mapeia corretamente.
/// </summary>
public class NucleosThreadsInfo
{
    public int Item1 { get; set; }  // Núcleos
    public int Item2 { get; set; }  // Threads
}
