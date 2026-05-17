const API_URL = 'http://localhost:5085/api';

// ==================== UTILITÁRIO ====================

async function request(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
        response = await fetch(`${API_URL}/${endpoint}`, options);
    } catch (networkErr) {
        // sem conexão com o servidor
        const err = new Error('Sem conexão com o servidor');
        err.status = 0;
        err.corpo = null;
        throw err;
    }

    // 204 No Content — sucesso sem corpo
    if (response.status === 204) return true;

    // tenta ler o corpo como JSON independente do status
    let corpo = null;
    try { corpo = await response.json(); } catch (_) {}

    if (!response.ok) {
        console.error(`Erro ${response.status} em ${endpoint}:`, corpo);
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        err.corpo = corpo;
        throw err;
    }

    return corpo;
}

// ==================== USUÁRIOS ====================
// Espelha o UsuariosController (/api/usuarios)

// GET /api/usuarios/{id} → UsuarioResponseDto
async function getUsuario(id) {
    return await request(`usuarios/${id}`);
}

// GET /api/usuarios/email/{email} → UsuarioResponseDto
async function getUsuarioPorEmail(email) {
    return await request(`usuarios/email/${email}`);
}

// POST /api/usuarios → UsuarioResponseDto (201 Created)
// Body: UsuarioCreateDto { nome, sobrenome, email, setor (número), senha }
// O hash da senha é aplicado pelo backend (PasswordHasher)
async function criarUsuario(dados) {
    return await request('usuarios', 'POST', dados);
}

// PUT /api/usuarios/{id}/dados-pessoais → 204 No Content
// Body: UsuarioUpdateDadosPessoaisDto { nome, sobrenome, setor (número) }
async function atualizarDadosPessoais(id, dados) {
    return await request(`usuarios/${id}/dados-pessoais`, 'PUT', dados);
}

// PUT /api/usuarios/{id}/email → 204 No Content | 400 se email já em uso
// Body: UsuarioUpdateEmailDto { novoEmail }
async function atualizarEmail(id, novoEmail) {
    return await request(`usuarios/${id}/email`, 'PUT', { novoEmail });
}

// PUT /api/usuarios/{id}/senha → 204 No Content
// Body: UsuarioUpdateSenhaDto { novaSenha }
// O hash é aplicado pelo backend — nunca enviar a senha já hasheada
async function atualizarSenha(id, novaSenha) {
    return await request(`usuarios/${id}/senha`, 'PUT', { novaSenha });
}

// DELETE /api/usuarios/{id} → 204 No Content
async function deletarUsuario(id) {
    return await request(`usuarios/${id}`, 'DELETE');
}

// POST /api/usuarios/authenticate → UsuarioResponseDto | 401 se inválido
// Body: AuthenticateDto { email, senha }
async function autenticarUsuario(email, senha) {
    return await request('usuarios/authenticate', 'POST', { email, senha });
}

// ==================== PROCESSADORES ====================
// uso interno/admin, não expor no frontend do usuário comum

async function getProcessadores() {
    return await request('processadores');
}

async function getProcessador(id) {
    return await request(`processadores/${id}`);
}

async function criarProcessador(dados) {
    return await request('processadores', 'POST', dados);
}

async function atualizarProcessador(id, dados) {
    return await request(`processadores/${id}`, 'PUT', dados);
}

async function deletarProcessador(id) {
    return await request(`processadores/${id}`, 'DELETE');
}

// ==================== COMPUTADORES ====================

async function getComputadores() {
    return await request('computadores');
}

// retorna o computador com os dados do processador já resolvidos
async function getComputador(id) {
    return await request(`computadores/${id}`);
}

async function criarComputador(dados) {
    return await request('computadores', 'POST', dados);
}

async function atualizarComputador(id, dados) {
    return await request(`computadores/${id}`, 'PUT', dados);
}

async function deletarComputador(id) {
    return await request(`computadores/${id}`, 'DELETE');
}

// ==================== CHIPS ====================

async function getChips() {
    return await request('chips');
}

async function getChip(id) {
    return await request(`chips/${id}`);
}

async function criarChip(dados) {
    return await request('chips', 'POST', dados);
}

async function atualizarChip(id, dados) {
    return await request(`chips/${id}`, 'PUT', dados);
}

async function deletarChip(id) {
    return await request(`chips/${id}`, 'DELETE');
}

// ==================== CELULARES ====================

async function getCelulares() {
    return await request('celulares');
}

// retorna o celular com chips e contas whatsapp já resolvidos
async function getCelular(id) {
    return await request(`celulares/${id}`);
}

async function criarCelular(dados) {
    return await request('celulares', 'POST', dados);
}

async function atualizarCelular(id, dados) {
    return await request(`celulares/${id}`, 'PUT', dados);
}

async function deletarCelular(id) {
    return await request(`celulares/${id}`, 'DELETE');
}

// ==================== MONITORES ====================

async function getMonitores() {
    return await request('monitores');
}

async function getMonitor(id) {
    return await request(`monitores/${id}`);
}

async function criarMonitor(dados) {
    return await request('monitores', 'POST', dados);
}

async function atualizarMonitor(id, dados) {
    return await request(`monitores/${id}`, 'PUT', dados);
}

async function deletarMonitor(id) {
    return await request(`monitores/${id}`, 'DELETE');
}

// ==================== MOUSES ====================

async function getMouses() {
    return await request('mouses');
}

async function getMouse(id) {
    return await request(`mouses/${id}`);
}

async function criarMouse(dados) {
    return await request('mouses', 'POST', dados);
}

async function atualizarMouse(id, dados) {
    return await request(`mouses/${id}`, 'PUT', dados);
}

async function deletarMouse(id) {
    return await request(`mouses/${id}`, 'DELETE');
}

// ==================== TECLADOS ====================

async function getTeclados() {
    return await request('teclados');
}

async function getTeclado(id) {
    return await request(`teclados/${id}`);
}

async function criarTeclado(dados) {
    return await request('teclados', 'POST', dados);
}

async function atualizarTeclado(id, dados) {
    return await request(`teclados/${id}`, 'PUT', dados);
}

async function deletarTeclado(id) {
    return await request(`teclados/${id}`, 'DELETE');
}

// ==================== FONES ====================

async function getFones() {
    return await request('fones');
}

async function getFone(id) {
    return await request(`fones/${id}`);
}

async function criarFone(dados) {
    return await request('fones', 'POST', dados);
}

async function atualizarFone(id, dados) {
    return await request(`fones/${id}`, 'PUT', dados);
}

async function deletarFone(id) {
    return await request(`fones/${id}`, 'DELETE');
}

// ==================== RAMAIS ====================

async function getRamais() {
    return await request('ramais');
}

async function getRamal(id) {
    return await request(`ramais/${id}`);
}

async function criarRamal(dados) {
    return await request('ramais', 'POST', dados);
}

async function atualizarRamal(id, dados) {
    return await request(`ramais/${id}`, 'PUT', dados);
}

async function deletarRamal(id) {
    return await request(`ramais/${id}`, 'DELETE');
}

// ==================== OPÇÕES DINÂMICAS ====================
// Espelha o OpcoesEnumController (/api/opcoes)

// GET /api/opcoes → { SistemaOperacional: [...], Setor: [...], ... }
async function getOpcoes() {
    return await request('opcoes');
}

// GET /api/opcoes/{tipo} → ["Windows10", "Windows11", ...]
async function getOpcoesPorTipo(tipo) {
    return await request(`opcoes/${tipo}`);
}

// POST /api/opcoes → 201 Created
// Body: { tipo, valor }
async function criarOpcao(tipo, valor) {
    return await request('opcoes', 'POST', { tipo, valor });
}

// DELETE /api/opcoes/{tipo}/{valor} → 204 No Content
async function deletarOpcao(tipo, valor) {
    return await request(`opcoes/${encodeURIComponent(tipo)}/${encodeURIComponent(valor)}`, 'DELETE');
}

// ==================== EXTRAS ====================

async function getExtras() {
    return await request('extras');
}

async function getExtra(id) {
    return await request(`extras/${id}`);
}

async function criarExtra(dados) {
    return await request('extras', 'POST', dados);
}

async function atualizarExtra(id, dados) {
    return await request(`extras/${id}`, 'PUT', dados);
}

async function deletarExtra(id) {
    return await request(`extras/${id}`, 'DELETE');
}

// ==================== RECUPERAÇÃO DE SENHA ====================

// POST /api/usuarios/recuperar-senha → 200 (sempre, por segurança)
// Body: { email }
// O backend envia o e-mail com o link se o endereço existir no cadastro
async function solicitarRecuperacaoSenha(email) {
    return await request('usuarios/recuperar-senha', 'POST', { email });
}

// POST /api/usuarios/redefinir-senha → 200 | 400 se token inválido/expirado
// Body: { token, novaSenha }
async function redefinirSenha(token, novaSenha) {
    return await request('usuarios/redefinir-senha', 'POST', { token, novaSenha });
}

// ==================== VERIFICAÇÃO DE E-MAIL ====================

// POST /api/usuarios/{id}/enviar-verificacao → 200 | 400 se já verificado
async function enviarVerificacaoEmail(id) {
    return await request(`usuarios/${id}/enviar-verificacao`, 'POST');
}

// POST /api/usuarios/confirmar-email → 200 | 400 se token inválido/expirado
// Body: { token }
async function confirmarEmail(token) {
    return await request('usuarios/confirmar-email', 'POST', { token });
}
