using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace InventarioAtivos.Models;

public class Produto
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Nome { get; set; } = null!;
    public string Categoria { get; set; } = null!;
    public int Quantidade { get; set; }
    public decimal Preco { get; set; }
}