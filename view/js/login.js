// =============================================================================
// login.js — Backend do login de usuário
// Responsabilidade: validação, autenticação via API e gestão de sessão.
//
// O que está aqui:
//   - validarFormulario() — validação client-side antes de chamar a API
//   - handleLogin()       — orquestra validação → API → sessão → redirect
//   - salvarSessao()      — persiste o UsuarioResponseDto no sessionStorage
//   - getUsuarioLogado()  — recupera o usuário da sessão (uso nas outras páginas)
//   - logout()            — limpa a sessão e redireciona para o login
//
// O que NÃO está aqui (fica no <script> inline do HTML):
//   - Toggle de visibilidade de senha
//   - mostrarErro / ocultarErro / setLoading
//
// Dependências:
//   - api.js (autenticarUsuario) — carregado antes no HTML
//   - Funções de UI no <script> inline do HTML:
//       mostrarErro(), ocultarErro(), setLoading()
// =============================================================================


// =============================================================================
// SEÇÃO 1 — GESTÃO DE SESSÃO
// Persiste o UsuarioResponseDto retornado pelo POST /api/usuarios/authenticate
// no sessionStorage, disponibilizando os dados para todas as outras páginas.
//
// UsuarioResponseDto: { id, nome, sobrenome, email, setor }
// =============================================================================

/**
 * Salva o usuário autenticado no sessionStorage.
 * Chamado após autenticação bem-sucedida.
 * @param {Object} usuario — UsuarioResponseDto retornado pela API
 */
function salvarSessao(usuario) {
    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
}

/**
 * Recupera o usuário logado do sessionStorage.
 * Use nas outras páginas para verificar autenticação e obter dados do usuário.
 * Retorna null se não houver sessão ativa.
 * @returns {Object|null} UsuarioResponseDto ou null
 */
function getUsuarioLogado() {
    const raw = sessionStorage.getItem('usuarioLogado');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
}

/**
 * Encerra a sessão do usuário e redireciona para o login.
 * Chame em qualquer página que tenha botão de logout.
 */
function logout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

/**
 * Verifica se há sessão ativa. Se não houver, redireciona para o login.
 * Use no topo das páginas protegidas para impedir acesso sem autenticação.
 * Exemplo de uso nas páginas internas:
 *   if (!verificarSessao()) return;
 * @returns {boolean} true se autenticado
 */
function verificarSessao() {
    if (!getUsuarioLogado()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}


// =============================================================================
// SEÇÃO 2 — VALIDAÇÃO CLIENT-SIDE
// Verifica os campos antes de disparar a requisição à API.
// Depende de mostrarErro() definida no script inline do HTML.
// =============================================================================

/**
 * Valida os campos do formulário de login.
 * @returns {boolean} true se válido
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


// =============================================================================
// SEÇÃO 3 — HANDLER DE LOGIN
// Chamado pelo onclick do botão no HTML: onclick="handleLogin()"
// Orquestra: validação → autenticarUsuario() (api.js) → sessão → redirect.
//
// POST /api/usuarios/authenticate
// Body:    AuthenticateDto { email, senha }
// Sucesso: UsuarioResponseDto { id, nome, sobrenome, email, setor }
// Erro:    401 Unauthorized → { message: "Email ou senha inválidos." }
// =============================================================================

/**
 * Autentica o usuário via API e salva a sessão em caso de sucesso.
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

        // Persiste o UsuarioResponseDto na sessão
        salvarSessao(usuario);

        // Redireciona para o painel principal
        window.location.href = 'dashboard.html';

    } catch (err) {
        if (err.status === 0) {
            mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else if (err.status === 401) {
            // 401 = credenciais inválidas (retorno do AuthenticateAsync quando senha não bate)
            mostrarErro(err.corpo?.message || 'E-mail ou senha incorretos.');
        } else {
            mostrarErro(`Erro ao fazer login (código ${err.status || '?'}). Tente novamente.`);
        }
    } finally {
        setLoading(false);
    }
}
