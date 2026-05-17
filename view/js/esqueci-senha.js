// =============================================================================
// esqueci-senha.js — Lógica da tela "Esqueci minha senha"
//
// Responsabilidades:
//   FRONTEND (UI):
//     - mostrarErro()        — exibe alerta de erro com mensagem
//     - ocultarErro()        — oculta alerta de erro
//     - setLoading()         — estado de carregamento do botão
//     - exibirSucesso()      — troca formulário pela tela de sucesso
//
//   BACKEND / API:
//     - handleRecuperarSenha()  — valida e chama solicitarRecuperacaoSenha() (api.js)
//     - handleReenviar()        — reenvia com cooldown de 30s
//
// Dependências:
//   - api.js (solicitarRecuperacaoSenha) — carregado antes no HTML
//   - IDs do HTML: email, btnRecovery, alertError, alertErrorMsg,
//                  formState, successState, emailSent, btnResend
// =============================================================================


document.addEventListener('DOMContentLoaded', () => {
    emailInput.focus();
    btnRecovery.addEventListener('click', handleRecuperarSenha);
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleRecuperarSenha(); });
    btnResend.addEventListener('click', handleReenviar);
});


// ─── Elementos ───────────────────────────────────────────────────────────────

const emailInput   = document.getElementById('email');
const btnRecovery  = document.getElementById('btnRecovery');
const alertError   = document.getElementById('alertError');
const alertMsg     = document.getElementById('alertErrorMsg');
const formState    = document.getElementById('formState');
const successState = document.getElementById('successState');
const emailSentEl  = document.getElementById('emailSent');
const btnResend    = document.getElementById('btnResend');


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE UI
// =============================================================================

function mostrarErro(mensagem) {
    alertMsg.textContent = mensagem;
    alertError.classList.add('show');
}

function ocultarErro() {
    alertError.classList.remove('show');
}

function setLoading(carregando) {
    if (carregando) {
        btnRecovery.disabled     = true;
        btnRecovery.innerHTML    = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    } else {
        btnRecovery.disabled     = false;
        btnRecovery.innerHTML    = '<i class="fa-solid fa-paper-plane"></i> Enviar instruções';
    }
}

function exibirSucesso(email) {
    emailSentEl.textContent = email;
    formState.style.display = 'none';
    successState.classList.add('show');
}


// =============================================================================
// SEÇÃO 2 — COMUNICAÇÃO COM A API
// =============================================================================

/**
 * Handler principal do botão "Enviar instruções".
 * Valida o campo → chama solicitarRecuperacaoSenha() (api.js) → exibe sucesso.
 *
 * POST /api/usuarios/recuperar-senha
 * Body:    { email }
 * Sucesso: 200 (sempre, mesmo se o e-mail não existir — segurança)
 * Erros:   0 (sem conexão), outros (genérico)
 */
async function handleRecuperarSenha() {
    ocultarErro();

    const email = emailInput.value.trim();

    if (!email) {
        mostrarErro('Por favor, informe o seu e-mail.');
        emailInput.focus();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErro('Por favor, informe um e-mail válido.');
        emailInput.focus();
        return;
    }

    setLoading(true);

    try {
        // solicitarRecuperacaoSenha() definida em api.js → POST /api/usuarios/recuperar-senha
        await solicitarRecuperacaoSenha(email);
        exibirSucesso(email);

    } catch (err) {
        if (err.status === 0) {
            mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
            mostrarErro('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
        }
    } finally {
        setLoading(false);
    }
}

/**
 * Handler do botão "Reenviar e-mail".
 * Reenvia para o mesmo e-mail exibido na tela de sucesso,
 * com cooldown de 30s para evitar spam.
 */
async function handleReenviar() {
    btnResend.disabled = true;

    const email = emailSentEl.textContent;

    try {
        await solicitarRecuperacaoSenha(email);
    } catch (_) {
        // Falha silenciosa no reenvio — o back sempre responde 200
    }

    // Cooldown de 30s
    let segundos = 30;
    btnResend.textContent = `Reenviar em ${segundos}s`;
    const intervalo = setInterval(() => {
        segundos--;
        if (segundos <= 0) {
            clearInterval(intervalo);
            btnResend.disabled    = false;
            btnResend.textContent = 'Reenviar e-mail';
        } else {
            btnResend.textContent = `Reenviar em ${segundos}s`;
        }
    }, 1000);
}
