/**
 * ============================================================
 *  INVENTÁRIO — SCRIPT DE BACKEND
 * ============================================================
 *  Responsabilidade: dados, lógica de domínio, comunicação
 *  com a API e montagem dinâmica dos formulários/tabelas.
 *
 *  Este arquivo depende das funções expostas por inventario.frontend.js:
 *   - openModal / closeModal
 *   - mostrarErroModal / limparErroModal
 *   - validarObrigatorios
 *   - renderChips
 *   - aplicarMascaraIP / MAC / Telefone / Money
 *   - activeFilters, currentCategory, currentMode, pendingToggleRow
 *   - aplicarToggleVisual
 *
 *  O que está aqui:
 *   - Enums de domínio (STATUS, SETOR, TIPO_PC, etc.)
 *   - Definição dos campos de formulário por categoria (formFields)
 *   - Definição dos filtros disponíveis por categoria (filterDefs)
 *   - Criação de inputs e selects com as opções corretas
 *   - Render dos campos do modal (renderFields)
 *   - Render das linhas da tabela (renderRow)
 *   - Carregar dados da API (carregarTabela)
 *   - Cache de dados e aplicação de filtros
 *   - Mapear form → payload da API (mapFormToApi)
 *   - Mapear item da API → form de edição (mapItemToForm)
 *   - submitAdd, submitEdit — envia dados para a API
 *   - confirmToggleActive — chama a API e depois atualiza o visual
 *   - buildFilterPropSelect — popula o select de propriedades de filtro
 *   - addFilterBackend — lê os filtros e adiciona ao estado
 * ============================================================
 */

// ============================================================
//  ENUMS DE DOMÍNIO
//  Espelham os enums do backend .NET para popular os selects
//  dos formulários. Qualquer alteração no backend deve ser
//  refletida aqui.
// ============================================================

// Garantia de segurança: se o script inline do HTML falhou antes de
// declarar essas variáveis globais, inicializa aqui como fallback.
if (typeof currentCategory === 'undefined') var currentCategory = 'computadores';
if (typeof currentMode     === 'undefined') var currentMode     = 'gestao';
if (typeof activeFilters   === 'undefined') var activeFilters   = [];

// ── Enums DINÂMICOS ─────────────────────────────────────────────────────────
// Populados via GET /api/opcoes ao carregar a página.
// Os arrays começam vazios e são preenchidos por carregarOpcoesDinamicas().
// Qualquer função que depende deles (criarSelect, filterDefs) usará os valores
// atualizados automaticamente pois referenciamos o mesmo array.

// ── Anteriormente dinâmicos ──────────────────────────────────────────────────
let SETOR    = [];
let SO       = [];
let ATIV_SO  = [];
let OFFICE   = [];
let ATIV_OFF = [];
let OPERADORA   = [];
let GERACAO_RAM = [];
let TIPO_DISCO  = [];
let TIPO_GPU    = [];

// ── Anteriormente enums fixos C# — agora dinâmicos via OpcoesEnum ────────────
let STATUS          = [];  // era enum Status
let TIPO_PC         = [];  // era enum TipoComputador
let TIPO_MEMORIA_RAM = []; // era enum TipoMemoriaRAM  (exibido como string, enviado como int)
let CONECTOR_VIDEO  = [];  // era enum TipoConectorVideo
let CONECTOR_CARR   = [];  // era enum TipoConectorCarregador (celular)
let RESOLUCAO       = [];  // era enum Resolucao (monitor)
let TIPO_PER        = [];  // era enum TipoPeriferico (mouse/teclado/fone)
let CONECTIV        = [];  // era enum Conectividade (mouse/teclado/fone)
let SWITCH          = [];  // era enum Switch (teclado)

/**
 * Converte um array de strings da API em [{value, label}].
 * O valor e o label são idênticos pois o backend salva a string diretamente.
 */
function stringsParaOpcoes(arr) {
    return (arr || []).map(v => ({ value: v, label: v }));
}

/**
 * Busca todas as opções dinâmicas da API e popula os arrays globais.
 * Chamado uma vez no carregamento da página.
 * Em caso de erro, os arrays ficam vazios (selects aparecem só com "— Selecione —").
 */
async function carregarOpcoesDinamicas() {
    try {
        const opcoes = await getOpcoes(); // chaves em camelCase: { setor: [...], sistemaOperacional: [...], ... }
        if (!opcoes) return;

        // ASP.NET serializa as chaves do Dictionary em camelCase por padrão.
        // Criamos um mapa normalizado para acessar independente do case.
        const get = (tipo) => {
            // Tenta exato, depois camelCase (primeira letra minúscula)
            const camel = tipo.charAt(0).toLowerCase() + tipo.slice(1);
            const arr = opcoes[tipo] ?? opcoes[camel] ?? [];
            return stringsParaOpcoes(arr);
        };

        // ── Anteriormente dinâmicos ─────────────────────────────────────────
        SETOR.length    = 0; SETOR.push(...get('Setor'));
        SO.length       = 0; SO.push(...get('SistemaOperacional'));
        ATIV_SO.length  = 0; ATIV_SO.push(...get('AtivacaoSO'));
        OFFICE.length   = 0; OFFICE.push(...get('TipoOffice'));
        ATIV_OFF.length = 0; ATIV_OFF.push(...get('AtivacaoOffice'));
        OPERADORA.length    = 0; OPERADORA.push(...get('Operadora'));
        GERACAO_RAM.length  = 0; GERACAO_RAM.push(...get('GeracaoRAM'));
        TIPO_DISCO.length   = 0; TIPO_DISCO.push(...get('TipoDisco'));
        TIPO_GPU.length     = 0; TIPO_GPU.push(...get('TipoPlacaVideo'));

        // ── Anteriormente enums fixos C# — agora vindos do banco ────────────
        STATUS.length         = 0; STATUS.push(...get('Status'));
        TIPO_PC.length        = 0; TIPO_PC.push(...get('TipoComputador'));
        CONECTOR_VIDEO.length = 0; CONECTOR_VIDEO.push(...get('TipoConectorVideo').map(o => o.value));
        CONECTOR_CARR.length  = 0; CONECTOR_CARR.push(...get('TipoConectorCarregador'));
        RESOLUCAO.length      = 0; RESOLUCAO.push(...get('Resolucao'));
        TIPO_PER.length       = 0; TIPO_PER.push(...get('TipoPeriferico'));
        CONECTIV.length       = 0; CONECTIV.push(...get('Conectividade'));
        SWITCH.length         = 0; SWITCH.push(...get('Switch'));

        // TipoMemoriaRAM: valores do banco são strings como "8GB", "16GB".
        // Exibimos a string no select mas na hora de enviar ao backend
        // convertemos para int via ramStringParaInt().
        TIPO_MEMORIA_RAM.length = 0;
        TIPO_MEMORIA_RAM.push(...get('TipoMemoriaRAM'));

    } catch (e) {
        console.warn('Não foi possível carregar as opções dinâmicas da API:', e);
    }
}

/**
 * Converte uma string de RAM vinda do banco (ex: "8GB", "16 GB", "16")
 * para um inteiro em GB que o backend espera em List<int>.
 * Extrai o primeiro número encontrado na string.
 * Retorna 0 se não encontrar nenhum número.
 */
function ramStringParaInt(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    const num = parseInt(String(valor).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

/** Opções de quantidade para selects de slots dinâmicos */
const QUANT_SLOTS  = ['0','1','2','3','4','5','6','7','8'];
const QUANT_DISCOS = ['0','1','2','3','4','5','6'];
const QUANT_GPUS   = ['0','1','2','3','4'];

// Tipo de disco e GPU agora são string? direto — sem mapa numérico necessário.
function resolverTipoDisco(tipo) { return tipo || '—'; }
function resolverTipoGpu(tipo)   { return tipo || '—'; }
const QUANT_CON    = ['0','1','2','3','4','5','6'];

/** Mapa de slug → nome legível de cada categoria */
const categoryNames = {
    computadores: 'Computadores',
    monitores:    'Monitores',
    mouses:       'Mouses',
    teclados:     'Teclados',
    fones:        'Fones',
    celulares:    'Celulares',
    ramais:       'Ramais',
    chips:        'Chips/Números',
    extras:       'Extras',
};

// ============================================================
//  DEFINIÇÃO DOS CAMPOS DE FORMULÁRIO (formFields)
//  Cada categoria tem um array de descritores de campo.
//  O frontend usa esses descritores para saber COMO renderizar
//  cada campo (tipo, placeholder, máscara, obrigatoriedade).
//
//  Tipos especiais:
//   'processador_select' → select populado via API de processadores
//   'chip_selector'      → widget de seleção de chips via API
//   'whatsapp_list'      → lista dinâmica de contas WhatsApp
//   'checkbox'           → campo booleano
//
//  Chaves especiais que disparam listas dinâmicas ao mudar:
//   quant_slots / quant_discos / quant_gpus / quant_conectores
// ============================================================

const formFields = {

    // ----------------------------------------------------------
    //  COMPUTADORES
    // ----------------------------------------------------------
    computadores: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },
        { label: 'Tipo',   key: 'tipo',   type: 'select', options: TIPO_PC, required: true },
        { label: 'IP',     key: 'ip',     type: 'text', placeholder: 'Ex: 192.168.0.10', mask: 'ip', maxlen: 15 },

        { section: 'Processador', mode: 'suporte' },
        // 'processador_select' é populado via API de processadores (ver getProcessadores())
        { label: 'Processador', key: 'processadorId', type: 'processador_select', mode: 'suporte' },

        { section: 'Memória RAM', mode: 'suporte' },
        { label: 'Geração RAM',           key: 'geracaoRAM',    type: 'select', options: GERACAO_RAM, mode: 'suporte' },
        { label: 'Velocidade RAM (MHz)',  key: 'velocidadeRAM', type: 'number', placeholder: 'Ex: 3200', maxlen: 4, mode: 'suporte' },
        // Ao alterar este select, renderSlotsRAM() gera um campo por slot dinamicamente
        { label: 'Qtd. Slots', key: 'quant_slots', type: 'select', options: QUANT_SLOTS },

        { section: 'Armazenamento', mode: 'suporte' },
        // Ao alterar este select, renderDiscos() gera um par tipo+tamanho por disco
        { label: 'Qtd. Discos', key: 'quant_discos', type: 'select', options: QUANT_DISCOS },

        { section: 'Placa de Vídeo', mode: 'suporte' },
        // Ao alterar, renderPlacasVideo() gera um par tipo+VRAM por GPU
        { label: 'Qtd. GPUs', key: 'quant_gpus', type: 'select', options: QUANT_GPUS, mode: 'suporte' },

        { section: 'Conectores de Vídeo', mode: 'suporte' },
        // Ao alterar, renderConectoresVideo() gera um select por conector
        { label: 'Qtd. Conectores', key: 'quant_conectores', type: 'select', options: QUANT_CON, mode: 'suporte' },

        { section: 'Sistema Operacional' },
        { label: 'Sistema Op.',    key: 'so',             type: 'select', options: SO,       mode: 'suporte' },
        { label: 'Ativação SO',    key: 'ativacao_so',    type: 'select', options: ATIV_SO },
        { label: 'Office',         key: 'office',         type: 'select', options: OFFICE,   mode: 'suporte' },
        { label: 'Ativação Office',key: 'ativacao_office',type: 'select', options: ATIV_OFF },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date',  mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  MONITORES
    // ----------------------------------------------------------
    monitores: [
        { section: 'Geral' },
        { label: 'Modelo',        key: 'modelo',  type: 'text',   maxlen: 100, required: true },
        { label: 'Tamanho (pol.)',key: 'tamanho', type: 'number', placeholder: 'Ex: 27.5' },

        { section: 'Especificações', mode: 'suporte' },
        { label: 'Resolução',       key: 'resolucao',  type: 'select', options: RESOLUCAO, mode: 'suporte' },
        { label: 'Frequência (Hz)', key: 'frequencia', type: 'number', placeholder: 'Ex: 144', mode: 'suporte' },

        { section: 'Conectividade', mode: 'suporte' },
        { label: 'HDMI',        key: 'hdmi',        type: 'checkbox', mode: 'suporte' },
        { label: 'DisplayPort', key: 'displayPort', type: 'checkbox', mode: 'suporte' },
        { label: 'VGA',         key: 'vga',         type: 'checkbox', mode: 'suporte' },
        { label: 'DVI',         key: 'dvi',         type: 'checkbox', mode: 'suporte' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  MOUSES
    // ----------------------------------------------------------
    mouses: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },

        { section: 'Especificações', mode: 'suporte' },
        { label: 'Tipo',          key: 'tipo',          type: 'select', options: TIPO_PER, mode: 'suporte' },
        { label: 'Conectividade', key: 'conectividade', type: 'select', options: CONECTIV, mode: 'suporte' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  TECLADOS
    // ----------------------------------------------------------
    teclados: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },

        { section: 'Especificações', mode: 'suporte' },
        { label: 'Tipo',          key: 'tipo',          type: 'select', options: TIPO_PER, mode: 'suporte' },
        { label: 'Conectividade', key: 'conectividade', type: 'select', options: CONECTIV, mode: 'suporte' },
        { label: 'Switch',        key: 'switch',        type: 'select', options: SWITCH,   mode: 'suporte' },
        { label: 'Tamanho (%)',   key: 'tamanho',       type: 'number', placeholder: 'Ex: 75', mode: 'suporte' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  FONES
    // ----------------------------------------------------------
    fones: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },

        { section: 'Especificações', mode: 'suporte' },
        { label: 'Tipo',          key: 'tipo',          type: 'select',   options: TIPO_PER, mode: 'suporte' },
        { label: 'Conectividade', key: 'conectividade', type: 'select',   options: CONECTIV, mode: 'suporte' },
        { label: 'Microfone',     key: 'microfone',     type: 'checkbox', mode: 'suporte' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  CELULARES
    // ----------------------------------------------------------
    celulares: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },

        { section: 'Especificações' },
        { label: 'Armazenamento (GB)',   key: 'armazenamento', type: 'number', placeholder: 'Ex: 128' },
        { label: 'RAM (GB)',             key: 'ram',           type: 'number', placeholder: 'Ex: 8' },
        { label: 'Conector Carregador', key: 'conectividade', type: 'select', options: CONECTOR_CARR },

        { section: 'Chips no Celular' },
        // 'chip_selector': carrega chips via getChips() e permite vincular até 2
        { label: 'Chips', key: 'chipIds', type: 'chip_selector', max: 2, span2: true },

        { section: 'Contas WhatsApp' },
        // 'whatsapp_list': lista dinâmica de até 6 pares {numero, dono}
        { label: 'Contas WhatsApp', key: 'contasWhatsapp', type: 'whatsapp_list', max: 6, span2: true },

        { section: 'Dados Administrativos' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12 },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  RAMAIS
    // ----------------------------------------------------------
    ramais: [
        { section: 'Geral' },
        { label: 'Modelo', key: 'modelo', type: 'text', maxlen: 100, required: true },
        { label: 'Cor',    key: 'cor',    type: 'text', placeholder: 'Ex: Preto', maxlen: 30 },

        { section: 'Especificações', mode: 'suporte' },
        { label: 'Tipo',        key: 'tipo',        type: 'text',     placeholder: 'Ex: IP, Analógico', mode: 'suporte' },
        { label: 'IP',          key: 'ip',          type: 'text',     placeholder: 'Ex: 192.168.0.50', mask: 'ip', maxlen: 15, mode: 'suporte' },
        { label: 'MAC',         key: 'mac',         type: 'text',     placeholder: 'Ex: AA:BB:CC:DD:EE:FF', mask: 'mac', mode: 'suporte' },
        { label: 'Linha',       key: 'linha',       type: 'text',     placeholder: 'Ex: 9000', maxlen: 20, mode: 'suporte' },
        { label: 'Número',      key: 'numero',      type: 'text',     placeholder: '(11) 99999-9999', mask: 'phone', mode: 'suporte' },
        { label: 'Configurado', key: 'configurado', type: 'checkbox', mode: 'suporte' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  CHIPS / NÚMEROS
    // ----------------------------------------------------------
    chips: [
        { section: 'Dados do Chip' },
        { label: 'Número',               key: 'numero',    type: 'text',   placeholder: '+55 (11) 99999-9999', mask: 'phone', required: true },
        { label: 'Operadora',            key: 'operadora', type: 'select', options: OPERADORA, required: true },
        { label: 'Dono',                 key: 'dono',      type: 'text',   maxlen: 80 },
        { label: 'Celular Vinculado',    key: 'celularId', type: 'celular_selector' },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Plano (R$)',      key: 'plano',           type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 10, mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],

    // ----------------------------------------------------------
    //  EXTRAS (acessórios e periféricos avulsos)
    // ----------------------------------------------------------
    extras: [
        { section: 'Geral' },
        { label: 'Categoria',  key: 'categoria',  type: 'text',   placeholder: 'Ex: Adaptador, Hub, Cabo...', required: true },
        { label: 'Quantidade', key: 'quantidade', type: 'number', placeholder: '0', min: 0 },
        { label: 'Descrição',  key: 'descricao',  type: 'textarea', span2: true },

        { section: 'Dados Administrativos', mode: 'gestao' },
        { label: 'Data Aquisição',  key: 'data_aquisicao',  type: 'date', mode: 'gestao' },
        { label: 'Preço Aquisição', key: 'preco_aquisicao', type: 'text', placeholder: 'R$ 0,00', mask: 'money', maxlen: 12, mode: 'gestao' },

        { section: 'Atribuição' },
        { label: 'Status',      key: 'status',      type: 'select', options: STATUS, required: true },
        { label: 'Setor',       key: 'setor',       type: 'select', options: SETOR,  required: true },
        { label: 'Usuário',     key: 'usuario',     type: 'text',   maxlen: 60,      required: true },
        { label: 'Observações', key: 'observacoes', type: 'textarea', span2: true },
    ],
};

// ============================================================
//  DEFINIÇÃO DOS FILTROS DISPONÍVEIS (filterDefs)
//
//  Cada categoria tem UMA lista única de filtros — idêntica para
//  suporte e gestao (a distinção visual de colunas fica em renderRow).
//  Ao trocar de modo, os filtros ativos são preservados.
//
//  Propriedades espelham exatamente as classes C# do backend:
//   Equipamento (base): id, codigo, usuario, dataAquisicao,
//                       precoAquisicao, ativo, setor, status, observacoes
//  Cada subclasse adiciona seus próprios campos.
// ============================================================
const filterDefs = {
    computadores: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tipo',          key: 'tipo',            values: TIPO_PC  },
            { label: 'IP',               key: 'ip'                                    },
            { label: 'Geração RAM',      key: 'geracaoRAM',      values: GERACAO_RAM  },
            { label: 'Velocidade RAM',   key: 'velocidadeRAM'                         },
            { label: 'Sistema Op.',   key: 'so',              values: SO       },
            { label: 'Ativação SO',   key: 'ativacao_so',     values: ATIV_SO  },
            { label: 'Office',        key: 'office',          values: OFFICE   },
            { label: 'Status',        key: 'status',          values: STATUS   },
            { label: 'Setor',         key: 'setor',           values: SETOR    },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',         key: 'ativo',           values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tipo',            key: 'tipo',            values: TIPO_PC  },
            { label: 'IP',               key: 'ip'                                    },
            { label: 'Geração RAM',      key: 'geracaoRAM',      values: GERACAO_RAM  },
            { label: 'Velocidade RAM',   key: 'velocidadeRAM'                         },
            { label: 'Ativação SO',     key: 'ativacao_so',     values: ATIV_SO  },
            { label: 'Ativação Office', key: 'ativacao_office', values: ATIV_OFF },
            { label: 'Status',          key: 'status',          values: STATUS   },
            { label: 'Setor',           key: 'setor',           values: SETOR    },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',           key: 'ativo',           values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    monitores: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tamanho (pol.)',   key: 'tamanho'                               },
            { label: 'Resolução', key: 'resolucao', values: RESOLUCAO },
            { label: 'Frequência (Hz)',  key: 'frequencia'                            },
            { label: 'HDMI',             key: 'hdmi',            values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'DisplayPort',      key: 'displayPort',     values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'VGA',              key: 'vga',             values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'DVI',              key: 'dvi',             values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'Status',    key: 'status',    values: STATUS    },
            { label: 'Setor',     key: 'setor',     values: SETOR     },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',     key: 'ativo',     values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    mouses: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tipo',          key: 'tipo',          values: TIPO_PER },
            { label: 'Conectividade', key: 'conectividade', values: CONECTIV },
            { label: 'Status',        key: 'status',        values: STATUS   },
            { label: 'Setor',         key: 'setor',         values: SETOR    },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',         key: 'ativo',         values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    teclados: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tipo',          key: 'tipo',          values: TIPO_PER },
            { label: 'Conectividade', key: 'conectividade', values: CONECTIV },
            { label: 'Switch',        key: 'switch',        values: SWITCH   },
            { label: 'Tamanho (%)',      key: 'tamanho'                               },
            { label: 'Status',        key: 'status',        values: STATUS   },
            { label: 'Setor',         key: 'setor',         values: SETOR    },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',         key: 'ativo',         values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    fones: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Tipo',          key: 'tipo',          values: TIPO_PER },
            { label: 'Conectividade', key: 'conectividade', values: CONECTIV },
            { label: 'Microfone',        key: 'microfone',       values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'Status',        key: 'status',        values: STATUS   },
            { label: 'Setor',         key: 'setor',         values: SETOR    },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',         key: 'ativo',         values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    celulares: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Memória RAM (GB)', key: 'ram'                                   },
            { label: 'Armazenamento (GB)',key: 'armazenamento'                         },
            { label: 'Conector Carregador', key: 'conectividade', values: CONECTOR_CARR },
            { label: 'Status',              key: 'status',        values: STATUS              },
            { label: 'Setor',               key: 'setor',         values: SETOR               },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',           key: 'ativo',           values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    ramais: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Cor',              key: 'cor'                                   },
            { label: 'Tipo',             key: 'tipo'                                  },
            { label: 'IP',               key: 'ip'                                    },
            { label: 'MAC',              key: 'mac'                                   },
            { label: 'Linha',            key: 'linha'                                 },
            { label: 'Número',           key: 'numero'                                },
            { label: 'Configurado', key: 'configurado', values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
            { label: 'Status',      key: 'status',      values: STATUS        },
            { label: 'Setor',       key: 'setor',       values: SETOR         },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',       key: 'ativo',       values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Modelo',           key: 'modelo'                                },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    chips: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Número',           key: 'numero'                                },
            { label: 'Operadora', key: 'operadora', values: OPERADORA },
            { label: 'Dono',             key: 'dono'                                  },
            { label: 'Plano (R$)',       key: 'plano'                                 },
            { label: 'Celular Vinculado',key: 'celularId'                             },
            { label: 'Status',    key: 'status',    values: STATUS    },
            { label: 'Setor',     key: 'setor',     values: SETOR     },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',     key: 'ativo',     values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Número',           key: 'numero'                                },
            { label: 'Operadora', key: 'operadora', values: OPERADORA },
            { label: 'Status',    key: 'status',    values: STATUS    },
            { label: 'Setor',     key: 'setor',     values: SETOR     },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',     key: 'ativo',     values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
    extras: {
        suporte: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Categoria',        key: 'categoria'                             },
            { label: 'Descrição',        key: 'descricao'                             },
            { label: 'Quantidade',       key: 'quantidade'                            },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
        gestao: [
            { label: 'ID',               key: 'codigo'                                },
            { label: 'Categoria',        key: 'categoria'                             },
            { label: 'Descrição',        key: 'descricao'                             },
            { label: 'Quantidade',       key: 'quantidade'                            },
            { label: 'Status', key: 'status', values: STATUS },
            { label: 'Setor',  key: 'setor',  values: SETOR  },
            { label: 'Usuário',          key: 'usuario'                               },
            { label: 'Data Aquisição',   key: 'dataAquisicao'                         },
            { label: 'Preço Aquisição',  key: 'precoAquisicao'                        },
            { label: 'Observações',      key: 'observacoes'                           },
            { label: 'Ativo',  key: 'ativo',  values: [{value:'Sim',label:'Sim'},{value:'Não',label:'Não'}] },
        ],
    },
};

// ============================================================
//  HELPERS DE CRIAÇÃO DE ELEMENTOS DE FORMULÁRIO
//  Funções responsáveis por criar os inputs e selects
//  corretos com as opções de domínio e as máscaras do frontend.
// ============================================================

/**
 * Cria um elemento <select> com as opções fornecidas.
 * @param {string} name — atributo name do select
 * @param {Array<string|{value,label}>} options — opções do select
 * @param {string} valor — valor pré-selecionado
 * @returns {HTMLSelectElement}
 */
function criarSelect(name, options, valor = '') {
    const sel   = document.createElement('select');
    sel.name    = name;
    const blank = document.createElement('option');
    blank.value = ''; blank.textContent = '— Selecione —';
    sel.appendChild(blank);

    options.forEach(opt => {
        const o = document.createElement('option');
        if (typeof opt === 'object') {
            o.value       = opt.value;
            o.textContent = opt.label;
            if (valor === opt.value) o.selected = true;
        } else {
            o.value       = opt;
            o.textContent = opt;
            if (valor === opt) o.selected = true;
        }
        sel.appendChild(o);
    });

    return sel;
}

/**
 * Cria um elemento <input> com suporte a máscaras do frontend.
 * As máscaras são aplicadas via funções do inventario.frontend.js.
 *
 * @param {string} name         — atributo name do input
 * @param {string} valor        — valor inicial
 * @param {string} placeholder  — texto de placeholder
 * @param {string} tipo         — tipo HTML (text, number, date…)
 * @param {string|null} mask    — 'ip' | 'mac' | 'phone' | 'money' | null
 * @param {number|null} maxlen  — maxLength
 * @returns {HTMLInputElement}
 */
function criarInput(name, valor = '', placeholder = '', tipo = 'text', mask = null, maxlen = null) {
    const inp       = document.createElement('input');
    inp.type        = tipo;
    inp.name        = name;
    inp.value       = valor;
    if (placeholder) inp.placeholder = placeholder;
    if (maxlen)      inp.maxLength   = maxlen;

    // Delega a máscara para o frontend — as funções de máscara pertencem lá
    if      (mask === 'ip')    aplicarMascaraIP(inp);
    else if (mask === 'mac')   aplicarMascaraMAC(inp);
    else if (mask === 'phone') aplicarMascaraTelefone(inp, valor);
    else if (mask === 'money') aplicarMascaraMoney(inp, valor);

    return inp;
}

// ============================================================
//  RENDER DOS CAMPOS DINÂMICOS DE COMPUTADOR
//  Slots de RAM, discos e GPUs são gerados dinamicamente
//  ao alterar os selects de quantidade no formulário.
// ============================================================

/**
 * Insere um elemento logo após outro no DOM.
 * @param {HTMLElement} afterEl — elemento de referência
 * @param {HTMLElement} novoEl  — novo elemento a inserir
 */
function inserirApos(afterEl, novoEl) {
    afterEl.insertAdjacentElement('afterend', novoEl);
}

/**
 * Gera os selects de memória RAM para cada slot disponível.
 * Remove qualquer wrapper anterior para evitar duplicatas.
 *
 * @param {HTMLElement} afterGroup — .form-group do select de quantidade (referência de posição)
 * @param {number} quantidade      — número de slots a renderizar
 * @param {string[]} valores       — valores pré-preenchidos por slot (ex: em edição)
 */
function renderSlotsRAM(afterGroup, quantidade, valores = []) {
    const antigo = document.getElementById('slots-ram-wrapper');
    if (antigo) antigo.remove();
    if (!quantidade || quantidade < 1) return;

    // Calcula colunas: máximo 4 por linha, redistribui para evitar linhas desequilibradas
    // Ex: 5 → 3+2 | 6 → 3+3 | 7 → 4+3 | 8 → 4+4 | 9 → 3+3+3
    function calcularColunas(n) {
        if (n <= 4) return n;
        // Divide em grupos de até 4, tentando equilibrar
        const linhas = Math.ceil(n / 4);
        const base   = Math.floor(n / linhas);
        const resto  = n % linhas;
        // Se resto > 0, primeira linha tem base+1, restantes têm base
        // Mas queremos a linha com mais itens — a maior entre base e base+1
        return resto > 0 ? base + 1 : base;
    }

    const cols = calcularColunas(quantidade);

    const div = document.createElement('div');
    div.id        = 'slots-ram-wrapper';
    div.className = 'span-2';
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    for (let i = 0; i < quantidade; i++) {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lbl       = document.createElement('label');
        lbl.textContent = `Slot ${i + 1}`;
        group.appendChild(lbl);
        // valores[i] vem do backend como int (ex: 8).
        // Busca a opcao do banco cuja string contem esse numero para pre-selecionar o select.
        const intVal = valores[i];
        const strVal = intVal != null
            ? (TIPO_MEMORIA_RAM.find(o => ramStringParaInt(o.value) === intVal)?.value || String(intVal))
            : '';
        group.appendChild(criarSelect(`ram_slot_${i}`, TIPO_MEMORIA_RAM, strVal));
        div.appendChild(group);
    }

    inserirApos(afterGroup, div);
}

/**
 * Gera os campos de tipo e tamanho para cada disco.
 * Cada disco tem um select de tipo (HDD/SSD…) e um input numérico de tamanho.
 *
 * @param {HTMLElement} afterGroup — referência de posição no DOM
 * @param {number} quantidade      — número de discos
 * @param {Array<{tipo,tamanho}>} valores — valores pré-preenchidos
 */
function renderDiscos(afterGroup, quantidade, valores = []) {
    const antigo = document.getElementById('discos-wrapper');
    if (antigo) antigo.remove();
    if (!quantidade || quantidade < 1) return;

    const div = document.createElement('div');
    div.id        = 'discos-wrapper';
    div.className = 'span-2';
    div.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    for (let i = 0; i < quantidade; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

        const g1 = document.createElement('div'); g1.className = 'form-group';
        const l1 = document.createElement('label'); l1.textContent = `Disco ${i+1} — Tipo`;
        g1.appendChild(l1);
        g1.appendChild(criarSelect(`disco_tipo_${i}`, TIPO_DISCO, valores[i]?.tipo || ''));

        const g2 = document.createElement('div'); g2.className = 'form-group';
        const l2 = document.createElement('label'); l2.textContent = `Disco ${i+1} — Tamanho (GB)`;
        g2.appendChild(l2);
        g2.appendChild(criarInput(`disco_tamanho_${i}`, valores[i]?.tamanho || '', 'Ex: 512', 'number'));

        row.appendChild(g1); row.appendChild(g2);
        div.appendChild(row);
    }

    inserirApos(afterGroup, div);
}

/**
 * Gera os campos de tipo e VRAM para cada placa de vídeo.
 *
 * @param {HTMLElement} afterGroup — referência de posição no DOM
 * @param {number} quantidade      — número de GPUs
 * @param {Array<{tipo,vram}>} valores — valores pré-preenchidos
 */
function renderPlacasVideo(afterGroup, quantidade, valores = []) {
    const antigo = document.getElementById('gpus-wrapper');
    if (antigo) antigo.remove();
    if (!quantidade || quantidade < 1) return;

    const div = document.createElement('div');
    div.id        = 'gpus-wrapper';
    div.className = 'span-2';
    div.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    for (let i = 0; i < quantidade; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

        const g1 = document.createElement('div'); g1.className = 'form-group';
        const l1 = document.createElement('label'); l1.textContent = `GPU ${i+1} — Tipo`;
        g1.appendChild(l1);
        g1.appendChild(criarSelect(`gpu_tipo_${i}`, TIPO_GPU, valores[i]?.tipo || ''));

        const g2 = document.createElement('div'); g2.className = 'form-group';
        const l2 = document.createElement('label'); l2.textContent = `GPU ${i+1} — VRAM (MB)`;
        g2.appendChild(l2);
        g2.appendChild(criarInput(`gpu_vram_${i}`, valores[i]?.vram || '', 'Ex: 2048', 'number'));

        row.appendChild(g1); row.appendChild(g2);
        div.appendChild(row);
    }

    inserirApos(afterGroup, div);
}

/**
 * Gera um select de conector de vídeo para cada slot.
 *
 * @param {HTMLElement} afterGroup  — referência de posição no DOM
 * @param {number} quantidade       — número de conectores
 * @param {string[]} selecionados   — valores pré-selecionados
 */
function renderConectoresVideo(afterGroup, quantidade, selecionados = []) {
    const antigo = document.getElementById('conectores-wrapper');
    if (antigo) antigo.remove();
    if (!quantidade || quantidade < 1) return;

    const div = document.createElement('div');
    div.id        = 'conectores-wrapper';
    div.className = 'span-2';
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    for (let i = 0; i < quantidade; i++) {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lbl       = document.createElement('label');
        lbl.textContent = `Conector ${i + 1}`;
        group.appendChild(lbl);
        group.appendChild(criarSelect(`conector_video_${i}`, CONECTOR_VIDEO, selecionados[i] || ''));
        div.appendChild(group);
    }

    inserirApos(afterGroup, div);
}

/**
 * Quando o select de Office muda para "Nenhum", força a ativação para
 * "NaoPossui" e desabilita o select de ativação. Se o usuário escolher
 * qualquer outro office, reabilita as opções normais.
 *
 * @param {HTMLElement} scope — elemento ancestral que contém ambos os selects
 */
function sincronizarAtivacaoOffice(scope) {
    // Busca os selects dentro do scope (modal add ou edit)
    const officeSelect   = scope.querySelector('select[name="office"]');
    const ativacaoSelect = scope.querySelector('select[name="ativacao_office"]');
    if (!officeSelect || !ativacaoSelect) return;

    if (officeSelect.value === 'Nenhum') {
        ativacaoSelect.value    = 'NaoPossui';
        ativacaoSelect.disabled = true;
        ativacaoSelect.style.opacity = '0.5';
        ativacaoSelect.title  = 'Office selecionado como "Nenhum" — ativação não aplicável';
    } else {
        ativacaoSelect.disabled = false;
        ativacaoSelect.style.opacity = '';
        ativacaoSelect.title  = '';
        // Se ainda estiver em NaoPossui e o office mudou, reset para Desativado
        if (ativacaoSelect.value === 'NaoPossui') {
            ativacaoSelect.value = 'Desativado';
        }
    }
}

// ============================================================
//  RENDER DOS CAMPOS DO FORMULÁRIO (renderFields)
//  Percorre o array formFields[category] e cria os elementos
//  HTML correspondentes dentro do container do modal.
//  Esta é a função principal de montagem dos modais.
// ============================================================

/**
 * Gera todos os campos do formulário dentro de um container de modal.
 *
 * @param {string} containerId  — ID do container onde os campos serão inseridos
 * @param {string} category     — categoria ativa (ex: 'computadores')
 * @param {string} mode         — modo de visualização ('suporte'|'gestao'|'all')
 * @param {Object} prefillData  — valores para pré-preencher (usado no modal de edição)
 */

// ============================================================
//  HELPER GLOBAL — linha de busca de chip (usado por
//  chip_selector e whatsapp_list dentro de renderFields)
// ============================================================
function criarLinhaChip(listaIds, idx, chipsDisponiveis, prefixName, onRemove, onSelect) {
    const celularAtualId = document.getElementById('modalEdit')?.dataset?.editId || null;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;';

    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'position:relative;flex:1;';

    const searchInp = document.createElement('input');
    searchInp.type  = 'text';
    searchInp.autocomplete = 'off';
    searchInp.placeholder  = 'Buscar chip (número, dono...)';
    searchInp.style.cssText = 'width:100%;box-sizing:border-box;padding:7px 30px 7px 10px;border:1px solid var(--border-color);border-radius:7px;font-size:13px;background:var(--background-color);color:var(--text-primary);outline:none;';

    const hiddenInp = document.createElement('input');
    hiddenInp.type  = 'hidden';
    hiddenInp.name  = `${prefixName}_${idx}`;

    const clearBtn = document.createElement('span');
    clearBtn.textContent  = '×';
    clearBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;color:var(--text-muted);display:none;line-height:1;';

    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position:absolute;top:calc(100% + 2px);left:0;right:0;max-height:180px;overflow-y:auto;border:1px solid var(--border-color);border-radius:7px;background:var(--background-color);z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.12);display:none;';

    const selecionarChip = (chip) => {
        hiddenInp.value = chip.id;
        searchInp.value = `${chip.numero}${chip.dono ? ' (' + chip.dono + ')' : ''}`;
        clearBtn.style.display = 'block';
        dropdown.style.display = 'none';
        onSelect(idx, chip.id);
    };

    const filtrar = (termo) => {
        dropdown.innerHTML = '';
        const t = termo.toLowerCase();
        const ocupados = chipsDisponiveis
            .filter(c => c.celularId && c.celularId !== celularAtualId && !listaIds.includes(c.id))
            .map(c => c.id);
        const disponiveis = chipsDisponiveis.filter(c => {
            if (ocupados.includes(c.id)) return false;
            if (listaIds.some((id, j) => j !== idx && id === c.id)) return false;
            return !t || (c.numero||'').toLowerCase().includes(t) || (c.dono||'').toLowerCase().includes(t);
        });

        if (!disponiveis.length) {
            const el = document.createElement('div');
            el.textContent = 'Nenhum chip disponível.';
            el.style.cssText = 'padding:10px;font-size:13px;color:var(--text-muted);text-align:center;';
            dropdown.appendChild(el);
        } else {
            disponiveis.forEach(c => {
                const opt = document.createElement('div');
                opt.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border-color);';
                opt.innerHTML = `<strong>${c.numero}</strong>${c.dono ? ' <span style="color:var(--text-muted);font-size:11px;">(' + c.dono + ')</span>' : ''}`;
                opt.addEventListener('mousedown', e => { e.preventDefault(); selecionarChip(c); });
                opt.addEventListener('mouseover', () => opt.style.background = 'var(--hover-color,#f1f5f9)');
                opt.addEventListener('mouseout',  () => opt.style.background = '');
                dropdown.appendChild(opt);
            });
        }
        dropdown.style.display = 'block';
    };

    clearBtn.onclick = () => {
        searchInp.value = '';
        hiddenInp.value = '';
        clearBtn.style.display = 'none';
        onSelect(idx, '');
        filtrar('');
    };

    searchInp.addEventListener('input',  () => filtrar(searchInp.value));
    searchInp.addEventListener('focus',  () => filtrar(searchInp.value));
    searchInp.addEventListener('blur',   () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));

    // Preenche valor inicial
    const chipInicial = chipsDisponiveis.find(c => c.id === listaIds[idx]);
    if (chipInicial) selecionarChip(chipInicial);

    const btnRem = document.createElement('button');
    btnRem.type  = 'button';
    btnRem.textContent = '✕';
    btnRem.style.cssText = 'border:none;background:#fee2e2;color:#ef4444;border-radius:6px;padding:6px 10px;cursor:pointer;flex-shrink:0;';
    btnRem.onclick = () => onRemove(idx);

    searchWrap.appendChild(searchInp);
    searchWrap.appendChild(clearBtn);
    searchWrap.appendChild(dropdown);
    wrap.appendChild(searchWrap);
    wrap.appendChild(hiddenInp);
    wrap.appendChild(btnRem);
    return wrap;
}

function renderFields(containerId, category, mode, prefillData = {}) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const fields = formFields[category] || [];

    fields.forEach(f => {
        // ── Seção (título separador dentro do formulário) ──────────────
        if (f.section) {
            const el       = document.createElement('div');
            el.className   = 'form-section-title';
            el.textContent = f.section;
            container.appendChild(el);
            return;
        }

        // Nota: o modo não filtra campos no modal — exibe tudo.
        // O modo só afeta quais colunas aparecem na TABELA.

        // ── Container do campo ─────────────────────────────────────────
        const group       = document.createElement('div');
        group.className   = 'form-group' + (f.span2 ? ' span-2' : '');

        // ── Label do campo ─────────────────────────────────────────────
        const label       = document.createElement('label');
        label.textContent = f.label;
        if (f.required) {
            const star       = document.createElement('span');
            star.textContent = ' *';
            star.style.cssText = 'color:#ef4444;font-weight:700;';
            label.appendChild(star);
        }
        group.appendChild(label);

        // ── Elemento de input de acordo com o tipo ─────────────────────
        let input;

        if (f.type === 'select') {
            // Select comum com opções do enum de domínio
            input = criarSelect(f.key, f.options || [], prefillData[f.key] || '');

            // Alguns selects disparam geração dinâmica de campos ao mudar valor
            if (f.key === 'quant_slots')     input.addEventListener('change', () => renderSlotsRAM(group, parseInt(input.value) || 0));
            if (f.key === 'quant_discos')    input.addEventListener('change', () => renderDiscos(group, parseInt(input.value) || 0));
            if (f.key === 'quant_gpus')      input.addEventListener('change', () => renderPlacasVideo(group, parseInt(input.value) || 0));
            if (f.key === 'quant_conectores')input.addEventListener('change', () => renderConectoresVideo(group, parseInt(input.value) || 0));

            // Office Nenhum → força "Não Possui" na ativação e desabilita o select
            if (f.key === 'office') {
                input.addEventListener('change', () => sincronizarAtivacaoOffice(input.closest('form, .modal-body, .form-grid') || document));
            }

        } else if (f.type === 'processador_select') {
            // Select populado via API de processadores — conteúdo varia com o banco de dados
            input = document.createElement('select');
            input.name = f.key;
            const loading       = document.createElement('option');
            loading.textContent = 'Carregando...';
            input.appendChild(loading);

            getProcessadores().then(lista => {
                input.innerHTML = '';
                const blank       = document.createElement('option');
                blank.value       = '';
                blank.textContent = '— Selecione o processador —';
                input.appendChild(blank);
                (lista || []).forEach(p => {
                    const o       = document.createElement('option');
                    o.value       = p.id;
                    o.textContent = `${p.nome} ${p.velocidade}GHz (${p.nucleosThreads?.nucleos}c/${p.nucleosThreads?.threads}t)`;
                    if (prefillData[f.key] === p.id) o.selected = true;
                    input.appendChild(o);
                });
            }).catch(() => {
                input.innerHTML = '<option value="">Erro ao carregar processadores</option>';
            });

        } else if (f.type === 'textarea') {
            input       = document.createElement('textarea');
            input.name  = f.key;
            input.value = prefillData[f.key] || '';

        } else if (f.type === 'checkbox') {
            input         = document.createElement('input');
            input.type    = 'checkbox';
            input.name    = f.key;
            input.checked = prefillData[f.key] === true || prefillData[f.key] === 'true';
            input.style.width = 'auto';

        } else if (f.type === 'chip_selector') {
            // Widget de seleção de chips — dropdown com busca, múltiplas entradas
            input              = document.createElement('div');
            input.id           = 'chip-selector-widget';
            input.dataset.max  = f.max || 2;
            input.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

            const chipsSelecionados = prefillData[f.key] || [];

            const renderChipSelector = (listaIds, chipsDisponiveis) => {
                input.innerHTML = '';
                listaIds.forEach((_, i) => {
                    const linha = criarLinhaChip(
                        listaIds, i, chipsDisponiveis, 'chip_id',
                        (idx) => { listaIds.splice(idx, 1); renderChipSelector(listaIds, chipsDisponiveis); },
                        (idx, id) => { listaIds[idx] = id; }
                    );
                    input.appendChild(linha);
                });

                if (listaIds.length < parseInt(input.dataset.max)) {
                    const btnAdd = document.createElement('button');
                    btnAdd.type  = 'button';
                    btnAdd.textContent = '+ Adicionar Chip';
                    btnAdd.style.cssText = 'border:1px dashed #cbd5e1;background:transparent;border-radius:7px;padding:6px 12px;cursor:pointer;font-size:13px;color:var(--text-muted);';
                    btnAdd.onclick = () => { listaIds.push(''); renderChipSelector(listaIds, chipsDisponiveis); };
                    input.appendChild(btnAdd);
                }
            };

            getChips().then(lista => {
                window._chipsCache = lista || [];
                renderChipSelector([...chipsSelecionados], lista || []);
            }).catch(() => {
                window._chipsCache = [];
                renderChipSelector([...chipsSelecionados], []);
            });

        } else if (f.type === 'celular_selector') {
            // Widget de seleção de celular vinculado ao chip — dropdown com busca
            input              = document.createElement('div');
            input.id           = 'celular-selector-widget';
            input.style.cssText = 'display:flex;flex-direction:column;gap:6px;position:relative;';

            const valorInicial = prefillData[f.key] || '';

            // Renderiza o widget: campo de busca + lista filtrada
            const renderCelularSelector = (lista) => {
                input.innerHTML = '';

                // Campo de busca
                const searchWrap = document.createElement('div');
                searchWrap.style.cssText = 'position:relative;';

                const searchInp       = document.createElement('input');
                searchInp.type        = 'text';
                searchInp.name        = 'celularId_search';
                searchInp.placeholder = 'Buscar celular (modelo, código...)';
                searchInp.autocomplete = 'off';
                searchInp.style.cssText = 'width:100%;box-sizing:border-box;padding:7px 30px 7px 10px;border:1px solid var(--border-color);border-radius:7px;font-size:13px;background:var(--background-color);color:var(--text-primary);outline:none;';

                // Ícone de limpar (×)
                const clearBtn        = document.createElement('span');
                clearBtn.textContent  = '×';
                clearBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;color:var(--text-muted);display:none;';
                clearBtn.onclick      = () => {
                    searchInp.value = '';
                    hiddenInp.value = '';
                    clearBtn.style.display = 'none';
                    filtrarLista('');
                    dropdown.style.display = 'block';
                };

                // Input hidden que carrega o ID real
                const hiddenInp       = document.createElement('input');
                hiddenInp.type        = 'hidden';
                hiddenInp.name        = 'celularId';

                // Dropdown de resultados
                const dropdown        = document.createElement('div');
                dropdown.style.cssText = 'position:absolute;top:calc(100% + 2px);left:0;right:0;max-height:200px;overflow-y:auto;border:1px solid var(--border-color);border-radius:7px;background:var(--background-color);z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.12);';
                dropdown.style.display = 'none';

                const selecionarCelular = (cel) => {
                    hiddenInp.value     = cel.id;
                    searchInp.value     = `${cel.codigo || ''} — ${cel.modelo || ''}`.trim().replace(/^—\s*/, '');
                    clearBtn.style.display = 'block';
                    dropdown.style.display = 'none';
                };

                const filtrarLista = (termo) => {
                    dropdown.innerHTML = '';
                    const t = termo.toLowerCase();
                    const filtrados = lista.filter(c =>
                        !t ||
                        (c.modelo  || '').toLowerCase().includes(t) ||
                        (c.codigo  || '').toLowerCase().includes(t) ||
                        (c.usuario || '').toLowerCase().includes(t)
                    );

                    if (filtrados.length === 0) {
                        const vazio       = document.createElement('div');
                        vazio.textContent = 'Nenhum celular encontrado.';
                        vazio.style.cssText = 'padding:10px;font-size:13px;color:var(--text-muted);text-align:center;';
                        dropdown.appendChild(vazio);
                    } else {
                        filtrados.forEach(cel => {
                            const opt         = document.createElement('div');
                            opt.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border-color);';
                            opt.innerHTML     = `<strong>${cel.codigo || '—'}</strong> · ${cel.modelo || '—'} <span style="color:var(--text-muted);font-size:11px;">${cel.usuario || ''}</span>`;
                            opt.addEventListener('mousedown', (e) => {
                                e.preventDefault(); // evita blur antes do click
                                selecionarCelular(cel);
                            });
                            opt.addEventListener('mouseover', () => opt.style.background = 'var(--hover-color, #f1f5f9)');
                            opt.addEventListener('mouseout',  () => opt.style.background = '');
                            dropdown.appendChild(opt);
                        });
                    }
                    dropdown.style.display = 'block';
                };

                searchInp.addEventListener('input',  () => filtrarLista(searchInp.value));
                searchInp.addEventListener('focus',  () => filtrarLista(searchInp.value));
                searchInp.addEventListener('blur',   () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));

                // Preenche valor inicial (ao editar)
                if (valorInicial) {
                    const cel = lista.find(c => c.id === valorInicial);
                    if (cel) selecionarCelular(cel);
                    else { hiddenInp.value = valorInicial; searchInp.value = valorInicial; }
                }

                searchWrap.appendChild(searchInp);
                searchWrap.appendChild(clearBtn);
                searchWrap.appendChild(dropdown);
                input.appendChild(searchWrap);
                input.appendChild(hiddenInp);
            };

            // Carrega celulares e renderiza
            getCelulares().then(lista => {
                window._celularesCache = lista || [];
                renderCelularSelector(lista || []);
            }).catch(() => renderCelularSelector([]));

        } else if (f.type === 'whatsapp_list') {
            // Seletor de chips como contas WhatsApp — dropdown com busca, múltiplas entradas
            input              = document.createElement('div');
            input.id           = 'whatsapp-list-widget';
            input.dataset.max  = f.max || 6;
            input.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

            const wppInicial = Array.isArray(prefillData[f.key])
                ? prefillData[f.key].map(v => (typeof v === 'string' ? v : (v.id || '')))
                : [];

            const renderWppSelector = (listaIds, chipsDisponiveis) => {
                input.innerHTML = '';
                listaIds.forEach((_, i) => {
                    const linha = criarLinhaChip(
                        listaIds, i, chipsDisponiveis, 'wpp_chip_id',
                        (idx) => { listaIds.splice(idx, 1); renderWppSelector(listaIds, chipsDisponiveis); },
                        (idx, id) => { listaIds[idx] = id; }
                    );
                    input.appendChild(linha);
                });

                if (listaIds.length < parseInt(input.dataset.max)) {
                    const btnAdd = document.createElement('button');
                    btnAdd.type  = 'button';
                    btnAdd.textContent = '+ Adicionar Conta WhatsApp';
                    btnAdd.style.cssText = 'border:1px dashed #cbd5e1;background:transparent;border-radius:7px;padding:6px 12px;cursor:pointer;font-size:13px;color:var(--text-muted);';
                    btnAdd.onclick = () => { listaIds.push(''); renderWppSelector(listaIds, chipsDisponiveis); };
                    input.appendChild(btnAdd);
                }
            };

            // Sempre recarrega do banco para refletir dados atualizados
            getChips().then(lista => {
                window._chipsCache = lista || [];
                renderWppSelector([...wppInicial], lista || []);
            }).catch(() => {
                window._chipsCache = [];
                renderWppSelector([...wppInicial], []);
            });

        } else {
            // Input de texto, número, data — com máscara opcional
            input = criarInput(f.key, prefillData[f.key] || '', f.placeholder || '', f.type || 'text', f.mask || null, f.maxlen || null);
        }

        group.appendChild(input);
        container.appendChild(group);
    });

    // Sincroniza o estado inicial do select de ativação de office
    // (necessário quando o formulário é aberto em modo edição com Office=Nenhum já preenchido)
    if (category === 'computadores') {
        const scope = document.getElementById(containerId) || document;
        sincronizarAtivacaoOffice(scope);
    }
}

// ============================================================
//  RENDER DAS LINHAS DA TABELA (renderRow)
//  Constrói o HTML de uma linha <tr> com base nos dados
//  retornados pela API e no modo de visualização ativo.
// ============================================================

/**
 * Cria e retorna um elemento <tr> preenchido com os dados do item.
 *
 * @param {string} categoria   — slug da categoria
 * @param {Object} item        — objeto retornado pela API
 * @param {string} modo        — 'suporte' | 'gestao'
 * @returns {HTMLTableRowElement}
 */
function renderRow(categoria, item, modo) {
    const tr = document.createElement('tr');
    if (!item.ativo) tr.classList.add('row-inactive');

    // Badge de ativo/inativo — visual definido pelo frontend, dados vêm do backend
    const ativoBadge = item.ativo
        ? '<span class="badge badge-success">Sim</span>'
        : '<span class="badge badge-gray">Não</span>';

    // Botões de ação da linha
    const acoes = `
        <div class="row-actions">
            <button class="btn-action edit" title="Editar" onclick="abrirEdicao(this)">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-action toggle-active ${!item.ativo ? 'is-inactive' : ''}"
                title="${item.ativo ? 'Tornar Inativo' : 'Reativar'}"
                onclick="openToggleConfirm(this.closest('tr'))">
                <i class="fa-solid fa-${item.ativo ? 'power-off' : 'rotate-left'}"></i>
            </button>
        </div>`;

    // Formatação de data e preço
    const data  = item.dataAquisicao
        ? new Date(item.dataAquisicao).toLocaleDateString('pt-BR')
        : '—';
    const preco = item.precoAquisicao != null
        ? `R$ ${Number(item.precoAquisicao).toFixed(2).replace('.', ',')}`
        : '—';

    /**
     * Monta o botão de info genérico (apenas observações) para o modo gestão.
     * Usado por todas as categorias exceto computadores (que tem infoDetail próprio).
     */
    const _obsDetail = {
        type:     'obs_only',
        icon:     'fa-note-sticky',
        title:    'Observações',
        subtitle: `${item.codigo || ''} · ${item.usuario || ''}`,
        data:     { observacoes: item.observacoes || '' },
    };
    const _btnInfoObs = `
        <button class="btn-action info"
            data-detail='${JSON.stringify(_obsDetail)}'
            title="Ver observações">
            <i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i>
        </button>`;
    const _acoesComObs = acoes.replace('</div>', `${_btnInfoObs}</div>`);

    let cells = '';

    // ── Computadores ──────────────────────────────────────────────────
    if (categoria === 'computadores') {
        const proc      = item.processador ? item.processador.nome : (item.processadorId || '—');
        const ram       = item.memoriaRAMTotal ? `${item.memoriaRAMTotal} GB` : '—';
        const ramTipo   = item.geracaoRAM || '';
        const ramVel    = item.velocidadeRAM ? `${item.velocidadeRAM} MHz` : '';

        // Armazenamento: soma de todos os discos
        const discoTotal = item.discos?.length
            ? item.discos.reduce((s, d) => s + (d.tamanho ?? 0), 0)
            : 0;
        const disco = discoTotal ? `${discoTotal} GB` : '—';

        // VRAM: apenas a placa com maior VRAM (não soma)
        const melhorGpu = item.placasVideo?.length
            ? item.placasVideo.reduce((best, p) => (p.vram  ?? 0) > (best.vram ?? 0) ? p : best, {})
            : null;
        const vramVal = melhorGpu?.vram ?? 0;
        const vram     = vramVal ? `${vramVal} MB` : '—';

        // Conectores de vídeo — lidos do array ConectoresVideo do backend
        const conectores = Array.isArray(item.conectoresVideo) && item.conectoresVideo.length
            ? item.conectoresVideo
            : [];

        const subtitle = `${item.codigo || ''} · ${item.usuario || ''}`;

        // ── Payloads de modal ──────────────────────────────────────────

        const cpuDetail = {
            type: 'cpu',
            icon: 'fa-microchip',
            title: 'Processador',
            subtitle,
            data: {
                nome:       item.processador?.nome || proc,
                velocidade: item.processador?.velocidade ? `${item.processador.velocidade} GHz` : '—',
                nucleos:    item.processador?.nucleosThreads
                    ? `${item.processador.nucleosThreads.nucleos} núcleos / ${item.processador.nucleosThreads.threads} threads`
                    : '—',
            }
        };

        const slotsArray = (item.memoriaRAM || []).map((v, i) => ({
            slot:  i + 1,
            valor: v ? `${String(v).replace('GB','').trim()} GB` : '0 GB',
        }));
        const ramDetail = {
            type: 'ram',
            icon: 'fa-memory',
            title: 'Memória RAM',
            subtitle,
            data: {
                total:      ram,
                tipo:       ramTipo || '—',
                velocidade: ramVel  || '—',
                slots:      item.quantidadeSlots ?? '—',
                por_slot:   slotsArray,
            }
        };

        const discoDetail = {
            type: 'disco',
            icon: 'fa-hard-drive',
            title: 'Armazenamento',
            subtitle,
            data: {
                total:  disco,
                discos: (item.discos || []).map((d, i) => ({
                    num:    i + 1,
                    tipo:    resolverTipoDisco(d.tipo),
                    tamanho: d.tamanho ? `${d.tamanho} GB` : '—',
                    modelo:  '—',
                }))
            }
        };

        const vramDetail = {
            type: 'vram',
            icon: 'fa-display',
            title: 'Placa de Vídeo',
            subtitle,
            data: (item.placasVideo || []).map((p, i) => ({
                num:    i + 1,
                nome:   resolverTipoGpu(p.tipo ),
                vram:   p.vram ? `${p.vram} MB` : '—',
                tipo:   resolverTipoGpu(p.tipo),
            }))
        };

        const soDetail = {
            type: 'so',
            icon: 'fa-laptop-code',
            title: 'Sistema Operacional',
            subtitle,
            data: {
                so:       item.sistemaOperacional || '—',
                ativacao: item.ativacaoSO        || '—',
            }
        };

        const officeDetail = {
            type: 'office',
            icon: 'fa-file-word',
            title: 'Microsoft Office',
            subtitle,
            data: {
                versao:   item.office      || '—',
                ativacao: item.ativacaoOffice || '—',
            }
        };

        // Modal "info geral" — agrega tudo
        const infoDetail = {
            type: 'info_pc',
            icon: 'fa-circle-info',
            title: 'Detalhes Completos',
            subtitle,
            data: {
                cpu:          cpuDetail.data,
                ram:          ramDetail.data,
                disco:        discoDetail.data,
                vram:         vramDetail.data,
                so:           soDetail.data,
                office:       officeDetail.data,
                conectores:   conectores,
                ip:           item.ip           || '—',
                observacoes:  item.observacoes  || '',
            }
        };

        // Botão de info geral nas ações
        const btnInfo = `
            <button class="btn-action info"
                data-detail='${JSON.stringify(infoDetail)}'
                title="Ver todos os detalhes">
                <i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i>
            </button>`;
        const acoesComInfo = acoes.replace('</div>', `${btnInfo}</div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.tipo   || '—'}</td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${proc}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(cpuDetail)}' title="Ver detalhes do processador">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${ram}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(ramDetail)}' title="Ver detalhes da RAM">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${disco}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(discoDetail)}' title="Ver detalhes do armazenamento">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${vram}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(vramDetail)}' title="Ver detalhes da GPU">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${item.sistemaOperacional || '—'}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(soDetail)}' title="Ver ativação do SO">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${item.office || '—'}</span>
                        <button class="expand-btn" data-detail='${JSON.stringify(officeDetail)}' title="Ver ativação do Office">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>
                    </div>
                </td>

                <td>${item.status || '—'}</td>
                <td>${item.setor  || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesComInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.tipo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.ativacaoSO || '—'}</td>
                <td>${item.ativacaoOffice || '—'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Monitores ─────────────────────────────────────────────────────
    else if (categoria === 'monitores') {
        const entradasLista = [
            item.hdmi        ? 'HDMI'        : null,
            item.displayPort ? 'DisplayPort' : null,
            item.vga         ? 'VGA'         : null,
            item.dvi         ? 'DVI'         : null,
        ].filter(Boolean);
        const qtdEntradas = entradasLista.length;

        const monitorDetail = {
            type:     'monitor_entradas',
            icon:     'fa-display',
            title:    'Entradas do Monitor',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data:     { entradas: entradasLista },
        };
        const btnInfoMonitor = `
            <button class="expand-btn"
                data-detail='${JSON.stringify(monitorDetail)}'
                title="Ver entradas">
                <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>`;

        const monitorInfoDetail = {
            type:     'info_monitor',
            icon:     'fa-display',
            title:    'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: {
                tamanho:     item.tamanho     || '—',
                resolucao:   item.resolucao   || '—',
                frequencia:  item.frequencia  || '—',
                entradas:    entradasLista,
                observacoes: item.observacoes || '',
            },
        };
        const btnInfoMonitorAcoes = `
            <button class="btn-action info"
                data-detail='${JSON.stringify(monitorInfoDetail)}'
                title="Ver todos os detalhes">
                <i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i>
            </button>`;
        const acoesMonitorInfo = acoes.replace('</div>', `${btnInfoMonitorAcoes}</div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.tamanho ? item.tamanho + '"' : '—'}</td>
                <td>${item.resolucao || '—'}</td>
                <td>${item.frequencia ? item.frequencia + 'Hz' : '—'}</td>
                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${qtdEntradas > 0 ? `${qtdEntradas} entrada${qtdEntradas > 1 ? 's' : ''}` : '—'}</span>
                        ${qtdEntradas > 0 ? btnInfoMonitor : ''}
                    </div>
                </td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesMonitorInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Mouses ────────────────────────────────────────────────────────
    else if (categoria === 'mouses') {
        const mouseInfo = {
            type: 'info_generico', icon: 'fa-computer-mouse', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: { campos: [
                { label: 'Modelo',        value: item.modelo        || '—' },
                { label: 'Tipo',          value: item.tipo          || '—' },
                { label: 'Conectividade', value: item.conectividade || '—' },
            ], observacoes: item.observacoes || '' },
        };
        const acoesMouseInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(mouseInfo)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.conectividade || '—'}</td>
                <td>${item.tipo || '—'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesMouseInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Teclados ──────────────────────────────────────────────────────
    else if (categoria === 'teclados') {
        const tecladoInfo = {
            type: 'info_generico', icon: 'fa-keyboard', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: { campos: [
                { label: 'Modelo',        value: item.modelo        || '—' },
                { label: 'Tipo',          value: item.tipo          || '—' },
                { label: 'Conectividade', value: item.conectividade || '—' },
                { label: 'Switch',        value: item.switch        || '—' },
                { label: 'Tamanho',       value: item.tamanho ? item.tamanho + '%' : '—' },
            ], observacoes: item.observacoes || '' },
        };
        const acoesTecladoInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(tecladoInfo)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.conectividade || '—'}</td>
                <td>${item.tipo || '—'}</td>
                <td>${item.switch || '—'}</td>
                <td>${item.tamanho ? item.tamanho + '%' : '—'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesTecladoInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Fones ─────────────────────────────────────────────────────────
    else if (categoria === 'fones') {
        const foneInfo = {
            type: 'info_generico', icon: 'fa-headphones', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: { campos: [
                { label: 'Modelo',        value: item.modelo                        || '—' },
                { label: 'Tipo',          value: item.tipo                          || '—' },
                { label: 'Conectividade', value: item.conectividade                 || '—' },
                { label: 'Microfone',     value: item.microfone ? 'Sim' : 'Não'           },
            ], observacoes: item.observacoes || '' },
        };
        const acoesFoneInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(foneInfo)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.tipo || '—'}</td>
                <td>${item.conectividade || '—'}</td>
                <td>${item.microfone ? 'Sim' : 'Não'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesFoneInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Celulares ─────────────────────────────────────────────────────
    else if (categoria === 'celulares') {
        // Resolve IDs de chips para objetos {numero, operadora, dono} usando o cache
        const resolverChip = (entry) => {
            if (typeof entry === 'object' && entry.numero) return entry;
            const chip = (window._chipsCache || []).find(c => c.id === entry);
            return chip ? chip : { id: entry, numero: entry, operadora: '—', dono: '—' };
        };

        const chipsLista = item.chips?.length
            ? item.chips
            : (item.chipIds || []).map(resolverChip);

        const chipsPreview = chipsLista.length ? chipsLista[0].numero : '—';
        const chipsCount = chipsLista.length;

        // WhatsApp: resolve IDs para número/dono usando o cache de chips
        const wppLista = item.contasWhatsapp || [];
        const resolverWpp = (entry) => {
            if (typeof entry === 'object' && entry.numero) return entry.numero;
            // é um ID — busca no cache
            const chip = (window._chipsCache || []).find(c => c.id === entry);
            return chip ? chip.numero : entry;
        };
        const wppPreview = wppLista.length ? resolverWpp(wppLista[0]) : '—';
        const wppCount = wppLista.length;

        // Payload do modal de chips
        const chipsDetail = {
            type: 'chips',
            icon: 'fa-sim-card',
            title: 'Chips / SIM Cards',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: chipsLista.map((c, i) => ({
                num:      i + 1,
                operadora: c.operadora || '—',
                numero:    c.numero || c,
                dono:      c.dono || '—',
                status:    c.status || 'ativo',
            }))
        };

        // Payload do modal de WhatsApp — resolve IDs para objeto {numero, dono}
        const wppDetail = {
            type: 'whatsapp',
            icon: 'fa-brands fa-whatsapp',
            title: 'Contas WhatsApp',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: wppLista.map(w => {
                if (typeof w === 'object' && w.numero) return { nome: w.dono || '—', numero: w.numero, status: w.status || 'ativo' };
                const chip = (window._chipsCache || []).find(c => c.id === w);
                return { nome: chip?.dono || '—', numero: chip?.numero || w, status: chip?.status || 'ativo' };
            })
        };

        const chipCounterHtml = chipsCount > 1
            ? `<span class="chip-counter">+${chipsCount}</span>` : '';
        const wppCounterHtml = wppCount > 1
            ? `<span class="chip-counter">+${wppCount}</span>` : '';

        const celularInfoDetail = {
            type: 'info_celular', icon: 'fa-mobile-screen', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: {
                chips:   chipsDetail.data,
                whatsapp: wppDetail.data,
                observacoes: item.observacoes || '',
            },
        };
        const acoesCelularInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(celularInfoDetail)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.armazenamento ? item.armazenamento + ' GB' : '—'}</td>
                <td>${item.memoriaRAM ? item.memoriaRAM + ' GB' : '—'}</td>
                <td>${item.conectividade || '—'}</td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${chipsPreview}</span>
                        ${chipCounterHtml}
                        ${chipsCount > 0 ? `<button class="expand-btn" data-detail='${JSON.stringify(chipsDetail)}' title="Ver chips">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>` : ''}
                    </div>
                </td>

                <td>
                    <div class="cell-preview">
                        <span class="cell-preview-value">${wppPreview}</span>
                        ${wppCounterHtml}
                        ${wppCount > 0 ? `<button class="expand-btn" data-detail='${JSON.stringify(wppDetail)}' title="Ver contas WhatsApp">
                            <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        </button>` : ''}
                    </div>
                </td>

                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesCelularInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Ramais ────────────────────────────────────────────────────────
    else if (categoria === 'ramais') {
        const ramalInfo = {
            type: 'info_ramal', icon: 'fa-phone', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.modelo || ''}`,
            data: {
                ip:          item.ip  || '—',
                mac:         item.mac || '—',
                observacoes: item.observacoes || '',
            },
        };
        const ramalInfoJson = encodeURIComponent(JSON.stringify(ramalInfo));
        const acoesRamalInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail-enc="${ramalInfoJson}" title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.cor || '—'}</td>
                <td>${item.tipo || '—'}</td>
                <td>${item.ip        || '—'}</td>
                <td>${item.linha     || '—'}</td>
                <td>${item.numero    || '—'}</td>
                <td>${item.configurado ? 'Sim' : 'Não'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesRamalInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.modelo || '—'}</td>
                <td>${item.linha   || '—'}</td>
                <td>${item.numero || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Chips / Números ───────────────────────────────────────────────
    else if (categoria === 'chips') {
        const chipInfo = {
            type: 'info_generico', icon: 'fa-sim-card', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.numero || ''}`,
            data: { campos: [
                { label: 'Número',   value: item.numero   || '—' },
                { label: 'Operadora',value: item.operadora|| '—' },
                { label: 'Plano',    value: item.plano    || '—' },
                { label: 'Dono',     value: item.dono     || '—' },
            ], observacoes: item.observacoes || '' },
        };
        const acoesChipInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(chipInfo)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.numero || '—'}</td>
                <td>${item.operadora || '—'}</td>
                <td>${item.dono || '—'}</td>
                <td>${(() => {
                    if (!item.celularId) return '—';
                    const cel = (window._celularesCache || []).find(c => c.id === item.celularId);
                    return cel ? (cel.codigo || cel.id) : item.celularId;
                })()}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesChipInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.numero || '—'}</td>
                <td>${item.operadora || '—'}</td>
                <td>${item.plano || '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    // ── Extras ────────────────────────────────────────────────────────
    else if (categoria === 'extras') {
        const extraInfo = {
            type: 'info_generico', icon: 'fa-ellipsis', title: 'Detalhes Completos',
            subtitle: `${item.codigo || ''} · ${item.categoria || ''}`,
            data: { campos: [
                { label: 'Categoria',  value: item.categoria  || '—' },
                { label: 'Descrição',  value: item.descricao  || '—' },
                { label: 'Quantidade', value: item.quantidade != null ? String(item.quantidade) : '—' },
            ], observacoes: item.observacoes || '' },
        };
        const acoesExtraInfo = acoes.replace('</div>', `<button class="btn-action info" data-detail='${JSON.stringify(extraInfo)}' title="Ver detalhes"><i class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">info</i></button></div>`);

        if (modo === 'suporte') {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.categoria || '—'}</td>
                <td>${item.descricao || '—'}</td>
                <td>${item.quantidade ?? '—'}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${acoesExtraInfo}</td>`;
        } else {
            cells = `
                <td>${item.codigo || '—'}</td>
                <td>${item.categoria || '—'}</td>
                <td>${item.quantidade ?? '—'}</td>
                <td>${data}</td>
                <td>${preco}</td>
                <td>${item.status || '—'}</td>
                <td>${item.setor || '—'}</td>
                <td>${item.usuario || '—'}</td>
                <td class="cell-ativo">${ativoBadge}</td>
                <td class="col-acoes">${_acoesComObs}</td>`;
        }
    }

    tr.innerHTML      = cells;
    tr.dataset.id     = item.id || '';
    // Serializa o item completo na linha para uso rápido no modal de edição
    tr.dataset.item   = JSON.stringify(item);
    return tr;
}

// ============================================================
//  CACHE DE DADOS E APLICAÇÃO DE FILTROS
//  Os dados são carregados da API uma vez e armazenados no cache.
//  Os filtros são aplicados sobre o cache sem nova requisição.
// ============================================================

/** Cache de dados por categoria — evita re-fetches desnecessários */
const cache = {};

/**
 * Normaliza um valor para comparação de filtro (lowercase, trim).
 * @param {*} v
 * @returns {string}
 */
function normalizarValor(v) {
    if (v === null || v === undefined) return '';
    return String(v).toLowerCase().trim();
}

/**
 * Extrai o valor correto de uma propriedade do item para comparar com um filtro.
 * Mapeia as chaves do filterDef para as propriedades reais do objeto da API.
 *
 * @param {Object} item — objeto do inventário
 * @param {string} key  — chave do filtro (ex: 'so', 'ativo')
 * @returns {*}
 */
function extrairValorFiltro(item, key) {
    // Mapa explícito para chaves que diferem do nome da propriedade na API,
    // ou que precisam de transformação (bool → Sim/Não, number → string).
    // Espelha todos os campos das classes C# do backend.
    const mapa = {
        // Equipamento (base)
        id:              item.id,
        codigo:          item.codigo,
        usuario:         item.usuario,
        dataAquisicao:   item.dataAquisicao ? new Date(item.dataAquisicao).toLocaleDateString('pt-BR') : '',
        precoAquisicao:  item.precoAquisicao != null ? String(item.precoAquisicao) : '',
        observacoes:     item.observacoes,
        ativo:           item.ativo === true ? 'Sim' : 'Não',
        setor:           item.setor,
        status:          item.status,
        // Computador
        modelo:          item.modelo,
        tipo:            item.tipo,
        ip:              item.ip,
        geracaoRAM:      item.geracaoRAM,
        velocidadeRAM:   item.velocidadeRAM != null ? String(item.velocidadeRAM) : '',
        so:              item.sistemaOperacional,
        ativacao_so:     item.ativacaoSO,
        office:          item.office,
        ativacao_office: item.ativacaoOffice,
        // Monitor
        tamanho:         item.tamanho != null ? String(item.tamanho) : '',
        resolucao:       item.resolucao,
        frequencia:      item.frequencia != null ? String(item.frequencia) : '',
        hdmi:            item.hdmi === true ? 'Sim' : (item.hdmi === false ? 'Não' : ''),
        displayPort:     item.displayPort === true ? 'Sim' : (item.displayPort === false ? 'Não' : ''),
        vga:             item.vga === true ? 'Sim' : (item.vga === false ? 'Não' : ''),
        dvi:             item.dvi === true ? 'Sim' : (item.dvi === false ? 'Não' : ''),
        // Mouse / Teclado / Fone
        conectividade:   item.conectividade,
        switch:          item.switch,
        microfone:       item.microfone === true ? 'Sim' : (item.microfone === false ? 'Não' : ''),
        // Celular
        ram:             item.memoriaRAM != null ? String(item.memoriaRAM) : '',
        armazenamento:   item.armazenamento != null ? String(item.armazenamento) : '',
        // Ramal
        cor:             item.cor,
        linha:           item.linha,
        numero:          item.numero,
        mac:             item.mac,
        configurado:     item.configurado === true ? 'Sim' : (item.configurado === false ? 'Não' : ''),
        // Chip
        operadora:       item.operadora,
        dono:            item.dono,
        plano:           item.plano != null ? String(item.plano) : '',
        celularId:       item.celularId,
        // Extra
        categoria:       item.categoria,
        descricao:       item.descricao,
        quantidade:      item.quantidade,
    };
    return mapa[key] !== undefined ? mapa[key] : item[key];
}

/**
 * Aplica os filtros ativos sobre o cache e re-renderiza o tbody.
 *
 * Lógica de filtragem:
 *  - AND entre filtros diferentes (todos devem ser satisfeitos)
 *  - OR entre values do mesmo filtro (qualquer valor satisfaz)
 *  - Busca parcial para campos sem enum, exata para enums
 *
 * Lógica de ordenação (multi-chave com prioridade de inserção):
 *  - O primeiro filtro adicionado com sort != 'none' tem prioridade máxima
 *  - O segundo filtro com sort tem prioridade secundária (desempate), etc.
 *  - Ex: filtro 1 = codigo ASC, filtro 2 = modelo ASC
 *        → ordena por codigo; se iguais, ordena por modelo
 */
function aplicarFiltrosNaTabela() {
    if (!cache[currentCategory]) return;

    const tableId = `${currentCategory}-${currentMode}`;
    const tbody   = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    let dados = cache[currentCategory];

    // ── Filtragem ──────────────────────────────────────────────
    if (activeFilters.length > 0) {
        dados = dados.filter(item =>
            activeFilters.every(f => {
                // Ignora filtros que são só ordenação (sem values selecionados)
                if (!f.values || f.values.length === 0) return true;

                const valorItem = normalizarValor(extrairValorFiltro(item, f.key));
                const vals      = f.values.map(v => normalizarValor(v));

                // Busca o def para saber se é enum (exato) ou texto livre (parcial)
                return vals.some(v => valorItem === normalizarValor(v) || valorItem.includes(normalizarValor(v)));
            })
        );
    }

    // ── Ordenação multi-chave por prioridade de inserção ──────
    // Coleta filtros com sort ativo na ordem em que foram adicionados (= prioridade)
    const filtrosComSort = activeFilters.filter(f => f.sort && f.sort !== 'none');
    if (filtrosComSort.length > 0) {
        dados.sort((a, b) => {
            for (const f of filtrosComSort) {
                const va = normalizarValor(extrairValorFiltro(a, f.key));
                const vb = normalizarValor(extrairValorFiltro(b, f.key));
                if (va < vb) return f.sort === 'asc' ? -1 : 1;
                if (va > vb) return f.sort === 'asc' ? 1  : -1;
                // Empate neste critério → passa pro próximo filtro
            }
            return 0;
        });
    }

    if (dados.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="20">Nenhum registro encontrado para os filtros aplicados.</td></tr>`;
        document.getElementById('tableInfo').textContent  = '0 registros';
        document.getElementById('footerInfo').textContent = '0 registros';
        return;
    }

    tbody.innerHTML = '';
    dados.forEach(item => tbody.appendChild(renderRow(currentCategory, item, currentMode)));
    document.getElementById('tableInfo').textContent  = `${dados.length} registro(s)`;
    document.getElementById('footerInfo').textContent = `${dados.length} registro(s)`;
}


// ============================================================
//  MAPA DE FUNÇÕES DA API
//  Centraliza todas as chamadas de fetch por categoria.
//  As funções (getComputadores, criarComputador, etc.) são
//  definidas em api.js e não fazem parte deste arquivo.
// ============================================================

/** Funções de leitura por categoria */
const apiFetch = {
    computadores: () => getComputadores(),
    monitores:    () => getMonitores(),
    mouses:       () => getMouses(),
    teclados:     () => getTeclados(),
    fones:        () => getFones(),
    celulares:    () => getCelulares(),
    ramais:       () => getRamais(),
    chips:        () => getChips(),
    extras:       () => getExtras(),
};

/** Funções de criação por categoria */
const apiCreate = {
    computadores: (d) => criarComputador(d),
    monitores:    (d) => criarMonitor(d),
    mouses:       (d) => criarMouse(d),
    teclados:     (d) => criarTeclado(d),
    fones:        (d) => criarFone(d),
    celulares:    (d) => criarCelular(d),
    ramais:       (d) => criarRamal(d),
    chips:        (d) => criarChip(d),
    extras:       (d) => criarExtra(d),
};

/** Funções de atualização por categoria */
const apiUpdate = {
    computadores: (id, d) => atualizarComputador(id, d),
    monitores:    (id, d) => atualizarMonitor(id, d),
    mouses:       (id, d) => atualizarMouse(id, d),
    teclados:     (id, d) => atualizarTeclado(id, d),
    fones:        (id, d) => atualizarFone(id, d),
    celulares:    (id, d) => atualizarCelular(id, d),
    ramais:       (id, d) => atualizarRamal(id, d),
    chips:        (id, d) => atualizarChip(id, d),
    extras:       (id, d) => atualizarExtra(id, d),
};


// ============================================================
//  CARREGAR TABELA (carregarTabela)
//  Busca os dados da API, armazena no cache e popula o tbody.
// ============================================================

/**
 * Busca os dados da API para a categoria e modo informados,
 * armazena no cache e renderiza as linhas da tabela.
 *
 * @param {string} categoria — slug da categoria
 * @param {string} modo      — 'suporte' | 'gestao'
 */
async function carregarTabela(categoria, modo) {
    const tableId = `${categoria}-${modo}`;
    const tbody   = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    // Estado de carregamento visual
    tbody.innerHTML = `<tr class="empty-row"><td colspan="20"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>`;

    try {
        const dados = await apiFetch[categoria]();
        cache[categoria] = dados;

        // Mantém caches globais para lookup cruzado no renderRow
        if (categoria === 'chips')     window._chipsCache     = dados || [];
        if (categoria === 'celulares') window._celularesCache = dados || [];

        // Garante cache cruzado: chips precisam dos celulares e vice-versa.
        // Após carregar, re-renderiza a tabela atual para refletir os lookups.
        if (categoria === 'chips' && !window._celularesCache) {
            getCelulares().then(lista => {
                window._celularesCache = lista || [];
                aplicarFiltrosNaTabela(); // re-renderiza com o cache disponível
            }).catch(() => { window._celularesCache = []; });
        }
        if (categoria === 'celulares' && !window._chipsCache) {
            getChips().then(lista => {
                window._chipsCache = lista || [];
                aplicarFiltrosNaTabela();
            }).catch(() => { window._chipsCache = []; });
        }

        if (!dados || dados.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="20">Nenhum registro encontrado.</td></tr>`;
            document.getElementById('tableInfo').textContent  = '0 registros';
            document.getElementById('footerInfo').textContent = '0 registros';
            return;
        }

        // Aplica filtros ativos sobre os dados recém-carregados
        aplicarFiltrosNaTabela();

    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="20"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao conectar com a API.</td></tr>`;
        console.error('Erro ao carregar tabela:', e);
    }
}

// ============================================================
//  MODAL DE EDIÇÃO — Abertura com dados reais
//  Pega os dados serializados na linha e popula o formulário.
// ============================================================

/**
 * Abre o modal de edição preenchido com os dados do item clicado.
 * Os dados são lidos de tr.dataset.item (serializado em renderRow).
 * @param {HTMLElement} btn — botão de edição clicado
 */
function abrirEdicao(btn) {
    const tr   = btn.closest('tr');
    const item = JSON.parse(tr.dataset.item || '{}');

    // Popula os campos do form com os dados do item
    renderFields('formEditFields', currentCategory, 'all', mapItemToForm(currentCategory, item));

    // Armazena o ID para uso no submitEdit
    document.getElementById('modalEdit').dataset.editId = tr.dataset.id;

    // Para computadores, pré-gera os campos dinâmicos (slots, discos, GPUs, conectores)
    if (currentCategory === 'computadores') {
        const slotsRAM  = item.memoriaRAM?.length    || 0;
        const qtdDiscos = item.discos?.length         || 0;
        const qtdGPUs   = item.placasVideo?.length    || 0;
        const qtdConn   = item.conectoresVideo?.length || 0;

        // Seta os selects de quantidade para refletir os dados existentes
        const setarSelect = (name, val) => {
            const sel = document.querySelector(`#formEditFields select[name="${name}"]`);
            if (sel) sel.value = String(val);
        };
        setarSelect('quant_slots',     slotsRAM);
        setarSelect('quant_discos',    qtdDiscos);
        setarSelect('quant_gpus',      qtdGPUs);
        setarSelect('quant_conectores',qtdConn);

        // Recupera os grupos de referência para inserir os campos dinâmicos
        const grupo = name => document.querySelector(`#formEditFields select[name="${name}"]`)?.closest('.form-group');

        if (grupo('quant_slots')     && slotsRAM  > 0) renderSlotsRAM(grupo('quant_slots'),      slotsRAM,  item.memoriaRAM     || []);
        if (grupo('quant_discos')    && qtdDiscos  > 0) renderDiscos(grupo('quant_discos'),        qtdDiscos, item.discos          || []);
        if (grupo('quant_gpus')      && qtdGPUs    > 0) renderPlacasVideo(grupo('quant_gpus'),     qtdGPUs,   item.placasVideo     || []);
        if (grupo('quant_conectores')&& qtdConn    > 0) renderConectoresVideo(grupo('quant_conectores'), qtdConn, item.conectoresVideo || []);
    }

    openModal('modalEdit');
}

// ============================================================
//  MAPEAMENTO ITEM DA API → CAMPOS DO FORM (mapItemToForm)
//  Traduz as propriedades do objeto retornado pela API
//  para as chaves usadas nos formFields de cada categoria.
// ============================================================

/**
 * Converte um item da API nos valores de prefill do formulário.
 * @param {string} categoria
 * @param {Object} item
 * @returns {Object}
 */
function mapItemToForm(categoria, item) {
    if (categoria === 'computadores') return {
        modelo: item.modelo, tipo: item.tipo, ip: item.ip,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        processadorId: item.processadorId,
        geracaoRAM: item.geracaoRAM,
        velocidadeRAM: item.velocidadeRAM,
        quant_slots:     item.memoriaRAM?.length    || 0,
        quant_discos:    item.discos?.length         || 0,
        quant_gpus:      item.placasVideo?.length    || 0,
        quant_conectores:item.conectoresVideo?.length || 0,
        so:              item.sistemaOperacional,
        ativacao_so:     item.ativacaoSO,
        office:          item.office,
        ativacao_office: item.ativacaoOffice,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'monitores') return {
        modelo: item.modelo, tamanho: item.tamanho, resolucao: item.resolucao,
        frequencia: item.frequencia,
        hdmi: item.hdmi, displayPort: item.displayPort, vga: item.vga, dvi: item.dvi,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'mouses') return {
        modelo: item.modelo, conectividade: item.conectividade, tipo: item.tipo,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'teclados') return {
        modelo: item.modelo, conectividade: item.conectividade, tipo: item.tipo,
        switch: item.switch, tamanho: item.tamanho,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'fones') return {
        modelo: item.modelo, tipo: item.tipo, microfone: item.microfone,
        conectividade: item.conectividade,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'celulares') return {
        modelo: item.modelo, armazenamento: item.armazenamento,
        ram: item.memoriaRAM, conectividade: item.conectividade,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
        chipIds:        item.chipIds        || [],
        contasWhatsapp: item.contasWhatsapp || [],
    };
    if (categoria === 'ramais') return {
        modelo: item.modelo, cor: item.cor, tipo: item.tipo,
        linha: item.linha, numero: item.numero,
        ip: item.ip, mac: item.mac,
        configurado: item.configurado,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'chips') return {
        numero: item.numero, operadora: item.operadora, dono: item.dono,
        celularId: item.celularId, plano: item.plano,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    if (categoria === 'extras') return {
        categoria: item.categoria, descricao: item.descricao,
        quantidade: item.quantidade ?? 0,
        setor: item.setor, usuario: item.usuario, status: item.status,
        observacoes: item.observacoes,
        data_aquisicao:  item.dataAquisicao?.split('T')[0],
        preco_aquisicao: item.precoAquisicao,
    };
    return item;
}


// ============================================================
//  MAPEAMENTO FORM → PAYLOAD DA API (mapFormToApi)
//  Converte os valores brutos do formulário para o formato
//  esperado pelo backend .NET (nomes de propriedades, tipos, etc.)
// ============================================================

/**
 * Helper: extrai o valor monetário do campo e converte para float.
 * @param {string} raw — valor do input (ex: "R$ 1.250,99" ou "1250.99")
 * @returns {number}
 */
function parsePreco(raw) {
    return parseFloat(String(raw || '0').replace('R$', '').replace(/\s/g, '').replace(',', '.').trim()) || 0;
}

/**
 * Helper: extrai campos dinâmicos indexados (ram_slot_0, ram_slot_1…).
 * @param {Object} form  — objeto com os valores do form
 * @param {string} prefix — prefixo do campo (ex: 'ram_slot_')
 * @returns {Array}
 */
function extrairIndexados(form, prefix) {
    const lista = [];
    let i = 0;
    while (form[`${prefix}${i}`] !== undefined) {
        lista.push(form[`${prefix}${i}`]);
        i++;
    }
    return lista;
}

/**
 * Converte os campos do formulário para o payload correto da API.
 * @param {string} categoria
 * @param {Object} form — valores coletados dos inputs
 * @returns {Object} — payload pronto para enviar à API
 */
function mapFormToApi(categoria, form) {
    if (categoria === 'computadores') {
        // Coleta slots de RAM — cada slot vem como string do select (ex: "8GB")
        // e é convertido para int (ex: 8) para o backend receber List<int>
        const memoriaRAM = extrairIndexados(form, 'ram_slot_')
            .filter(Boolean)
            .map(ramStringParaInt);

        // Coleta discos — envia { Tipo: "HDD", Tamanho: 512 } (DiscoInfo no backend)
        const discos = [];
        i = 0;
        while (form[`disco_tipo_${i}`] !== undefined) {
            discos.push({
                tipo:    form[`disco_tipo_${i}`]   || 'HDD',
                tamanho: parseInt(form[`disco_tamanho_${i}`]) || 0,
            });
            i++;
        }

        // Coleta GPUs — envia { Tipo: "Integrada", VRAM: 4096 } (PlacaVideoInfo no backend)
        const placasVideo = [];
        i = 0;
        while (form[`gpu_tipo_${i}`] !== undefined) {
            placasVideo.push({
                tipo: form[`gpu_tipo_${i}`] || 'Integrada',
                vram: parseInt(form[`gpu_vram_${i}`]) || 0,
            });
            i++;
        }

        // Coleta conectores de vídeo (apenas os preenchidos)
        const conectoresVideo = extrairIndexados(form, 'conector_video_').filter(Boolean);

        return {
            modelo:                  form.modelo,
            tipo:                    form.tipo,
            ip:                      form.ip             || null,
            processadorId:           form.processadorId  || null,
            geracaoRAM:              form.geracaoRAM     || undefined,
            velocidadeRAM:           parseInt(form.velocidadeRAM) || 0,
            quantidadeSlots:         Math.max(memoriaRAM.length,     parseInt(form.quant_slots)     || 0),
            memoriaRAM,
            quantidadeDiscos:        Math.max(discos.length,         parseInt(form.quant_discos)    || 0),
            discos,
            quantidadePlacasVideo:   Math.max(placasVideo.length,    parseInt(form.quant_gpus)      || 0),
            placasVideo,
            quantidadeConectoresVideo: Math.max(conectoresVideo.length, parseInt(form.quant_conectores) || 0),
            conectoresVideo,
            sistemaOperacional: form.so              || 'Windows11',
            ativacaoSO:         form.ativacao_so     || 'Desativado',
            office:             form.office          || 'Nenhum',
            ativacaoOffice:     form.ativacao_office || 'Desativado',
            setor:              form.setor,
            usuario:            form.usuario,
            status:             form.status,
            observacoes:        form.observacoes     || null,
            dataAquisicao:      form.data_aquisicao  || new Date().toISOString(),
            precoAquisicao:     parsePreco(form.preco_aquisicao),
        };
    }

    if (categoria === 'monitores') return {
        modelo: form.modelo, tamanho: parseFloat(form.tamanho) || 0,
        resolucao: form.resolucao || undefined, frequencia: parseInt(form.frequencia) || 0,
        hdmi:        form.hdmi        === true || form.hdmi        === 'true',
        displayPort: form.displayPort === true || form.displayPort === 'true',
        vga:         form.vga         === true || form.vga         === 'true',
        dvi:         form.dvi         === true || form.dvi         === 'true',
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'mouses') return {
        modelo: form.modelo, conectividade: form.conectividade || undefined, tipo: form.tipo || undefined,
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'teclados') return {
        modelo: form.modelo, conectividade: form.conectividade || undefined,
        tipo: form.tipo || undefined, switch: form.switch || undefined,
        tamanho: parseInt(form.tamanho) || 0,
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'fones') return {
        modelo: form.modelo, tipo: form.tipo || undefined,
        microfone:    form.microfone    === true || form.microfone    === 'true',
        conectividade: form.conectividade || undefined,
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'celulares') return {
        modelo: form.modelo, armazenamento: parseInt(form.armazenamento) || 0,
        memoriaRAM: parseInt(form.ram) || 0, conectividade: form.conectividade || undefined,
        setor: form.setor, usuario: form.usuario, status: form.status,
        ativo: true,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
        chipIds:        form.chipIds        || [],
        contasWhatsapp: form.contasWhatsapp || [],
    };

    if (categoria === 'ramais') return {
        modelo: form.modelo, cor: form.cor || null, tipo: form.tipo || null,
        linha: form.linha || null, numero: form.numero || null,
        ip: form.ip || null, mac: form.mac || null,
        configurado: form.configurado === true || form.configurado === 'true',
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'chips') return {
        // Formata o número de telefone removendo não-dígitos e adicionando o +
        numero:    form.numero || '',
        operadora: form.operadora || '',
        dono:      form.dono      || null,
        celularId: form.celularId || null,
        plano:     parsePreco(form.plano),
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes: form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    if (categoria === 'extras') return {
        categoria:      form.categoria,
        descricao:      form.descricao  || null,
        quantidade:     parseInt(form.quantidade) || 0,
        setor: form.setor, usuario: form.usuario, status: form.status,
        observacoes:    form.observacoes || null,
        dataAquisicao:  form.data_aquisicao || new Date().toISOString(),
        precoAquisicao: parsePreco(form.preco_aquisicao),
    };

    return form;
}

// ============================================================
//  COLETA DE CAMPOS DE CELULAR (chip_selector + whatsapp_list)
//  Esses widgets não usam inputs com [name] padrão, então
//  precisam de coleta manual.
// ============================================================

/**
 * Coleta os IDs dos chips selecionados e as contas WhatsApp
 * do formulário de celular (inputs indexados gerados pelos widgets).
 *
 * @param {string} containerId — ID do container do formulário
 * @returns {{chipIds: string[], contasWhatsapp: string[]}}
 */
function coletarDadosCelular(containerId) {
    // Chips: hidden inputs chip_id_0, chip_id_1… (gerados pelo widget chip_selector)
    const chipIds = [];
    let i = 0;
    while (true) {
        const hid = document.querySelector(`#${containerId} input[name="chip_id_${i}"]`);
        if (!hid) break;
        if (hid.value) chipIds.push(hid.value);
        i++;
    }

    // WhatsApp: hidden inputs wpp_chip_id_0… — envia IDs de chips
    const contasWhatsapp = [];
    i = 0;
    while (true) {
        const hid = document.querySelector(`#${containerId} input[name="wpp_chip_id_${i}"]`);
        if (!hid) break;
        if (hid.value) contasWhatsapp.push(hid.value);
        i++;
    }

    return { chipIds, contasWhatsapp };
}

// ============================================================
//  FORMATAR ERRO DA API
//  Converte o status HTTP e corpo da resposta em mensagens
//  legíveis para exibição no modal.
// ============================================================

/**
 * Formata o erro retornado pela API em título e detalhe legíveis.
 * @param {number|null} status — código HTTP
 * @param {Object|null} corpo  — corpo da resposta de erro
 * @returns {{titulo: string, detalhe: string|null}}
 */
function formatarErroApi(status, corpo) {
    if (status === 400) {
        let msg = 'Os dados enviados são inválidos.';
        if (corpo?.errors) {
            const detalhes = Object.entries(corpo.errors)
                .map(([campo, erros]) => `${campo}: ${erros.join(', ')}`)
                .join(' | ');
            return { titulo: msg, detalhe: detalhes };
        }
        if (corpo?.title) return { titulo: msg, detalhe: corpo.title };
        return { titulo: msg, detalhe: JSON.stringify(corpo) };
    }
    if (status === 404) return { titulo: 'Registro não encontrado. Ele pode ter sido removido.', detalhe: null };
    if (status === 409) return { titulo: 'Conflito: já existe um registro com esses dados.', detalhe: null };
    if (status === 500) return {
        titulo: 'Erro interno no servidor. Tente novamente ou reporte ao administrador.',
        detalhe: `Status: 500 — ${corpo?.title || 'Internal Server Error'}`,
    };
    if (status === 0 || status == null) return {
        titulo: 'Não foi possível conectar com o servidor. Verifique se a API está rodando.',
        detalhe: 'Sem resposta da API (ERR_CONNECTION_REFUSED)',
    };
    return { titulo: `Erro inesperado ao salvar (código ${status}).`, detalhe: JSON.stringify(corpo) };
}

// ============================================================
//  SUBMIT DE ADIÇÃO (submitAdd)
//  Valida campos, monta payload e envia para a API de criação.
// ============================================================

/**
 * Coleta os dados do modal de adição, valida e envia para a API.
 * Em caso de sucesso: fecha o modal e recarrega a tabela.
 * Em caso de erro: exibe a mensagem no modal.
 */
async function submitAdd() {
    limparErroModal('modalAddError');

    // Valida campos obrigatórios via frontend
    const faltando = validarObrigatorios('formAddFields');
    if (faltando.length > 0) {
        mostrarErroModal(
            'modalAddError',
            'Preencha os campos obrigatórios antes de salvar:',
            faltando.map(l => `• ${l}`).join('\n')
        );
        return;
    }

    // Coleta todos os valores do formulário
    const fields = document.querySelectorAll('#formAddFields [name]');
    const form   = {};
    fields.forEach(f => {
        form[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    });

    // Para celulares, coleta os widgets especiais
    if (currentCategory === 'celulares') {
        const { chipIds, contasWhatsapp } = coletarDadosCelular('formAddFields');
        form['chipIds']        = chipIds;
        form['contasWhatsapp'] = contasWhatsapp;
    }
    // Para chips, o celularId vem do hidden input do celular_selector
    if (currentCategory === 'chips') {
        const hid = document.querySelector('#formAddFields input[name="celularId"]');
        if (hid) form['celularId'] = hid.value || null;
    }

    try {
        const payload   = mapFormToApi(currentCategory, form);
        const resultado = await apiCreate[currentCategory](payload);

        if (resultado) {
            closeModal('modalAdd');
            await carregarTabela(currentCategory, currentMode);
        } else {
            mostrarErroModal(
                'modalAddError',
                'Não foi possível salvar. Verifique os dados e tente novamente.',
                'A API retornou uma resposta vazia ou nula.'
            );
        }
    } catch (e) {
        const { titulo, detalhe } = formatarErroApi(e.status, e.corpo);
        mostrarErroModal('modalAddError', titulo, detalhe);
    }
}

// ============================================================
//  SUBMIT DE EDIÇÃO (submitEdit)
//  Coleta o ID da linha, monta payload e envia para a API de update.
// ============================================================

/**
 * Coleta os dados do modal de edição, valida e envia para a API.
 * Em caso de sucesso: fecha o modal e recarrega a tabela.
 * Em caso de erro: exibe a mensagem no modal.
 */
async function submitEdit() {
    limparErroModal('modalEditError');

    const faltando = validarObrigatorios('formEditFields');
    if (faltando.length > 0) {
        mostrarErroModal(
            'modalEditError',
            'Preencha os campos obrigatórios antes de salvar:',
            faltando.map(l => `• ${l}`).join('\n')
        );
        return;
    }

    // ID do item armazenado no modal ao abrir a edição
    const id     = document.getElementById('modalEdit').dataset.editId;
    const fields = document.querySelectorAll('#formEditFields [name]');
    const form   = {};
    fields.forEach(f => {
        form[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    });

    if (currentCategory === 'celulares') {
        const { chipIds, contasWhatsapp } = coletarDadosCelular('formEditFields');
        form['chipIds']        = chipIds;
        form['contasWhatsapp'] = contasWhatsapp;
    }
    if (currentCategory === 'chips') {
        const hid = document.querySelector('#formEditFields input[name="celularId"]');
        if (hid) form['celularId'] = hid.value || null;
    }

    try {
        const payload   = mapFormToApi(currentCategory, form);
        const resultado = await apiUpdate[currentCategory](id, payload);

        if (resultado !== null) {
            closeModal('modalEdit');
            await carregarTabela(currentCategory, currentMode);
        } else {
            mostrarErroModal(
                'modalEditError',
                'Não foi possível salvar as alterações.',
                'A API retornou uma resposta vazia ou nula.'
            );
        }
    } catch (e) {
        const { titulo, detalhe } = formatarErroApi(e.status, e.corpo);
        mostrarErroModal('modalEditError', titulo, detalhe);
    }
}

// ============================================================
//  TOGGLE ATIVO VIA API (confirmToggleActive)
//  Após confirmação no modal, chama a API e atualiza o visual.
// ============================================================

/**
 * Executa o toggle ativo/inativo via API e atualiza a linha visualmente.
 * Chamado pelo botão de confirmação no modal de confirmação.
 */
async function confirmToggleActive() {
    if (!pendingToggleRow) return;

    const id   = pendingToggleRow.dataset.id;
    const item = JSON.parse(pendingToggleRow.dataset.item || '{}');

    // Inverte o estado de ativo
    const novoEstado = !item.ativo;
    item.ativo       = novoEstado;

    try {
        await apiUpdate[currentCategory](id, item);

        // Atualiza o visual da linha via frontend
        aplicarToggleVisual(pendingToggleRow, !novoEstado === false ? !item.ativo : !novoEstado);

        // Recarrega a tabela para garantir consistência com o banco
        await carregarTabela(currentCategory, currentMode);

    } catch (e) {
        console.error('Erro ao alterar status:', e);
        closeModal('modalConfirm');
        pendingToggleRow = null;
    }
}

// ============================================================
//  BARRA DE FILTROS — Lógica de domínio
//
//  Estrutura de um filtro em activeFilters:
//  { key, label, values: ['v1',...], displays: ['L1',...], sort: 'none'|'asc'|'desc' }
//
//  Regras:
//   - O dropdown NÃO fecha ao marcar checkbox ou ao clicar nos botões de sort
//   - O dropdown fecha apenas ao clicar fora ou ao clicar no trigger novamente
//   - Botão "Selecionar todos" marca/desmarca todas as opções visíveis
//   - Trocar suporte ↔ gestao preserva activeFilters (filterDefs é o mesmo objeto)
// ============================================================

var _filterDropdownAberto = null;

/**
 * Popula o select de propriedade de filtro.
 * Usa filterDefs[currentCategory][currentMode] para obter os filtros disponíveis.
 * NÃO limpa activeFilters — trocar modo/categoria é responsabilidade do HTML.
 */
function buildFilterPropSelect() {
    const sel  = document.getElementById('filterProp');
    const defs = (filterDefs[currentCategory] || {})[currentMode] || [];

    sel.innerHTML = '<option value="">— Escolha a propriedade —</option>';
    defs.forEach(def => {
        const opt       = document.createElement('option');
        opt.value       = def.key;
        opt.textContent = def.label;
        sel.appendChild(opt);
    });

    // Reseta apenas a área de valor, sem fechar nem limpar filtros ativos
    const valueArea = document.getElementById('filterValueArea');
    if (valueArea) valueArea.innerHTML = '';
    fecharFilterDropdown();
}

/**
 * Chamado ao mudar a propriedade selecionada.
 * Reconstrói o dropdown customizado para a propriedade escolhida.
 */
function updateFilterValueOptions() {
    fecharFilterDropdown();

    const key  = document.getElementById('filterProp').value;
    const defs = (filterDefs[currentCategory] || {})[currentMode] || [];
    const def  = defs.find(d => d.key === key);

    const area = document.getElementById('filterValueArea');
    if (!area) return;
    area.innerHTML = '';
    if (!def) return;

    // ── Container relativo para posicionar o painel ────────────
    const wrap = document.createElement('div');
    wrap.id    = 'filterDropdownWrap';
    wrap.style.cssText = 'position:relative;display:inline-block;';

    // ── Trigger (botão que abre o painel) ──────────────────────
    const trigger = document.createElement('button');
    trigger.type      = 'button';
    trigger.id        = 'filterDropdownTrigger';
    trigger.className = 'filter-value-select';
    trigger.style.cssText = 'min-width:220px;text-align:left;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;';
    trigger.innerHTML = '<span id="filterDropdownLabel" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">— Selecione valores —</span><i class="fa-solid fa-chevron-down" style="font-size:11px;color:var(--text-muted);flex-shrink:0;"></i>';

    // ── Painel do dropdown ─────────────────────────────────────
    const panel = document.createElement('div');
    panel.id    = 'filterDropdownPanel';
    panel.style.cssText = [
        'display:none',
        'position:absolute',
        'top:calc(100% + 4px)',
        'left:0',
        'min-width:270px',
        'max-width:360px',
        'background:var(--secondary-color)',
        'border:1px solid var(--border-color)',
        'border-radius:10px',
        'box-shadow:0 8px 24px rgba(0,0,0,0.14)',
        'z-index:9999',
        'overflow:hidden',
    ].join(';');

    // Impede que cliques DENTRO do painel fechem o dropdown
    panel.addEventListener('click', e => e.stopPropagation());

    panel.dataset.selecionados = '';
    panel.dataset.sort         = 'none';

    // ── Seção de ordenação ─────────────────────────────────────
    const sortRow = document.createElement('div');
    sortRow.style.cssText = 'display:flex;gap:4px;padding:10px 10px 8px;border-bottom:1px solid var(--border-color);';

    const mkSortBtn = (label, icon, direction) => {
        const b = document.createElement('button');
        b.type            = 'button';
        b.dataset.sort    = direction;
        b.style.cssText   = 'flex:1;padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--background-color);color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:0.15s;';
        b.innerHTML       = `<i class="fa-solid ${icon}"></i> ${label}`;
        // NÃO propaga o clique para fora → dropdown não fecha
        b.addEventListener('click', e => {
            e.stopPropagation();
            panel.querySelectorAll('[data-sort]').forEach(x => {
                x.style.background  = 'var(--background-color)';
                x.style.color       = 'var(--text-muted)';
                x.style.borderColor = 'var(--border-color)';
            });
            b.style.background  = 'var(--quinary-color)';
            b.style.color       = '#fff';
            b.style.borderColor = 'var(--quinary-color)';
            panel.dataset.sort  = direction;
        });
        return b;
    };
    const btnSemOrdem = mkSortBtn('Sem ordem', 'fa-minus', 'none');
    sortRow.appendChild(mkSortBtn('A → Z', 'fa-arrow-up-a-z', 'asc'));
    sortRow.appendChild(mkSortBtn('Z → A', 'fa-arrow-down-z-a', 'desc'));
    sortRow.appendChild(btnSemOrdem);
    // Destaca "Sem ordem" como padrão
    btnSemOrdem.style.background  = 'var(--quinary-color)';
    btnSemOrdem.style.color       = '#fff';
    btnSemOrdem.style.borderColor = 'var(--quinary-color)';
    panel.appendChild(sortRow);

    // ── Busca ──────────────────────────────────────────────────
    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'padding:8px 10px;border-bottom:1px solid var(--border-color);display:flex;gap:6px;align-items:center;';

    const searchInput = document.createElement('input');
    searchInput.type        = 'text';
    searchInput.placeholder = def.values ? 'Pesquisar...' : 'Pesquisar ou digitar valor...';
    searchInput.style.cssText = 'flex:1;padding:6px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:13px;background:var(--background-color);color:var(--text-primary);outline:none;';

    // Botão selecionar todos
    const btnTodos = document.createElement('button');
    btnTodos.type      = 'button';
    btnTodos.title     = 'Selecionar / desmarcar todos';
    btnTodos.style.cssText = 'padding:5px 9px;border:1px solid var(--border-color);border-radius:6px;background:var(--background-color);color:var(--text-muted);font-size:12px;cursor:pointer;flex-shrink:0;transition:0.15s;white-space:nowrap;';
    btnTodos.innerHTML = '<i class="fa-solid fa-check-double"></i>';
    btnTodos.title     = 'Selecionar todos visíveis';
    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(btnTodos);
    panel.appendChild(searchWrap);

    // ── Lista de opções ────────────────────────────────────────
    const listWrap = document.createElement('div');
    listWrap.style.cssText = 'max-height:220px;overflow-y:auto;padding:6px 0;';

    // Monta as opções base
    let opcoes = [];
    if (def.values && def.values.length) {
        opcoes = def.values.map(v =>
            typeof v === 'object' ? { value: String(v.value), label: v.label } : { value: String(v), label: String(v) }
        );
    } else {
        // Texto livre: valores únicos já presentes no cache
        const dados  = cache[currentCategory] || [];
        const unicos = [...new Set(
            dados.map(item => extrairValorFiltro(item, key))
                 .filter(v => v !== null && v !== undefined && v !== '')
                 .map(v => String(v))
        )].sort();
        opcoes = unicos.map(v => ({ value: v, label: v }));
    }

    /**
     * Renderiza as opções no listWrap, aplicando o filtro de busca.
     * Mantém o estado de marcação via panel.dataset.selecionados.
     */
    const renderOpcoes = (filtro = '') => {
        listWrap.innerHTML = '';

        const filtradas = filtro
            ? opcoes.filter(o => o.label.toLowerCase().includes(filtro.toLowerCase()))
            : opcoes;

        const selecionadosAtual = (panel.dataset.selecionados || '').split('|||').filter(Boolean);

        if (filtradas.length === 0 && !filtro && !def.values) {
            const vazio       = document.createElement('div');
            vazio.style.cssText = 'padding:10px 14px;font-size:12px;color:var(--text-muted);font-style:italic;';
            vazio.textContent = 'Nenhum valor encontrado no inventário';
            listWrap.appendChild(vazio);
        }

        filtradas.forEach(op => {
            const row = document.createElement('label');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
            row.addEventListener('mouseenter', () => row.style.background = 'var(--background-color)');
            row.addEventListener('mouseleave', () => row.style.background = '');

            const cb           = document.createElement('input');
            cb.type            = 'checkbox';
            cb.value           = op.value;
            cb.dataset.label   = op.label;
            cb.style.cssText   = 'accent-color:var(--quinary-color);width:14px;height:14px;cursor:pointer;flex-shrink:0;';
            cb.checked         = selecionadosAtual.includes(op.value);

            // Clique no checkbox NÃO propaga → painel não fecha
            cb.addEventListener('click', e => e.stopPropagation());
            cb.addEventListener('change', () => {
                const checks = [...listWrap.querySelectorAll('input[type=checkbox]:checked')];
                panel.dataset.selecionados = checks.map(c => c.value).join('|||');
                atualizarLabelTrigger(trigger, checks);
            });

            const span       = document.createElement('span');
            span.textContent = op.label;

            row.appendChild(cb);
            row.appendChild(span);
            listWrap.appendChild(row);
        });

        // Campo de texto livre: opção de adicionar valor digitado
        if (!def.values && filtro) {
            const addRow       = document.createElement('div');
            addRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;font-size:13px;color:var(--quinary-color);border-top:1px solid var(--border-color);';
            addRow.innerHTML   = `<i class="fa-solid fa-plus" style="font-size:11px;"></i> Adicionar "<strong>${filtro}</strong>"`;
            addRow.addEventListener('click', e => {
                e.stopPropagation();
                if (!opcoes.find(o => o.value === filtro)) {
                    opcoes.push({ value: filtro, label: filtro });
                }
                const atual = (panel.dataset.selecionados || '').split('|||').filter(Boolean);
                if (!atual.includes(filtro)) {
                    atual.push(filtro);
                    panel.dataset.selecionados = atual.join('|||');
                }
                searchInput.value = '';
                renderOpcoes('');
                const checks = [...listWrap.querySelectorAll('input[type=checkbox]:checked')];
                atualizarLabelTrigger(trigger, checks);
            });
            listWrap.appendChild(addRow);
        }
    };

    panel.appendChild(listWrap);
    renderOpcoes();

    // ── Botão selecionar todos ─────────────────────────────────
    btnTodos.addEventListener('click', e => {
        e.stopPropagation();
        const checks    = [...listWrap.querySelectorAll('input[type=checkbox]')];
        const todosMarcados = checks.every(c => c.checked);
        // Se todos já marcados → desmarca; caso contrário → marca todos
        checks.forEach(c => { c.checked = !todosMarcados; });
        const marcados  = checks.filter(c => c.checked);
        panel.dataset.selecionados = marcados.map(c => c.value).join('|||');
        atualizarLabelTrigger(trigger, marcados);
    });

    // ── Busca em tempo real ────────────────────────────────────
    searchInput.addEventListener('input', () => renderOpcoes(searchInput.value));

    // ── Toggle do painel ───────────────────────────────────────
    trigger.addEventListener('click', e => {
        e.stopPropagation();
        if (panel.style.display === 'none') {
            fecharFilterDropdown();
            panel.style.display = 'block';
            _filterDropdownAberto = panel;
            searchInput.focus();
        } else {
            fecharFilterDropdown();
        }
    });

    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    area.appendChild(wrap);

    // Fecha ao clicar fora (apenas fora do wrap)
    // Usa capture para capturar antes do stopPropagation interno
    document.addEventListener('click', _onDocClickCloseFilter);
}

/** Handler global de click para fechar o dropdown ao clicar fora */
function _onDocClickCloseFilter(e) {
    const wrap = document.getElementById('filterDropdownWrap');
    if (wrap && wrap.contains(e.target)) return; // clique dentro → não fecha
    fecharFilterDropdown();
}

/**
 * Fecha o dropdown de filtro aberto, se houver.
 */
function fecharFilterDropdown() {
    if (_filterDropdownAberto) {
        _filterDropdownAberto.style.display = 'none';
        _filterDropdownAberto = null;
    }
}

/**
 * Atualiza o label do botão trigger com os valores selecionados.
 */
function atualizarLabelTrigger(trigger, checks) {
    const lbl = trigger.querySelector('#filterDropdownLabel');
    if (!lbl) return;
    if (!checks || checks.length === 0) {
        lbl.textContent = '— Selecione valores —';
    } else if (checks.length === 1) {
        lbl.textContent = checks[0].dataset?.label || checks[0].value || String(checks[0]);
    } else {
        lbl.textContent = `${checks.length} valores selecionados`;
    }
}

/**
 * Lê o dropdown e adiciona/atualiza um filtro em activeFilters.
 * Chamada pelo onclick="addFilter()" no HTML.
 *
 * Se já existe um filtro para essa propriedade, mescla os novos valores
 * e atualiza o sort se um novo foi escolhido.
 */
function addFilterBackend() {
    const propSel = document.getElementById('filterProp');
    const key     = propSel.value;
    if (!key) { propSel.focus(); return; }

    const defs = (filterDefs[currentCategory] || {})[currentMode] || [];
    const def  = defs.find(d => d.key === key);
    if (!def)  return;

    const panel = document.getElementById('filterDropdownPanel');
    if (!panel) return;

    const sort   = panel.dataset.sort || 'none';
    const checks = [...panel.querySelectorAll('input[type=checkbox]:checked')];

    // Permite adicionar filtro de ordenação mesmo sem valores selecionados
    if (checks.length === 0 && sort === 'none') {
        document.getElementById('filterDropdownTrigger')?.focus();
        return;
    }

    const values   = checks.map(c => c.value);
    const displays = checks.map(c => c.dataset.label || c.value);

    const existente = activeFilters.find(f => f.key === key);
    if (existente) {
        // Mescla valores novos
        values.forEach((v, i) => {
            if (!existente.values.includes(v)) {
                existente.values.push(v);
                existente.displays.push(displays[i]);
            }
        });
        // Atualiza sort apenas se um novo foi explicitamente escolhido
        if (sort !== 'none') existente.sort = sort;
    } else {
        activeFilters.push({ key, label: def.label, values, displays, sort });
    }

    renderChips();

    // Limpa os controles de propriedade e valor
    propSel.value = '';
    const area    = document.getElementById('filterValueArea');
    if (area) area.innerHTML = '';
    fecharFilterDropdown();
    // Remove o listener global para não acumular
    document.removeEventListener('click', _onDocClickCloseFilter);
}


// ============================================================
//  CARGA INICIAL
//  Ao carregar a página, mostra a tabela de computadores
//  em modo gestão (padrão) e carrega os dados da API.
// ============================================================



// ============================================================
//  EXPORTAÇÃO DE DADOS — CSV e XLSX
//  Usa os dados já filtrados exibidos na tabela atual.
// ============================================================

/**
 * Retorna os dados atualmente exibidos na tabela (pós-filtro).
 * Reutiliza a mesma lógica de aplicarFiltrosNaTabela, sem re-renderizar.
 */
function obterDadosExportacao() {
    if (!cache[currentCategory]) return [];

    let dados = cache[currentCategory];

    if (activeFilters.length > 0) {
        dados = dados.filter(item =>
            activeFilters.every(f => {
                if (!f.values || f.values.length === 0) return true;
                const valorItem = normalizarValor(extrairValorFiltro(item, f.key));
                const vals      = f.values.map(v => normalizarValor(v));
                return vals.some(v => valorItem === normalizarValor(v) || valorItem.includes(normalizarValor(v)));
            })
        );
    }

    return dados;
}

/**
 * Retorna cabeçalhos (label) e chaves (key) para a categoria/modo atual,
 * acrescentando sempre o ID no início.
 */
function obterColunas() {
    const fields = (formFields[currentCategory] || []).filter(f => {
        if (!f.key) return false;                          // seções e separadores
        if (f.mode && f.mode !== currentMode) return false; // fora do modo atual
        return true;
    });

    // ID sempre primeiro
    const colunas = [{ label: 'ID', key: 'id' }];

    fields.forEach(f => {
        // Pula chaves de controle que não são valores diretos
        const skipKeys = ['quant_slots', 'quant_discos', 'quant_gpus', 'quant_conectores'];
        if (skipKeys.includes(f.key)) return;
        colunas.push({ label: f.label, key: f.key });
    });

    return colunas;
}

/**
 * Extrai o valor de uma célula de forma legível (flat),
 * lidando com objetos aninhados, arrays e valores nulos.
 */
function extrairValorCelula(item, key) {
    let val = item[key];

    if (val === null || val === undefined) return '';

    // Objetos com propriedade "nome" (ex: processador, setor)
    if (typeof val === 'object' && !Array.isArray(val)) {
        if (val.nome) return val.nome;
        if (val.name) return val.name;
        return JSON.stringify(val);
    }

    // Arrays (ex: discos, placas, chips)
    if (Array.isArray(val)) {
        return val.map(v => {
            if (typeof v === 'object') return v.nome || v.name || v.numero || JSON.stringify(v);
            return v;
        }).join(' | ');
    }

    return String(val);
}

/**
 * Constrói as linhas de dados para exportação.
 * @returns {{ headers: string[], rows: string[][] }}
 */
function construirMatrizExport() {
    const colunas = obterColunas();
    const dados   = obterDadosExportacao();

    const headers = colunas.map(c => c.label);
    const rows    = dados.map(item =>
        colunas.map(c => extrairValorCelula(item, c.key))
    );

    return { headers, rows };
}

/**
 * Gera um nome de arquivo com a categoria, modo e data atual.
 */
function gerarNomeArquivo(extensao) {
    const cat  = (categoryNames && categoryNames[currentCategory]) || currentCategory;
    const modo = currentMode === 'gestao' ? 'Gestao' : 'Suporte';
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    return `${cat}_${modo}_${hoje}.${extensao}`;
}

// ─── Exportação CSV ──────────────────────────────────────────

function exportarCSV() {
    const { headers, rows } = construirMatrizExport();

    const escapar = v => {
        const s = String(v).replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };

    const linhas = [
        headers.map(escapar).join(','),
        ...rows.map(r => r.map(escapar).join(','))
    ];

    const blob = new Blob(['\uFEFF' + linhas.join('\r\n')], {
        type: 'text/csv;charset=utf-8;'
    });

    _downloadBlob(blob, gerarNomeArquivo('csv'));
}

// ─── Exportação XLSX ─────────────────────────────────────────

async function exportarXLSX() {
    const { headers, rows } = construirMatrizExport();

    // Carrega SheetJS dinamicamente se ainda não estiver disponível
    if (typeof XLSX === 'undefined') {
        await _carregarScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    const wsData = [headers, ...rows];
    const wb     = XLSX.utils.book_new();
    const ws     = XLSX.utils.aoa_to_sheet(wsData);

    // Largura automática das colunas
    const colWidths = headers.map((h, i) => ({
        wch: Math.max(
            h.length,
            ...rows.map(r => String(r[i] || '').length)
        ) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, gerarNomeArquivo('xlsx'));
}

// ─── Helpers ─────────────────────────────────────────────────

function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function _carregarScript(src) {
    return new Promise((resolve, reject) => {
        const s   = document.createElement('script');
        s.src     = src;
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ─── Ponto de entrada (chamado pelo modal) ───────────────────

async function exportarDados(formato) {
    const dados = obterDadosExportacao();

    if (!dados || dados.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    try {
        if (formato === 'csv') {
            exportarCSV();
        } else if (formato === 'xlsx') {
            await exportarXLSX();
        }
        // Fecha o modal após exportar
        if (typeof closeModal === 'function') closeModal('modalExport');
    } catch (err) {
        console.error('Erro ao exportar:', err);
        alert('Ocorreu um erro ao gerar o arquivo. Verifique o console para mais detalhes.');
    }
}


document.querySelectorAll('.inv-table').forEach(t => t.classList.remove('ativa'));
const tabelaInicial = document.getElementById('computadores-gestao');
if (tabelaInicial) tabelaInicial.classList.add('ativa');

// Carrega as opções dinâmicas da API e depois inicializa a tabela
carregarOpcoesDinamicas().then(() => {
    carregarTabela('computadores', 'gestao');
    buildFilterPropSelect();
});

