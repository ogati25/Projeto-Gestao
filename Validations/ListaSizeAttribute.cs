using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Validations;

public class ListaSizeAttribute : ValidationAttribute
{
    private readonly string _campoQuantidade;

    public ListaSizeAttribute(string campoQuantidade)
    {
        _campoQuantidade = campoQuantidade;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        var lista = value as System.Collections.IList;
        if (lista == null)
            return new ValidationResult("Deve ser uma lista.");

        // pega o valor do campo de quantidade pelo nome
        var propriedade = context.ObjectType.GetProperty(_campoQuantidade);
        if (propriedade == null)
            return new ValidationResult($"Campo {_campoQuantidade} não encontrado.");

        var quantidade = (int?)propriedade.GetValue(context.ObjectInstance);
        if (quantidade == null)
            return new ValidationResult($"Campo {_campoQuantidade} inválido.");

        if (lista.Count != quantidade)
            return new ValidationResult(
                $"A lista deve ter exatamente {quantidade} elementos.");

        return ValidationResult.Success;
    }
}