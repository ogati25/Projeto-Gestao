// =============================================================================
// cadastro.js — Backend do cadastro de usuário
// Responsabilidade: dados de domínio, validação e comunicação com a API.
//
// O que está aqui:
//   - Enum Setor (espelha o backend .NET)
//   - populateSetores() — popula o <select id="setor"> com as options do enum
//   - validarFormulario() — validação client-side antes de chamar a API
//   - handleCadastro() — orquestra validação → API → feedback
//
// O que NÃO está aqui (fica no <script> inline do HTML):
//   - Toggle de visibilidade de senha
//   - Barra de força de senha
//   - mostrarErro / mostrarSucesso / ocultarAlertas / setLoading
//   - Qualquer manipulação visual de UI
//   - addEventListener de botões e teclas
//
// Dependências:
//   - api.js (criarUsuario) — deve ser carregado antes no HTML
//   - Funções de UI definidas no <script> inline do HTML:
//       mostrarErro(), mostrarSucesso(), ocultarAlertas(), setLoading()
// =============================================================================


// =============================================================================
// SEÇÃO 1 — ENUM DE DOMÍNIO: SETOR
// Values são os nomes EXATOS do enum Setor do backend (Setor.cs).
// O ASP.NET com JsonStringEnumConverter deserializa pela string do nome.
// ATENÇÃO: 'CallCenter' sem espaço — bate exatamente com o enum C#.
// =============================================================================

const SETORES_USUARIO = [
    { value: 'RH',          label: 'RH'          },
    { value: 'Suporte',     label: 'Suporte'     },
    { value: 'Produtos',    label: 'Produtos'    },
    { value: 'Auditoria',   label: 'Auditoria'   },
    { value: 'Diretoria',   label: 'Diretoria'   },
    { value: 'CallCenter',  label: 'Call Center' }, // value sem espaço = nome do enum
    { value: 'Dev',         label: 'Dev'         },
    { value: 'Cofre',       label: 'Cofre'       },
    { value: 'Servidor',    label: 'Servidor'    },
];

// =============================================================================
// SEÇÃO 2 — POPULATE DO SELECT DE SETOR
// Injeta as <option> no <select id="setor"> que já existe no HTML.
// O <select> deve ter uma <option value="">Selecione...</option> no HTML
// para nunca ficar invisível antes do script rodar.
// =============================================================================

/**
 * Popula o <select id="setor"> com as opções do enum Setor do backend.
 * Chamado pelo script inline do HTML.
 */
function populateSetores() {
    const select = document.getElementById('setor');
    if (!select) {
        console.error('[cadastro.js] #setor não encontrado.');
        return;
    }

    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Selecione o setor —';
    select.appendChild(blank);

    SETORES_USUARIO.forEach(s => {
        const opt       = document.createElement('option');
        opt.value       = s.value; // string exata do enum C#
        opt.textContent = s.label; // label legível para o usuário
        select.appendChild(opt);
    });
}

// =============================================================================
// SEÇÃO 3 — VALIDAÇÃO CLIENT-SIDE
// Verifica os campos antes de disparar qualquer requisição à API.
// Depende de mostrarErro() definida no script inline do HTML.
// =============================================================================

/**
 * Valida todos os campos do formulário de cadastro.
 * @returns {boolean} true se todos os campos são válidos
 */
function validarFormulario() {
    const nome      = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const email     = document.getElementById('email').value.trim();
    const setor     = document.getElementById('setor').value;
    const senha     = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;

    if (!nome)                                                { mostrarErro('Por favor, informe o seu nome.');               return false; }
    if (!sobrenome)                                           { mostrarErro('Por favor, informe o seu sobrenome.');          return false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErro('Informe um e-mail válido.');                   return false; }
    if (setor === '')                                         { mostrarErro('Selecione o seu setor.');                      return false; }
    if (senha.length < 8)                                     { mostrarErro('A senha deve ter pelo menos 8 caracteres.');   return false; }
    if (senha !== confirmar)                                  { mostrarErro('As senhas não coincidem.');                    return false; }

    return true;
}

// =============================================================================
// SEÇÃO 4 — HANDLER DE CADASTRO
// Chamado diretamente pelo onclick do botão no HTML: onclick="handleCadastro()"
// Orquestra: validação → criarUsuario() (api.js) → feedback → redirecionamento.
// =============================================================================

/**
 * Envia UsuarioCreateDto para POST /api/usuarios via criarUsuario() de api.js.
 *
 * UsuarioCreateDto esperado pelo backend:
 * { nome, sobrenome, email, setor (string = nome do enum), senha }
 *
 * O hash da senha é aplicado pelo backend (PasswordHasher).
 */
async function handleCadastro() {
    ocultarAlertas();
    if (!validarFormulario()) return;

    const nome      = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const email     = document.getElementById('email').value.trim();
    const setor     = document.getElementById('setor').value; // string do enum, não parseInt
    const senha     = document.getElementById('senha').value;

    setLoading(true);

    try {
        // criarUsuario() definida em api.js → POST /api/usuarios
        await criarUsuario({ nome, sobrenome, email, setor, senha });

        mostrarSucesso();
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);

    } catch (err) {
        if      (err.status === 0)   mostrarErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
        else if (err.status === 409) mostrarErro(err.corpo?.message || 'Este e-mail já está cadastrado.');
        else if (err.status === 400) mostrarErro(err.corpo?.message || 'Dados inválidos. Verifique os campos.');
        else                         mostrarErro(`Erro ao criar conta (código ${err.status || '?'}). Tente novamente.`);
    } finally {
        setLoading(false);
    }
}
