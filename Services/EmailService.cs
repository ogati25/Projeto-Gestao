using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Projeto_Gestao.Settings;

namespace Projeto_Gestao.Services;

/// <summary>
/// Serviço de envio de e-mail via Gmail SMTP.
///
/// Usos atuais:
///   - EnviarEmailRecuperacaoSenhaAsync  → fluxo "Esqueci minha senha"
///   - EnviarEmailVerificacaoAsync       → fluxo de verificação ao criar conta
///
/// Configuração (appsettings.json → "EmailSettings"):
///   SmtpHost      : smtp.gmail.com
///   SmtpPort      : 587
///   RemetentEmail : seuemail@gmail.com
///   RemetentNome  : Tech Logistics
///   Senha         : senha de app gerada em conta Google → Segurança → Senhas de app
///   UrlBase       : URL raiz do frontend (ex: http://localhost:5500)
/// </summary>
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESET DE SENHA
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Envia e-mail com link para redefinição de senha.
    /// Link gerado: {UrlBase}/view/redefinir-senha.html?token={token}
    /// </summary>
    public async Task EnviarEmailRecuperacaoSenhaAsync(string destinatario, string nomeUsuario, string token)
    {
        var link = $"{_settings.UrlBase}/view/redefinir-senha.html?token={Uri.EscapeDataString(token)}";

        var assunto = "Redefinição de senha — Tech Logistics";
        var corpo   = MontarCorpoRecuperacaoSenha(nomeUsuario, link);

        await EnviarAsync(destinatario, assunto, corpo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFICAÇÃO DE E-MAIL
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Envia e-mail de verificação após o cadastro do usuário.
    /// Link gerado: {UrlBase}/view/verificar-email.html?token={token}
    /// </summary>
    public async Task EnviarEmailVerificacaoAsync(string destinatario, string nomeUsuario, string token)
    {
        var link = $"{_settings.UrlBase}/view/verificar-email.html?token={Uri.EscapeDataString(token)}";

        var assunto = "Confirme seu e-mail — Tech Logistics";
        var corpo   = MontarCorpoVerificacaoEmail(nomeUsuario, link);

        await EnviarAsync(destinatario, assunto, corpo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENVIO GENÉRICO
    // ─────────────────────────────────────────────────────────────────────────

    private async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
    {
        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            Credentials = new NetworkCredential(_settings.RemetentEmail, _settings.Senha),
            EnableSsl   = true
        };

        using var mensagem = new MailMessage
        {
            From       = new MailAddress(_settings.RemetentEmail, _settings.RemetentNome),
            Subject    = assunto,
            Body       = corpoHtml,
            IsBodyHtml = true
        };
        mensagem.To.Add(destinatario);

        await client.SendMailAsync(mensagem);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATES HTML
    // ─────────────────────────────────────────────────────────────────────────

    private static string MontarCorpoRecuperacaoSenha(string nome, string link) => $@"
<!DOCTYPE html>
<html lang=""pt-br"">
<head><meta charset=""UTF-8""></head>
<body style=""margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f1f5f9;padding:40px 0;"">
    <tr><td align=""center"">
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#1e293b;border-radius:16px 16px 0 0;padding:32px 40px;"">
        <tr><td>
          <table cellpadding=""0"" cellspacing=""0"">
            <tr>
              <td style=""background:#3e608f;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;"">
                <span style=""font-size:20px;"">📦</span>
              </td>
              <td style=""padding-left:12px;font-size:18px;font-weight:700;color:#fff;"">Tech Logistics</td>
            </tr>
          </table>
        </td></tr>
      </table>
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#fff;padding:40px;"">
        <tr><td>
          <div style=""text-align:center;margin-bottom:28px;"">
            <div style=""display:inline-block;background:#dbeafe;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:32px;"">🔑</div>
          </div>
          <h2 style=""font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;"">Redefinição de senha</h2>
          <p style=""font-size:14px;color:#64748b;margin:0 0 24px;"">Olá, <strong>{nome}</strong>!</p>
          <p style=""font-size:14px;color:#475569;margin:0 0 28px;line-height:1.6;"">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.
          </p>
          <div style=""text-align:center;margin-bottom:28px;"">
            <a href=""{link}"" style=""display:inline-block;background:#3e608f;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;"">
              Redefinir minha senha
            </a>
          </div>
          <p style=""font-size:12px;color:#94a3b8;margin:0 0 8px;"">Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style=""font-size:12px;color:#3e608f;word-break:break-all;margin:0 0 28px;""><a href=""{link}"" style=""color:#3e608f;"">{link}</a></p>
          <hr style=""border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;"">
          <p style=""font-size:12px;color:#94a3b8;margin:0;"">Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
        </td></tr>
      </table>
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;"">
        <tr><td style=""font-size:12px;color:#94a3b8;text-align:center;"">
          © {DateTime.UtcNow.Year} Tech Logistics — Este é um e-mail automático, não responda.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

    private static string MontarCorpoVerificacaoEmail(string nome, string link) => $@"
<!DOCTYPE html>
<html lang=""pt-br"">
<head><meta charset=""UTF-8""></head>
<body style=""margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f1f5f9;padding:40px 0;"">
    <tr><td align=""center"">
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#1e293b;border-radius:16px 16px 0 0;padding:32px 40px;"">
        <tr><td>
          <table cellpadding=""0"" cellspacing=""0"">
            <tr>
              <td style=""background:#3e608f;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;"">
                <span style=""font-size:20px;"">📦</span>
              </td>
              <td style=""padding-left:12px;font-size:18px;font-weight:700;color:#fff;"">Tech Logistics</td>
            </tr>
          </table>
        </td></tr>
      </table>
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#fff;padding:40px;"">
        <tr><td>
          <div style=""text-align:center;margin-bottom:28px;"">
            <div style=""display:inline-block;background:#d1fae5;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:32px;"">✉️</div>
          </div>
          <h2 style=""font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;"">Confirme seu e-mail</h2>
          <p style=""font-size:14px;color:#64748b;margin:0 0 24px;"">Olá, <strong>{nome}</strong>!</p>
          <p style=""font-size:14px;color:#475569;margin:0 0 28px;line-height:1.6;"">
            Obrigado por se cadastrar no Tech Logistics! Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo. O link é válido por <strong>24 horas</strong>.
          </p>
          <div style=""text-align:center;margin-bottom:28px;"">
            <a href=""{link}"" style=""display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;"">
              Confirmar e-mail
            </a>
          </div>
          <p style=""font-size:12px;color:#94a3b8;margin:0 0 8px;"">Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style=""font-size:12px;color:#3e608f;word-break:break-all;margin:0 0 28px;""><a href=""{link}"" style=""color:#3e608f;"">{link}</a></p>
          <hr style=""border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;"">
          <p style=""font-size:12px;color:#94a3b8;margin:0;"">Se você não criou esta conta, ignore este e-mail.</p>
        </td></tr>
      </table>
      <table width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;"">
        <tr><td style=""font-size:12px;color:#94a3b8;text-align:center;"">
          © {DateTime.UtcNow.Year} Tech Logistics — Este é um e-mail automático, não responda.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
}
