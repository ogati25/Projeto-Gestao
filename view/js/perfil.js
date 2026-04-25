// =============================================================================
// perfil.js — Backend da tela de perfil
// Responsabilidade: sessão, comunicação com a API e lógica de domínio.
//
// O que está aqui:
//   - Enum SETORES (espelha Setor.cs)
//   - Gestão de sessão (obterSessao, atualizarSessao, encerrarSessao)
//   - inicializarPerfil()     — ponto de entrada, verifica sessão
//   - carregarDados()         — GET /api/usuarios/{id} → preenche UI
//   - salvarDadosPessoais()   — PUT /dados-pessoais + PUT /email
//   - salvarSenha()           — PUT /senha
//   - popularSelectSetores()  — injeta <option> no #fSetor
//
// O que NÃO está aqui (fica no <script> inline do HTML):
//   - Toggle de visibilidade de senha / barra de força
//   - Tema, sidebar, busca
//   - mostrarErroDados, mostrarSucessoDados, setLoadingDados
//   - mostrarErroSenha, mostrarSucessoSenha, setLoadingSenha
//
// Dependências:
//   - api.js (getUsuario, atualizarDadosPessoais, atualizarEmail, atualizarSenha)
//   - Funções de UI definidas no <script> inline do HTML
// =============================================================================


// =============================================================================
// SEÇÃO 1 — ENUM DE DOMÍNIO: SETOR  (espelha Setor.cs)
// =============================================================================

const SETORES = [
    { value: 'RH',         label: 'RH'         },
    { value: 'Suporte',    label: 'Suporte'     },
    { value: 'Produtos',   label: 'Produtos'    },
    { value: 'Auditoria',  label: 'Auditoria'   },
    { value: 'Diretoria',  label: 'Diretoria'   },
    { value: 'CallCenter', label: 'Call Center' },
    { value: 'Dev',        label: 'Dev'         },
    { value: 'Cofre',      label: 'Cofre'       },
    { value: 'Servidor',   label: 'Servidor'    },
];


// =============================================================================
// SEÇÃO 2 — GESTÃO DE SESSÃO
// Usa a mesma chave do login.js ('usuarioLogado' no sessionStorage).
// =============================================================================

const SESSION_KEY = 'usuarioLogado';

/** Retorna o objeto de sessão ou null. */
function obterSessao() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** Atualiza campos do usuário na sessão sem sobrescrever outros. */
function atualizarSessao(dadosNovos) {
    const atual = obterSessao() ?? {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...atual, ...dadosNovos }));
}

/**
 * Encerra a sessão e redireciona para o login.
 * Chamado pelo botão de logout no HTML.
 */
function encerrarSessao() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}


// =============================================================================
// SEÇÃO 3 — ESTADO LOCAL
// =============================================================================

/** Snapshot dos dados vindos da API — atualizado a cada carregarDados(). */
let usuarioAtual = null;


// =============================================================================
// SEÇÃO 4 — INICIALIZAÇÃO
// Chamado pelo DOMContentLoaded do HTML.
// Redireciona para login se não houver sessão válida.
// =============================================================================

async function inicializarPerfil() {
    const sessao = obterSessao();

    if (!sessao?.id) {
        window.location.href = 'login.html';
        return;
    }

    popularSelectSetores();
    await carregarDados();
}


// =============================================================================
// SEÇÃO 5 — POPULATE DO SELECT DE SETOR
// =============================================================================

function popularSelectSetores() {
    const select = document.getElementById('fSetor');
    if (!select) return;
    select.innerHTML = SETORES
        .map(s => `<option value="${s.value}">${s.label}</option>`)
        .join('');
}


// =============================================================================
// SEÇÃO 6 — CARREGAR DADOS
// GET /api/usuarios/{id}
// Chamado na inicialização e pelo botão "Cancelar" do form de dados pessoais.
// =============================================================================

async function carregarDados() {
    const sessao = obterSessao();
    if (!sessao?.id) { window.location.href = 'login.html'; return; }

    try {
        const usuario = await getUsuario(sessao.id);
        usuarioAtual  = usuario;
        atualizarSessao(usuario);

        preencherFormulario(usuario);
        preencherCardLateral(usuario);

    } catch (err) {
        if (err.status === 404 || err.status === 401) {
            encerrarSessao();
        } else {
            mostrarErroDados('Não foi possível carregar os dados do perfil.');
        }
    }
}


// =============================================================================
// SEÇÃO 7 — PREENCHER UI
// =============================================================================

function preencherFormulario(usuario) {
    _setVal('fNome',      usuario.nome      ?? '');
    _setVal('fSobrenome', usuario.sobrenome ?? '');
    _setVal('fEmail',     usuario.email     ?? '');

    const sel = document.getElementById('fSetor');
    if (sel) sel.value = usuario.setor ?? SETORES[0].value;

    _setText('ultimaAtualizacao', _fmtDataHora(new Date()));
}

function preencherCardLateral(usuario) {
    const nomeCompleto = `${usuario.nome ?? ''} ${usuario.sobrenome ?? ''}`.trim();
    const iniciais     = _iniciais(usuario.nome, usuario.sobrenome);

    _setText('sidebarName',  nomeCompleto || '—');
    _setText('sidebarRole',  usuario.setor ?? '—');
    _setText('sidebarEmail', usuario.email ?? '—');
    _setText('sidebarSetor', usuario.setor ?? '—');
    _setText('sidebarNivel', 'Usuário');
    _setText('avatarBig',    iniciais);
    _setText('headerAvatar', iniciais);

    const elMembro = document.getElementById('sidebarMembro');
    if (elMembro) {
        elMembro.textContent = usuario.criadoEm
            ? _fmtData(new Date(usuario.criadoEm))
            : '—';
    }
}


// =============================================================================
// SEÇÃO 8 — FORMULÁRIO 1: DADOS PESSOAIS
// Endpoints:
//   PUT /api/usuarios/{id}/dados-pessoais  → { nome, sobrenome, setor }
//   PUT /api/usuarios/{id}/email           → { novoEmail }
// =============================================================================

async function salvarDadosPessoais() {
    if (!usuarioAtual) return;

    const nome      = (document.getElementById('fNome')?.value      ?? '').trim();
    const sobrenome = (document.getElementById('fSobrenome')?.value  ?? '').trim();
    const email     = (document.getElementById('fEmail')?.value      ?? '').trim();
    const setor     =  document.getElementById('fSetor')?.value      ?? '';

    // Validações
    if (!nome || !sobrenome) { mostrarErroDados('Nome e sobrenome são obrigatórios.'); return; }
    if (!_validarEmail(email)) { mostrarErroDados('Informe um e-mail válido.'); return; }

    setLoadingDados(true);

    const id    = usuarioAtual.id;
    const erros = [];

    // 1) Dados pessoais (nome, sobrenome, setor)
    if (nome !== usuarioAtual.nome || sobrenome !== usuarioAtual.sobrenome || setor !== usuarioAtual.setor) {
        try {
            await atualizarDadosPessoais(id, { nome, sobrenome, setor });
        } catch {
            erros.push('Erro ao atualizar dados pessoais.');
        }
    }

    // 2) E-mail (endpoint dedicado)
    if (email !== usuarioAtual.email) {
        try {
            await atualizarEmail(id, email);
        } catch (err) {
            erros.push(
                err.status === 400
                    ? 'Este e-mail já está em uso por outro usuário.'
                    : 'Erro ao atualizar e-mail.'
            );
        }
    }

    setLoadingDados(false);

    if (erros.length > 0) { mostrarErroDados(erros.join(' | ')); return; }

    await carregarDados();
    mostrarSucessoDados();
}


// =============================================================================
// SEÇÃO 9 — FORMULÁRIO 2: ALTERAR SENHA
// Endpoint:
//   PUT /api/usuarios/{id}/senha  → { novaSenha }
// Hash aplicado pelo backend — nunca enviar senha já hasheada.
// =============================================================================

async function salvarSenha() {
    if (!usuarioAtual) return;

    const novaSenha = document.getElementById('fNovaSenha')?.value     ?? '';
    const confirmar = document.getElementById('fConfirmarSenha')?.value ?? '';

    // Validações
    if (novaSenha.length < 8) { mostrarErroSenha('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    if (novaSenha !== confirmar) { mostrarErroSenha('A nova senha e a confirmação não coincidem.'); return; }

    setLoadingSenha(true);

    try {
        await atualizarSenha(usuarioAtual.id, novaSenha);
        _limparCamposSenha();
        mostrarSucessoSenha();
    } catch {
        mostrarErroSenha('Erro ao atualizar a senha. Tente novamente.');
    } finally {
        setLoadingSenha(false);
    }
}


// =============================================================================
// SEÇÃO 10 — HELPERS PRIVADOS
// =============================================================================

function _setVal(id, val)  { const el = document.getElementById(id); if (el) el.value       = val; }
function _setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function _iniciais(nome, sobrenome) {
    return (((nome ?? '')[0] ?? '') + ((sobrenome ?? '')[0] ?? '')).toUpperCase() || '?';
}
function _validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function _fmtData(date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function _fmtDataHora(date) {
    return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}
function _limparCamposSenha() {
    _setVal('fNovaSenha',      '');
    _setVal('fConfirmarSenha', '');
}
