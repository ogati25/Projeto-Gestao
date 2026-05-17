// =============================================================================
// cadastro.js — Lógica da tela de cadastro de usuário
//
// Responsabilidades:
//   FRONTEND (UI):
//     - setupToggleSenha()    — alterna visibilidade dos campos de senha
//     - atualizarForcaSenha() — calcula e exibe o indicador de força de senha
//     - mostrarErro()         — exibe a caixa de alerta de erro com mensagem
//     - ocultarAlertas()      — oculta ambas as caixas de alerta
//     - setLoading()          — alterna o estado de carregamento do botão
//
//   BACKEND / API:
//     - carregarSetors()      — busca as opções de setor via GET /api/opcoes/Setor
//                               e preenche o <select id="setor">
//     - validarFormulario()   — valida os campos antes de chamar a API
//     - handleCadastro()      — orquestra validação → criarUsuario() → redirect
//
// Dependências:
//   - api.js (criarUsuario, getOpcoesPorTipo) — carregado antes no HTML
//   - IDs do HTML: nome, sobrenome, email, setor, senha, confirmar, termos,
//                  btnCadastrar, btnCadastrarIcon, btnCadastrarLabel,
//                  togglePass1, togglePass2, eye1, eye2,
//                  strengthFill, strengthLabel, alertError, alertErrorMsg, alertSuccess
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// Aguarda o DOM estar totalmente carregado antes de inicializar qualquer lógica
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Inicializa todos os módulos da tela
    setupToggleSenha();
    setupForcaSenha();
    setupMascaraTelefone();
    setupBotaoCadastrar();
    setupVerificacao();
    carregarSetors();

});


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE UI
// Funções visuais/frontend que não se comunicam com o backend.
// =============================================================================

/**
 * Configura os botões de alternância de visibilidade dos campos de senha.
 * Alterna o tipo do input entre "password" e "text" e troca o ícone do olho.
 *
 * Usada em: campo #senha (togglePass1 / eye1) e #confirmar (togglePass2 / eye2)
 */
function setupToggleSenha() {

    /**
     * Vincula o comportamento de toggle a um par (botão + input + ícone).
     * @param {string} btnId   — ID do botão de toggle
     * @param {string} inputId — ID do input de senha
     * @param {string} iconId  — ID do <i> do ícone dentro do botão
     */
    function vincularToggle(btnId, inputId, iconId) {
        const btn   = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const icon  = document.getElementById(iconId);

        // Aborta silenciosamente se algum elemento não existir no DOM
        if (!btn || !input || !icon) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault(); // evita submit acidental se dentro de form

            const visivel = input.type === 'text';
            input.type    = visivel ? 'password' : 'text';
            icon.className = visivel ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }

    vincularToggle('togglePass1', 'senha',     'eye1');
    vincularToggle('togglePass2', 'confirmar', 'eye2');
}

/**
 * Vincula o evento de input ao campo de senha para calcular e exibir
 * o indicador de força em tempo real.
 *
 * Critérios de pontuação (0–4):
 *   +1 se tiver 8 ou mais caracteres
 *   +1 se tiver letra maiúscula
 *   +1 se tiver número
 *   +1 se tiver caractere especial
 *
 * Resultado visual:
 *   - #strengthFill : largura (%) e cor de fundo alteradas via style
 *   - #strengthLabel: texto descritivo (ex: "Forte")
 */
function setupForcaSenha() {
    const inputSenha    = document.getElementById('senha');
    const fill          = document.getElementById('strengthFill');
    const label         = document.getElementById('strengthLabel');

    if (!inputSenha || !fill || !label) return;

    // Tabela de níveis: índice = pontuação (0–4)
    const niveis = [
        { largura: '0%',   cor: '',         texto: '' },
        { largura: '25%',  cor: '#ef4444',  texto: 'Muito fraca' },
        { largura: '50%',  cor: '#f59e0b',  texto: 'Fraca' },
        { largura: '75%',  cor: '#3b82f6',  texto: 'Boa' },
        { largura: '100%', cor: '#10b981',  texto: 'Forte' },
    ];

    inputSenha.addEventListener('input', function () {
        const v = this.value;
        let pontuacao = 0;

        if (v.length >= 8)            pontuacao++;
        if (/[A-Z]/.test(v))          pontuacao++;
        if (/[0-9]/.test(v))          pontuacao++;
        if (/[^A-Za-z0-9]/.test(v))   pontuacao++;

        // Quando o campo está vazio, força nível 0
        const nivel = v.length === 0 ? niveis[0] : (niveis[pontuacao] || niveis[1]);

        fill.style.width      = nivel.largura;
        fill.style.background = nivel.cor;
        label.textContent     = nivel.texto;
        label.style.color     = nivel.cor || 'var(--text-muted)';
    });
}

/**
 * Exibe a caixa de alerta de erro com uma mensagem específica.
 * Também oculta a caixa de sucesso, caso esteja visível.
 * @param {string} mensagem — texto a ser exibido no alerta
 */
function mostrarErro(mensagem) {
    const caixaErro = document.getElementById('alertError');
    const msgErro   = document.getElementById('alertErrorMsg');
    const caixaSuc  = document.getElementById('alertSuccess');

    if (msgErro)   msgErro.textContent = mensagem;
    if (caixaErro) caixaErro.classList.add('show');
    if (caixaSuc)  caixaSuc.classList.remove('show');
}

/**
 * Oculta ambas as caixas de alerta (erro e sucesso).
 * Chamada no início de cada tentativa de cadastro.
 */
function ocultarAlertas() {
    document.getElementById('alertError')?.classList.remove('show');
    document.getElementById('alertSuccess')?.classList.remove('show');
}

/**
 * Alterna o estado de carregamento do botão "Criar conta".
 * Desativa o botão e substitui seu conteúdo por um spinner durante a requisição.
 *
 * @param {boolean} carregando — true para ativar loading, false para restaurar
 */
function setLoading(carregando) {
    const btn   = document.getElementById('btnCadastrar');
    const icon  = document.getElementById('btnCadastrarIcon');
    const label = document.getElementById('btnCadastrarLabel');

    if (!btn || !icon || !label) return;

    if (carregando) {
        btn.disabled      = true;
        icon.className    = 'fa-solid fa-spinner fa-spin';
        label.textContent = 'Criando conta...';
    } else {
        btn.disabled      = false;
        icon.className    = 'fa-solid fa-user-plus';
        label.textContent = 'Criar conta';
    }
}


// =============================================================================
// SEÇÃO 2 — COMUNICAÇÃO COM A API
// Funções que fazem requisições ao backend (dependem de api.js).
// =============================================================================

/**
 * Aplica máscara de telefone brasileiro ao campo #telefone em tempo real.
 * Formatos aceitos: (11) 9999-9999 ou (11) 99999-9999
 */
function setupMascaraTelefone() {
    const input = document.getElementById('telefone');
    if (!input) return;

    input.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').slice(0, 11);
        if (v.length <= 10) {
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        this.value = v.replace(/-$/, '');
    });
}

/**
 * Busca as opções de setor/setor via GET /api/opcoes/Setor
 * e popula o <select id="setor"> com as opções retornadas.
 *
 * Chamada automaticamente no DOMContentLoaded.
 * Em caso de falha, mantém o select com a opção padrão estática do HTML.
 *
 * Usa: getOpcoesPorTipo() de api.js
 */
async function carregarSetors() {
    const select = document.getElementById('setor');
    if (!select) return;

    try {
        // GET /api/opcoes/Setor → string[]
        const opcoes = await getOpcoesPorTipo('Setor');

        // Remove quaisquer opções dinâmicas anteriores (mantém a opção padrão)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Insere cada opção retornada pela API
        opcoes.forEach(opcao => {
            const opt   = document.createElement('option');
            opt.value   = opcao;
            opt.textContent = opcao;
            select.appendChild(opt);
        });

    } catch (err) {
        // Falha silenciosa: o select permanece com as opções estáticas do HTML
        console.warn('Não foi possível carregar os setors da API:', err);
    }
}

/**
 * Valida os campos do formulário de cadastro antes de chamar a API.
 * Exibe mensagem de erro via mostrarErro() para o primeiro campo inválido.
 *
 * @returns {boolean} true se todos os campos são válidos
 */
function validarFormulario() {
    const nome      = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const email     = document.getElementById('email').value.trim();
    const setor     = document.getElementById('setor').value;
    const senha     = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;

    if (!nome || !sobrenome) {
        mostrarErro('Preencha nome e sobrenome.');
        return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErro('Informe um e-mail válido.');
        return false;
    }
    if (!setor) {
        mostrarErro('Selecione um setor.');
        return false;
    }
    if (!senha) {
        mostrarErro('Informe uma senha.');
        return false;
    }
    if (senha.length < 8) {
        mostrarErro('A senha deve ter pelo menos 8 caracteres.');
        return false;
    }
    if (senha !== confirmar) {
        mostrarErro('As senhas não coincidem.');
        return false;
    }

    return true;
}

/**
 * Handler principal do botão "Criar conta".
 * Orquestra: ocultarAlertas → validarFormulario → criarUsuario (api.js) → redirect.
 *
 * POST /api/usuarios
 * Body:    UsuarioCreateDto { nome, sobrenome, email, setor (número), senha }
 * Sucesso: UsuarioResponseDto → redireciona para login.html
 * Erros tratados:
 *   - 0   : sem conexão com o servidor
 *   - 409 : e-mail já cadastrado (Conflict)
 *   - outros: mensagem genérica com código HTTP
 *
 * Vinculado ao botão #btnCadastrar no setupBotaoCadastrar().
 */
async function handleCadastro() {
    ocultarAlertas();
    if (!validarFormulario()) return;

    const nome      = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const email     = document.getElementById('email').value.trim();
    const setor     = document.getElementById('setor').value;
    const telefone  = document.getElementById('telefone')?.value.trim() || null;
    const senha     = document.getElementById('senha').value;

    setLoading(true);

    try {
        // criarUsuario() definida em api.js → POST /api/usuarios
        const response = await criarUsuario({ nome, sobrenome, email, setor, telefone, senha });

        // Exibe a tela de verificação de e-mail (step 2)
        exibirVerificacao(email, response.id ?? response.Id);

    } catch (err) {
        if (err.status === 0) {
            mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else if (err.status === 409) {
            // 409 Conflict = e-mail já em uso
            mostrarErro(err.corpo?.message || 'Este e-mail já está cadastrado.');
        } else {
            mostrarErro(`Erro ao criar conta (código ${err.status || '?'}). Tente novamente.`);
        }
        setLoading(false); // restaura o botão apenas em caso de erro
    }
}


// =============================================================================
// SEÇÃO 3 — VINCULAÇÃO DE EVENTOS
// Conecta os handlers aos elementos do DOM.
// Mantido separado para facilitar leitura e manutenção.
// =============================================================================

/**
 * Vincula o clique do botão #btnCadastrar à função handleCadastro().
 * Chamada no DOMContentLoaded junto com os demais setups.
 */
function setupBotaoCadastrar() {
    const btn = document.getElementById('btnCadastrar');
    if (!btn) return;
    btn.addEventListener('click', handleCadastro);
}


// =============================================================================
// SEÇÃO 4 — VERIFICAÇÃO DE E-MAIL (step 2)
// Exibida após o cadastro bem-sucedido.
// =============================================================================

// Guarda o id do usuário recém-criado para chamadas de reenvio
let _usuarioId = null;

/**
 * Configura os inputs de código e o botão de verificação.
 * Chamada no DOMContentLoaded.
 */
function setupVerificacao() {
    const inputs = obterInputsCodigo();

    // Navegação automática entre os inputs + aceitar só dígitos
    inputs.forEach((input, i) => {
        input.addEventListener('keydown', e => {
            // Backspace: volta ao anterior se vazio
            if (e.key === 'Backspace' && !input.value && i > 0) {
                inputs[i - 1].focus();
            }
        });
        input.addEventListener('input', e => {
            // Aceita só números
            input.value = input.value.replace(/\D/, '');
            if (input.value) {
                input.classList.add('filled');
                if (i < 5) inputs[i + 1].focus();
            } else {
                input.classList.remove('filled');
            }
        });
        // Suporte a colar (ctrl+v) no primeiro campo
        input.addEventListener('paste', e => {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            texto.split('').forEach((ch, j) => {
                if (inputs[j]) {
                    inputs[j].value = ch;
                    inputs[j].classList.add('filled');
                }
            });
            if (inputs[Math.min(texto.length, 5)]) inputs[Math.min(texto.length, 5)].focus();
        });
    });

    document.getElementById('btnVerificar')?.addEventListener('click', handleVerificar);
    document.getElementById('btnReenviar')?.addEventListener('click', handleReenviar);
}

/**
 * Exibe o painel de verificação e oculta o formulário.
 * Atualiza os indicadores de step no painel brand.
 * @param {string} email - e-mail exibido ao usuário
 * @param {string} usuarioId - id do usuário criado (para reenvio)
 */
function exibirVerificacao(email, usuarioId) {
    _usuarioId = usuarioId;

    document.getElementById('verifyEmailDest').textContent = email;
    document.getElementById('formPanel').style.display = 'none';
    document.getElementById('verificationPanel').classList.add('show');

    // Atualiza indicadores de step
    const s1 = document.getElementById('stepNum1');
    const s2 = document.getElementById('stepNum2');
    if (s1) { s1.classList.remove('active'); s1.classList.add('done'); s1.innerHTML = '<i class="fa-solid fa-check" style="font-size:10px"></i>'; }
    if (s2) { s2.classList.add('active'); }

    // Foca no primeiro input de código
    obterInputsCodigo()[0]?.focus();
}

/**
 * Retorna o código de 6 dígitos digitado (string).
 */
function lerCodigo() {
    return obterInputsCodigo().map(i => i.value).join('');
}

function obterInputsCodigo() {
    return [0,1,2,3,4,5].map(i => document.getElementById(`c${i}`)).filter(Boolean);
}

function mostrarErroVerify(msg) {
    const el = document.getElementById('alertErrorVerify');
    const span = document.getElementById('alertErrorVerifyMsg');
    if (span) span.textContent = msg;
    el?.classList.add('show');
    document.getElementById('alertSuccessVerify')?.classList.remove('show');
}

function ocultarAlertasVerify() {
    document.getElementById('alertErrorVerify')?.classList.remove('show');
    document.getElementById('alertSuccessVerify')?.classList.remove('show');
}

function setLoadingVerify(carregando) {
    const btn   = document.getElementById('btnVerificar');
    const label = document.getElementById('btnVerificarLabel');
    if (!btn || !label) return;
    if (carregando) {
        btn.disabled     = true;
        label.textContent = 'Verificando...';
        btn.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
    } else {
        btn.disabled     = false;
        label.textContent = 'Verificar e-mail';
        btn.querySelector('i').className = 'fa-solid fa-check-circle';
    }
}

/**
 * Handler do botão "Verificar e-mail".
 * Chama confirmarEmail() (api.js) com o código digitado.
 *
 * POST /api/usuarios/confirmar-email
 * Body:    { token: "123456" }
 * Sucesso: 200 → redireciona para login.html
 * Erros:
 *   - 400 : código inválido/expirado
 *   - 0   : sem conexão
 */
async function handleVerificar() {
    ocultarAlertasVerify();
    const codigo = lerCodigo();

    if (codigo.length < 6) {
        mostrarErroVerify('Digite todos os 6 dígitos do código.');
        obterInputsCodigo().find(i => !i.value)?.focus();
        return;
    }

    setLoadingVerify(true);
    try {
        // confirmarEmail() definida em api.js → POST /api/usuarios/confirmar-email
        await confirmarEmail(codigo);

        document.getElementById('alertSuccessVerify')?.classList.add('show');
        document.getElementById('alertErrorVerify')?.classList.remove('show');

        // Atualiza step 3 e redireciona
        const s3 = document.getElementById('stepNum3');
        if (s3) s3.classList.add('active');

        setTimeout(() => { window.location.href = 'login.html'; }, 1800);

    } catch (err) {
        if (err.status === 0) {
            mostrarErroVerify('Sem conexão com o servidor. Tente novamente.');
        } else if (err.status === 400) {
            mostrarErroVerify(err.corpo?.message || 'Código inválido ou expirado.');
            // Limpa os inputs para nova tentativa
            obterInputsCodigo().forEach(i => { i.value = ''; i.classList.remove('filled'); });
            obterInputsCodigo()[0]?.focus();
        } else {
            mostrarErroVerify('Erro ao verificar. Tente novamente.');
        }
        setLoadingVerify(false);
    }
}

/**
 * Handler do botão "Reenviar código".
 * Chama enviarVerificacaoEmail() (api.js) com o id do usuário.
 * Aplica cooldown de 30s para evitar spam.
 *
 * POST /api/usuarios/{id}/enviar-verificacao
 */
async function handleReenviar() {
    if (!_usuarioId) return;

    const btn = document.getElementById('btnReenviar');
    btn.disabled = true;

    try {
        await enviarVerificacaoEmail(_usuarioId);
        ocultarAlertasVerify();
        // Limpa inputs para o novo código
        obterInputsCodigo().forEach(i => { i.value = ''; i.classList.remove('filled'); });
        obterInputsCodigo()[0]?.focus();
    } catch (_) {
        // Falha silenciosa no reenvio
    }

    // Cooldown 30s
    let s = 30;
    btn.textContent = `Reenviar em ${s}s`;
    const t = setInterval(() => {
        s--;
        if (s <= 0) {
            clearInterval(t);
            btn.disabled = false;
            btn.textContent = 'Reenviar código';
        } else {
            btn.textContent = `Reenviar em ${s}s`;
        }
    }, 1000);
}
