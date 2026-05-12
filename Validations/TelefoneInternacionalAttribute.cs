using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Projeto_Gestao.Validations;

public class TelefoneInternacionalAttribute : ValidationAttribute
{
    // Aceita: (11) 9999-9999 ou (11) 99999-9999 (com ou sem espaços/hífen flexíveis)
    private static readonly Regex Formato = new(@"^\(\d{2}\)\s?\d{4,5}-?\d{4}$");

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is not string numero)
            return new ValidationResult("Número inválido.");

        if (!Formato.IsMatch(numero))
            return new ValidationResult(
                "Número deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.");

        return ValidationResult.Success;
    }
}