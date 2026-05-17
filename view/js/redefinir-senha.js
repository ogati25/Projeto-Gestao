// =============================================================================
// redefinir-senha.js — Lógica da tela "Redefinir Senha"
//
// Responsabilidades:
//   FRONTEND (UI):
//     - setupToggleSenha()     — alterna visibilidade dos campos de senha
//     - atualizarForcaSenha()  — indicador visual de força da senha (barra + label)
//     - mostrarErro()          — exibe alerta de erro com mensagem
//     - ocultarErro()          — oculta alerta de erro
//     - setLoading()           — estado de carregamento do botão
//     - exibirSucesso()        — troca formulário pela tela de sucesso
//     - exibirTokenInvalido()  — exibe tela de token inválido/expirado
//
//   BACKEND / API:
//     - lerTokenDaUrl()        — extrai ?token= da URL
//     - validarToken()         — verifica se o token existe na URL (client-side)
//     - handleRedefinir()      — valida campos → chama redefinirSenha() (api.js)
//
// Dependências:
//   - api.js (redefinirSenha) — carregado antes no HTML
//   - IDs do HTML: novaSenha, confirmarSenha, btnRedefinir,
//                  alertError, alertErrorMsg, formState, successState,
//                  invalidTokenState, toggleNovaSenha, eyeNova,
//                  toggleConfirmar, eyeConfirmar,
//                  strengthBar (sb1-sb4), strengthLabel
// =============================================================================


document.addEventListener('DOMContentLoaded', () => {

    const token = lerTokenDaUrl();

    if (!token) {
        // Sem token na URL → exibe tela de erro imediatamente
        exibirTokenInvalido();
        return;
    }

    setupToggleSenha('toggleNovaSenha', 'novaSenha', 'eyeNova');
    setupToggleSenha('toggleConfirmar', 'confirmarSenha', 'eyeConfirmar');

    document.getElementById('novaSenha').addEventListener('input', () => {
        atualizarForcaSenha(document.getElementById('novaSenha').value);
    });

    document.getElementById('btnRedefinir').addEventListener('click', () => handleRedefinir(token));

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btnRedefinir')?.click();
    });

    document.getElementById('novaSenha').focus();
});


// ─── Elementos ───────────────────────────────────────────────────────────────

const alertError    = document.getElementById('alertError');
const alertMsg      = document.getElementById('alertErrorMsg');
const formState     = document.getElementById('formState');
const successState  = document.getElementById('successState');
const invalidState  = document.getElementById('invalidTokenState');


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE UI
// =============================================================================

/**
 * Configura o toggle de visibilidade de um campo de senha.
 * @param {string} btnId   - id do botão toggle
 * @param {string} inputId - id do input
 * @param {string} iconId  - id do ícone <i>
 */
function setupToggleSenha(btnId, inputId, iconId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!btn || !input || !icon) return;

    btn.addEventListener('click', e => {
        e.preventDefault();
        const visivel  = input.type === 'text';
        input.type     = visivel ? 'password' : 'text';
        icon.className = visivel ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
}

/**
 * Atualiza a barra visual de força da senha e o label descritivo.
 * Níveis: fraca (1-2 barras) | média (3 barras) | forte (4 barras)
 * @param {string} senha
 */
function atualizarForcaSenha(senha) {
    const barras = [
        document.getElementById('sb1'),
        document.getElementById('sb2'),
        document.getElementById('sb3'),
        document.getElementById('sb4'),
    ];
    const label = document.getElementById('strengthLabel');

    let pontos = 0;
    if (senha.length >= 6)                  pontos++;
    if (senha.length >= 10)                 pontos++;
    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
    if (/[0-9]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos++;

    const classePorPonto = ['fraca', 'fraca', 'media', 'forte'];
    const labels = ['', 'Fraca', 'Fraca', 'Média', 'Forte'];
    const classe = senha.length === 0 ? '' : classePorPonto[pontos - 1] || 'fraca';

    barras.forEach((b, i) => {
        b.className = i < pontos ? classe : '';
    });
    label.textContent = labels[pontos] || '';
}

function mostrarErro(mensagem) {
    alertMsg.textContent = mensagem;
    alertError.classList.add('show');
}

function ocultarErro() {
    alertError.classList.remove('show');
}

function setLoading(carregando) {
    const btn = document.getElementById('btnRedefinir');
    if (!btn) return;
    if (carregando) {
        btn.disabled  = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    } else {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar nova senha';
    }
}

function exibirSucesso() {
    formState.style.display = 'none';
    successState.classList.add('show');
}

function exibirTokenInvalido() {
    formState.style.display = 'none';
    invalidState.classList.add('show');
}


// =============================================================================
// SEÇÃO 2 — COMUNICAÇÃO COM A API
// =============================================================================

/**
 * Extrai o parâmetro "token" da URL.
 * Ex: redefinir-senha.html?token=abc123 → "abc123"
 * @returns {string|null}
 */
function lerTokenDaUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || null;
}

/**
 * Handler principal do botão "Salvar nova senha".
 * Valida os campos → chama redefinirSenha() (api.js).
 *
 * POST /api/usuarios/redefinir-senha
 * Body:    { token, novaSenha }
 * Sucesso: 200 → exibe tela de sucesso
 * Erros:
 *   - 400 : token inválido/expirado → exibe tela de token inválido
 *   - 0   : sem conexão
 *   - outros: genérico
 *
 * @param {string} token - token extraído da URL
 */
async function handleRedefinir(token) {
    ocultarErro();

    const novaSenha      = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (!novaSenha) {
        mostrarErro('Por favor, informe a nova senha.');
        document.getElementById('novaSenha').focus();
        return;
    }
    if (novaSenha.length < 6) {
        mostrarErro('A senha deve ter no mínimo 6 caracteres.');
        document.getElementById('novaSenha').focus();
        return;
    }
    if (!confirmarSenha) {
        mostrarErro('Por favor, confirme a nova senha.');
        document.getElementById('confirmarSenha').focus();
        return;
    }
    if (novaSenha !== confirmarSenha) {
        mostrarErro('As senhas não coincidem. Verifique e tente novamente.');
        document.getElementById('confirmarSenha').focus();
        return;
    }

    setLoading(true);

    try {
        // redefinirSenha() definida em api.js → POST /api/usuarios/redefinir-senha
        await redefinirSenha(token, novaSenha);
        exibirSucesso();

    } catch (err) {
        if (err.status === 0) {
            mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else if (err.status === 400) {
            // Token inválido ou expirado → exibe tela dedicada
            exibirTokenInvalido();
        } else {
            mostrarErro(`Erro ao redefinir a senha (código ${err.status || '?'}). Tente novamente.`);
        }
    } finally {
        setLoading(false);
    }
}
