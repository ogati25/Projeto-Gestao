// =============================================================================
// login.js — Lógica da tela de login
//
// Responsabilidades:
//   FRONTEND (UI):
//     - setupToggleSenha()  — alterna visibilidade do campo de senha
//     - mostrarErro()       — exibe a caixa de alerta de erro com mensagem
//     - ocultarErro()       — oculta a caixa de alerta de erro
//     - setLoading()        — alterna o estado de carregamento do botão
//
//   BACKEND / API:
//     - salvarSessao()      — persiste o UsuarioResponseDto no sessionStorage
//     - getUsuarioLogado()  — recupera o usuário da sessão (usado nas demais telas)
//     - logout()            — encerra a sessão e redireciona para o login
//     - verificarSessao()   — redireciona para login se não houver sessão ativa
//     - validarFormulario() — valida os campos antes de chamar a API
//     - handleLogin()       — orquestra validação → autenticarUsuario() → sessão → redirect
//
// Dependências:
//   - api.js (autenticarUsuario) — carregado antes no HTML
//   - IDs do HTML: email, senha, lembrar, togglePass, eyeIcon,
//                  btnLogin, btnLoginIcon, btnLoginLabel,
//                  alertError, alertErrorMsg
//
// Exportações globais (usadas pelas demais telas):
//   - getUsuarioLogado()
//   - verificarSessao()
//   - logout()
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// Aguarda o DOM estar totalmente carregado antes de inicializar qualquer lógica
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    setupToggleSenha();
    setupBotaoLogin();
    setupEnterParaLogin();

});


// =============================================================================
// SEÇÃO 1 — UTILITÁRIOS DE UI
// Funções visuais/frontend que não se comunicam com o backend.
// =============================================================================

/**
 * Configura o botão de alternância de visibilidade do campo de senha.
 * Alterna o type do input entre "password" e "text" e troca o ícone do olho.
 *
 * Usada em: campo #senha (togglePass / eyeIcon)
 */
function setupToggleSenha() {
    const btn   = document.getElementById('togglePass');
    const input = document.getElementById('senha');
    const icon  = document.getElementById('eyeIcon');

    if (!btn || !input || !icon) return;

    btn.addEventListener('click', (e) => {
        e.preventDefault(); // evita submit acidental

        const visivel  = input.type === 'text';
        input.type     = visivel ? 'password' : 'text';
        icon.className = visivel ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
}

/**
 * Exibe a caixa de alerta de erro com uma mensagem específica.
 * @param {string} mensagem — texto a ser exibido no alerta
 */
function mostrarErro(mensagem) {
    const caixa = document.getElementById('alertError');
    const msg   = document.getElementById('alertErrorMsg');

    if (msg)   msg.textContent = mensagem;
    if (caixa) caixa.classList.add('show');
}

/**
 * Oculta a caixa de alerta de erro.
 * Chamada no início de cada tentativa de login.
 */
function ocultarErro() {
    document.getElementById('alertError')?.classList.remove('show');
}

/**
 * Alterna o estado de carregamento do botão "Entrar".
 * Desativa o botão e exibe um spinner durante a requisição.
 *
 * @param {boolean} carregando — true para ativar loading, false para restaurar
 */
function setLoading(carregando) {
    const btn   = document.getElementById('btnLogin');
    const icon  = document.getElementById('btnLoginIcon');
    const label = document.getElementById('btnLoginLabel');

    if (!btn || !icon || !label) return;

    if (carregando) {
        btn.disabled      = true;
        icon.className    = 'fa-solid fa-spinner fa-spin';
        label.textContent = 'Entrando...';
    } else {
        btn.disabled      = false;
        icon.className    = 'fa-solid fa-right-to-bracket';
        label.textContent = 'Entrar';
    }
}


// =============================================================================
// SEÇÃO 2 — GESTÃO DE SESSÃO
// Persiste o UsuarioResponseDto retornado pelo POST /api/usuarios/authenticate
// no sessionStorage, disponibilizando os dados para todas as outras telas.
//
// UsuarioResponseDto: { id, nome, sobrenome, email, setor }
//
// As funções desta seção são globais e reutilizadas pelas demais telas.
// =============================================================================

/**
 * Salva o usuário autenticado em sessionStorage e localStorage.
 * Normaliza PascalCase (.NET) → camelCase para compatibilidade com todas as telas.
 * Chamada após autenticação bem-sucedida em handleLogin().
 * @param {Object} usuario — UsuarioResponseDto retornado pela API
 */
function salvarSessao(usuario) {
    // Normaliza PascalCase → camelCase (o backend .NET serializa em PascalCase
    // pois não há JsonNamingPolicy.CamelCase configurado no Program.cs)
    const normalizado = {
        id:             usuario.id          ?? usuario.Id          ?? null,
        nome:           usuario.nome        ?? usuario.Nome        ?? '',
        sobrenome:      usuario.sobrenome   ?? usuario.Sobrenome   ?? '',
        email:          usuario.email       ?? usuario.Email       ?? '',
        setor:          usuario.setor       ?? usuario.Setor       ?? '',
        telefone:       usuario.telefone    ?? usuario.Telefone    ?? null,
        criadoEm:       usuario.criadoEm    ?? usuario.CriadoEm    ?? null,
        atualizadoEm:   usuario.atualizadoEm ?? usuario.AtualizadoEm ?? null,
        emailVerificado: usuario.emailVerificado ?? usuario.EmailVerificado ?? false,
    };

    // sessionStorage — usado por perfil.js e verificarSessao()
    sessionStorage.setItem('usuarioLogado', JSON.stringify(normalizado));

    // localStorage — usado por dashboard.html e outras telas internas
    localStorage.setItem('tl_user', JSON.stringify(normalizado));
}

/**
 * Recupera o usuário logado do sessionStorage (ou localStorage como fallback).
 * Use nas demais telas para verificar autenticação e obter dados do usuário.
 * Retorna null se não houver sessão ativa.
 * @returns {Object|null} dados do usuário normalizados em camelCase, ou null
 */
function getUsuarioLogado() {
    try {
        const raw = sessionStorage.getItem('usuarioLogado') ?? localStorage.getItem('tl_user');
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

/**
 * Encerra a sessão do usuário e redireciona para o login.
 * Remove os dados de sessionStorage e localStorage.
 * Chame em qualquer tela que tenha botão de logout.
 */
function logout() {
    sessionStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tl_user');
    window.location.href = 'login.html';
}

/**
 * Verifica se há sessão ativa. Se não houver, redireciona para o login.
 * Use no topo de cada tela protegida para impedir acesso sem autenticação.
 * Exemplo de uso nas telas internas:
 *   document.addEventListener('DOMContentLoaded', () => {
 *       if (!verificarSessao()) return;
 *       // restante da inicialização da tela...
 *   });
 * @returns {boolean} true se autenticado, false se redirecionado
 */
function verificarSessao() {
    if (!getUsuarioLogado()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}


// =============================================================================
// SEÇÃO 3 — COMUNICAÇÃO COM A API
// Funções que fazem requisições ao backend (dependem de api.js).
// =============================================================================

/**
 * Valida os campos do formulário de login antes de chamar a API.
 * Exibe mensagem de erro via mostrarErro() para o primeiro campo inválido.
 *
 * @returns {boolean} true se todos os campos são válidos
 */
function validarFormulario() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErro('Informe um e-mail válido.');
        return false;
    }
    if (!senha) {
        mostrarErro('Informe a sua senha.');
        return false;
    }

    return true;
}

/**
 * Handler principal do botão "Entrar".
 * Orquestra: ocultarErro → validarFormulario → autenticarUsuario (api.js) → salvarSessao → redirect.
 *
 * POST /api/usuarios/authenticate
 * Body:    AuthenticateDto { email, senha }
 * Sucesso: UsuarioResponseDto { id, nome, sobrenome, email, setor } → redireciona para dashboard.html
 * Erros tratados:
 *   - 0   : sem conexão com o servidor
 *   - 401 : credenciais inválidas (senha não bate)
 *   - outros: mensagem genérica com código HTTP
 *
 * Vinculado ao botão #btnLogin em setupBotaoLogin().
 */
async function handleLogin() {
    ocultarErro();
    if (!validarFormulario()) return;

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    setLoading(true);

    try {
        // autenticarUsuario() definida em api.js → POST /api/usuarios/authenticate
        const usuario = await autenticarUsuario(email, senha);

        // Persiste o UsuarioResponseDto na sessão para uso nas demais telas
        salvarSessao(usuario);

        // Redireciona para o painel principal
        window.location.href = 'dashboard.html';

    } catch (err) {
        if (err.status === 0) {
            mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else if (err.status === 401) {
            // 401 Unauthorized = e-mail ou senha inválidos
            mostrarErro(err.corpo?.message || 'E-mail ou senha incorretos.');
        } else {
            mostrarErro(`Erro ao fazer login (código ${err.status || '?'}). Tente novamente.`);
        }
    } finally {
        // Restaura o botão independentemente do resultado
        setLoading(false);
    }
}


// =============================================================================
// SEÇÃO 4 — VINCULAÇÃO DE EVENTOS
// Conecta os handlers aos elementos do DOM.
// Mantido separado para facilitar leitura e manutenção.
// =============================================================================

/**
 * Vincula o clique do botão #btnLogin à função handleLogin().
 * Chamada no DOMContentLoaded junto com os demais setups.
 */
function setupBotaoLogin() {
    const btn = document.getElementById('btnLogin');
    if (!btn) return;
    btn.addEventListener('click', handleLogin);
}

/**
 * Permite acionar o login pressionando Enter em qualquer campo da tela.
 * Simula o clique no botão para reaproveitar toda a lógica do handleLogin().
 */
function setupEnterParaLogin() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('btnLogin')?.click();
        }
    });
}
