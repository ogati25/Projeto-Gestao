using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Projeto_Gestao.Settings;

namespace Projeto_Gestao.Services;

public class EmailService
{
    private readonly EmailSettings _settings;
    private readonly HttpClient _http;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.Senha);
    }

    public async Task EnviarEmailVerificacaoAsync(string destinatario, string nomeUsuario, string codigo)
    {
        await EnviarAsync(destinatario,
            "Confirme seu e-mail — Tech Logistics",
            MontarCorpoVerificacaoEmail(nomeUsuario, codigo));
    }

    public async Task EnviarEmailRecuperacaoSenhaAsync(string destinatario, string nomeUsuario, string token)
    {
        var link = $"{_settings.UrlBase}/view/redefinir-senha.html?token={Uri.EscapeDataString(token)}";
        await EnviarAsync(destinatario,
            "Redefinição de senha — Tech Logistics",
            MontarCorpoRecuperacaoSenha(nomeUsuario, link));
    }

    private async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
    {
        var payload = new
        {
            from = $"{_settings.RemetentNome} <onboarding@resend.dev>",
            to   = new[] { destinatario },
            subject = assunto,
            html = corpoHtml
        };

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _http.PostAsync("https://api.resend.com/emails", content);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new Exception($"Resend erro {(int)response.StatusCode}: {body}");
        }
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

    private static string MontarCorpoVerificacaoEmail(string nome, string codigo) => $@"
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
          <h2 style=""font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;text-align:center;"">Confirme seu e-mail</h2>
          <p style=""font-size:14px;color:#64748b;margin:0 0 16px;text-align:center;"">Olá, <strong>{nome}</strong>!</p>
          <p style=""font-size:14px;color:#475569;margin:0 0 28px;line-height:1.6;"">
            Obrigado por se cadastrar no Tech Logistics! Use o código abaixo para confirmar seu e-mail. O código é válido por <strong>24 horas</strong>.
          </p>
          <div style=""text-align:center;margin-bottom:28px;"">
            <div style=""display:inline-block;background:#f0fdf4;border:2px dashed #10b981;border-radius:12px;padding:18px 40px;"">
              <p style=""margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#6b7280;text-transform:uppercase;"">Código de verificação</p>
              <p style=""margin:0;font-size:36px;font-weight:800;letter-spacing:10px;color:#0f172a;font-family:monospace;"">{codigo}</p>
            </div>
          </div>
          <p style=""font-size:13px;color:#475569;margin:0 0 28px;line-height:1.6;text-align:center;"">
            Digite este código na tela de cadastro para ativar sua conta.
          </p>
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
