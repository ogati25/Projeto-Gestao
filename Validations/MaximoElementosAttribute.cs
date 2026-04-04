using System.ComponentModel.DataAnnotations;

namespace Projeto_Gestao.Validations;

public class MaximoElementosAttribute : ValidationAttribute
{
    private readonly int _maximo;

    public MaximoElementosAttribute(int maximo)
    {
        _maximo = maximo;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        var lista = value as System.Collections.IList;
        if (lista == null)
            return new ValidationResult("Deve ser uma lista.");

        if (lista.Count > _maximo)
            return new ValidationResult(
                $"A lista pode ter no máximo {_maximo} elementos.");

        return ValidationResult.Success;
    }
}