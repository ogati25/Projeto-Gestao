// =============================================================================
// perfil.js — Backend da tela de perfil
//
// SESSÃO:
//   O login.js usa sessionStorage com chave 'usuarioLogado'.
//   O objeto salvo vem direto da API, que sem JsonNamingPolicy.CamelCase
//   no Program.cs serializa em PascalCase: { Id, Nome, Sobrenome, Email, Setor }.
//   _norm() converte para camelCase internamente para uso seguro aqui.
//
// Dependências:
//   - api.js  (getUsuario, atualizarDadosPessoais, atualizarEmail, atualizarSenha)
//   - Funções de UI definidas no inline do HTML:
//       mostrarErroDados / mostrarSucessoDados / setLoadingDados
//       mostrarErroSenha / mostrarSucessoSenha / setLoadingSenha
// =============================================================================


// ── Enum Setor (espelha Setor.cs) ────────────────────────────────────────────
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

// ── Chave idêntica à usada em login.js ───────────────────────────────────────
const _SESS_KEY = 'usuarioLogado';
// Persiste a data/hora da última alteração salva com sucesso (localStorage)
const _ULT_KEY  = 'tl_perfil_ultima_atualizacao';

// ── Estado local ─────────────────────────────────────────────────────────────
let usuarioAtual = null;


// =============================================================================
// SESSÃO
// =============================================================================

/**
 * Normaliza PascalCase (.NET) → camelCase para uso interno.
 * Aceita qualquer combinação dos dois formatos.
 */
function _norm(u) {
    if (!u) return null;
    return {
        id:        u.id        ?? u.Id        ?? null,
        nome:      u.nome      ?? u.Nome      ?? '',
        sobrenome: u.sobrenome ?? u.Sobrenome ?? '',
        email:     u.email     ?? u.Email     ?? '',
        setor:     u.setor     ?? u.Setor     ?? '',
        criadoEm:  u.criadoEm  ?? u.CriadoEm  ?? null,
    };
}

/** Lê a sessão salva pelo login.js e normaliza para camelCase. */
function _lerSessao() {
    try {
        const raw = sessionStorage.getItem(_SESS_KEY);
        return raw ? _norm(JSON.parse(raw)) : null;
    } catch { return null; }
}

/** Atualiza a sessão mesclando os dados novos (mantém o que o login.js salvou). */
function _gravarSessao(dados) {
    try {
        const atual = JSON.parse(sessionStorage.getItem(_SESS_KEY) ?? '{}');
        sessionStorage.setItem(_SESS_KEY, JSON.stringify({ ...atual, ...dados }));
    } catch {}
}

/** Encerra a sessão e redireciona — compatível com logout() do login.js. */
function encerrarSessao() {
    sessionStorage.removeItem(_SESS_KEY);
    window.location.href = 'login.html';
}


// =============================================================================
// INICIALIZAÇÃO — chamada pelo DOMContentLoaded do HTML
// =============================================================================

async function inicializarPerfil() {
    const sessao = _lerSessao();

    // Sem sessão → redireciona imediatamente (mesma lógica de verificarSessao() do login.js)
    if (!sessao?.id) {
        window.location.href = 'login.html';
        return;
    }

    _popularSetores();
    await carregarDados();
}


// =============================================================================
// CARREGAR DADOS  —  GET /api/usuarios/{id}
// Chamado também pelo botão "Cancelar" do form de dados pessoais.
// =============================================================================

async function carregarDados() {
    const sessao = _lerSessao();
    if (!sessao?.id) { window.location.href = 'login.html'; return; }

    try {
        const raw     = await getUsuario(sessao.id);   // api.js
        const usuario = _norm(raw);

        usuarioAtual = usuario;
        _gravarSessao(usuario);                        // mantém sessão atualizada

        _preencherFormulario(usuario);
        _preencherCard(usuario);

    } catch (err) {
        if (err.status === 404 || err.status === 401) {
            encerrarSessao();
        } else {
            mostrarErroDados('Não foi possível carregar os dados do perfil.');
        }
    }
}


// =============================================================================
// PREENCHER UI
// =============================================================================

function _preencherFormulario(u) {
    _v('fNome',      u.nome);
    _v('fSobrenome', u.sobrenome);
    _v('fEmail',     u.email);

    const sel = document.getElementById('fSetor');
    if (sel) sel.value = u.setor || SETORES[0].value;

    // Lê a data salva no localStorage; exibe '—' se nunca houve alteração
    const salvo = localStorage.getItem(_ULT_KEY);
    _t('ultimaAtualizacao', salvo ?? '—');
}

function _preencherCard(u) {
    const nome = `${u.nome} ${u.sobrenome}`.trim();
    const ini  = ((u.nome[0] ?? '') + (u.sobrenome[0] ?? '')).toUpperCase() || '?';

    _t('sidebarName',  nome  || '—');
    _t('sidebarRole',  u.setor || '—');
    _t('sidebarEmail', u.email  || '—');
    _t('sidebarSetor', u.setor  || '—');
    _t('sidebarNivel', 'Usuário');
    _t('avatarBig',    ini);
    _t('headerAvatar', ini);

    const elM = document.getElementById('sidebarMembro');
    if (elM) elM.textContent = u.criadoEm ? _dt(new Date(u.criadoEm)) : '—';
}


// =============================================================================
// FORMULÁRIO 1 — DADOS PESSOAIS
// PUT /api/usuarios/{id}/dados-pessoais  →  { nome, sobrenome, setor }
// PUT /api/usuarios/{id}/email           →  { novoEmail }
// =============================================================================

async function salvarDadosPessoais() {
    if (!usuarioAtual) return;

    const nome      = (document.getElementById('fNome')?.value      ?? '').trim();
    const sobrenome = (document.getElementById('fSobrenome')?.value  ?? '').trim();
    const email     = (document.getElementById('fEmail')?.value      ?? '').trim();
    const setor     =  document.getElementById('fSetor')?.value      ?? '';

    if (!nome || !sobrenome) { mostrarErroDados('Nome e sobrenome são obrigatórios.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErroDados('Informe um e-mail válido.'); return; }

    setLoadingDados(true);
    const erros = [];

    if (nome !== usuarioAtual.nome || sobrenome !== usuarioAtual.sobrenome || setor !== usuarioAtual.setor) {
        try { await atualizarDadosPessoais(usuarioAtual.id, { nome, sobrenome, setor }); }
        catch { erros.push('Erro ao atualizar dados pessoais.'); }
    }

    if (email !== usuarioAtual.email) {
        try { await atualizarEmail(usuarioAtual.id, email); }
        catch (err) {
            erros.push(err.status === 400
                ? 'Este e-mail já está em uso por outro usuário.'
                : 'Erro ao atualizar e-mail.');
        }
    }

    setLoadingDados(false);

    if (erros.length) { mostrarErroDados(erros.join(' | ')); return; }

    // Grava data/hora do salvamento para exibir em "Última atualização"
    localStorage.setItem(_ULT_KEY, _dtHora(new Date()));

    await carregarDados();
    mostrarSucessoDados();
}


// =============================================================================
// FORMULÁRIO 2 — ALTERAR SENHA
// PUT /api/usuarios/{id}/senha  →  { novaSenha }
// =============================================================================

async function salvarSenha() {
    if (!usuarioAtual) return;

    const nova      = document.getElementById('fNovaSenha')?.value      ?? '';
    const confirmar = document.getElementById('fConfirmarSenha')?.value  ?? '';

    if (nova.length < 8)    { mostrarErroSenha('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    if (nova !== confirmar) { mostrarErroSenha('A nova senha e a confirmação não coincidem.');    return; }

    setLoadingSenha(true);
    try {
        await atualizarSenha(usuarioAtual.id, nova);   // api.js
        document.getElementById('fNovaSenha').value      = '';
        document.getElementById('fConfirmarSenha').value = '';
        // Grava data/hora para "Última atualização"
        localStorage.setItem(_ULT_KEY, _dtHora(new Date()));
        _t('ultimaAtualizacao', localStorage.getItem(_ULT_KEY));
        mostrarSucessoSenha();
    } catch {
        mostrarErroSenha('Erro ao atualizar a senha. Tente novamente.');
    } finally {
        setLoadingSenha(false);
    }
}


// =============================================================================
// HELPERS PRIVADOS
// =============================================================================

function _popularSetores() {
    const sel = document.getElementById('fSetor');
    if (!sel) return;
    sel.innerHTML = SETORES.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
}

function _v(id, val) { const el = document.getElementById(id); if (el) el.value       = val ?? ''; }
function _t(id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? ''; }

function _dt(d)     { return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }); }
function _dtHora(d) { return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
