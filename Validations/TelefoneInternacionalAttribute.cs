using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Projeto_Gestao.Validations;

public class TelefoneInternacionalAttribute : ValidationAttribute
{
    // + seguido de 2 dígitos do país, 2 do DDD, e 8 ou 9 do número
    private static readonly Regex Formato = new(@"^\+\d{2}\d{2}\d{8,9}$");

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is not string numero)
            return new ValidationResult("Número inválido.");

        if (!Formato.IsMatch(numero))
            return new ValidationResult(
                "Número deve estar no formato internacional sem formatação. Ex: +5511999999999");

        return ValidationResult.Success;
    }
}