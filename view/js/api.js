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
