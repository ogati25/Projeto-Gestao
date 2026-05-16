// =============================================================================
// configuracoes.js — Backend da tela de configurações
//
// Responsabilidade: comunicação com a API e lógica de dados.
//
// O que está aqui:
//   - EXPORT_CATEGORIAS — mapa de todos os endpoints exportáveis
//   - exportarDadosSistema(formato) — busca dados da API e gera CSV ou XLSX
//   - confirmarImport() — lê o arquivo selecionado e envia registros à API
//   - _sanitizarRegistro() — remove _id antes de POST para que o MongoDB
//     gere um novo ObjectId (igual à criação normal pela UI)
//   - _coercirTipos(reg, categoria) — converte campos string do CSV/XLSX
//     para os tipos corretos que o backend .NET espera (bool, int, float, decimal)
//   - _parseCSV() — parser interno de CSV compatível com o formato de export
//   - Helpers privados: _flattenValue, _matriceDeObjetos, _downloadBlob,
//     _carregarScript
//
// O que NÃO está aqui (fica no <script> inline do HTML):
//   - Tema (dark/light), sidebar, avatar
//   - salvarConfiguracoes / carregarConfiguracoes (localStorage apenas)
//   - limparPreferencias (localStorage apenas)
//   - openModal / closeModal / fecharModalImport (manipulação de UI)
//   - Drag & drop e seleção de arquivo (event listeners de UI)
//   - processarArquivoSelecionado (feedback visual de seleção de arquivo)
//
// Dependências:
//   - api.js (request) — deve ser carregado antes no HTML
//   - Funções de UI definidas no <script> inline do HTML:
//       closeModal(), fecharModalImport()
// =============================================================================


// =============================================================================
// SEÇÃO 1 — MAPA DE CATEGORIAS EXPORTÁVEIS
// Espelha todos os endpoints GET que retornam listas do backend.
// =============================================================================

// =============================================================================
// SEÇÃO 1 — MAPA DE CATEGORIAS E CAMPOS EXPORTÁVEIS
//
// EXPORT_CAMPOS define:
//  - key      : endpoint da API
//  - label    : nome exibido na UI
//  - icon     : ícone Font Awesome
//  - selected : se a tabela está marcada para exportação (mutável pela UI)
//  - campos   : lista de { key, label, selected } com todos os campos do modelo
//               "key" deve bater com a chave camelCase retornada pela API
// =============================================================================

const _CAMPOS_BASE = [
    { key: 'id',            label: 'ID',               selected: false },
    { key: 'codigo',        label: 'Código',            selected: true  },
    { key: 'usuario',       label: 'Usuário',           selected: true  },
    { key: 'dataAquisicao', label: 'Data de Aquisição', selected: true  },
    { key: 'precoAquisicao',label: 'Preço de Aquisição',selected: true  },
    { key: 'ativo',         label: 'Ativo',             selected: true  },
    { key: 'setor',         label: 'Setor',             selected: true  },
    { key: 'status',        label: 'Status',            selected: true  },
    { key: 'observacoes',   label: 'Observações',       selected: false },
];

// Helper: clona _CAMPOS_BASE para que cada categoria tenha sua própria instância
function _camposBase() {
    return _CAMPOS_BASE.map(f => ({ ...f }));
}

const EXPORT_CAMPOS = [
    {
        key: 'computadores', label: 'Computadores', icon: 'fa-solid fa-computer', selected: true,
        fn: () => request('computadores'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',                   label: 'Modelo',                   selected: true  },
            { key: 'tipo',                     label: 'Tipo',                     selected: true  },
            { key: 'processadorId',            label: 'Processador',              selected: false },
            { key: 'geracaoRAM',               label: 'Geração RAM',              selected: true  },
            { key: 'quantidadeSlots',          label: 'Qtd. Slots',               selected: true  },
            { key: 'memoriaRAM',               label: 'Memória RAM (slots)',      selected: true  },
            { key: 'memoriaRAMTotal',          label: 'Memória RAM Total (GB)',   selected: true  },
            { key: 'velocidadeRAM',            label: 'Velocidade RAM (MHz)',     selected: true  },
            { key: 'quantidadeDiscos',         label: 'Qtd. Discos',              selected: true  },
            { key: 'discos',                   label: 'Discos (tipo/tamanho)',    selected: true  },
            { key: 'quantidadePlacasVideo',    label: 'Qtd. Placas de Vídeo',    selected: false },
            { key: 'placasVideo',              label: 'Placas de Vídeo',         selected: false },
            { key: 'quantidadeConectoresVideo',label: 'Qtd. Conectores Vídeo',   selected: false },
            { key: 'conectoresVideo',          label: 'Conectores de Vídeo',     selected: false },
            { key: 'sistemaOperacional',       label: 'Sistema Operacional',     selected: true  },
            { key: 'ativacaoSO',               label: 'Ativação SO',             selected: true  },
            { key: 'office',                   label: 'Office',                  selected: true  },
            { key: 'ativacaoOffice',           label: 'Ativação Office',         selected: true  },
            { key: 'ip',                       label: 'IP',                      selected: true  },
        ],
    },
    {
        key: 'celulares', label: 'Celulares', icon: 'fa-solid fa-mobile-screen-button', selected: true,
        fn: () => request('celulares'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',        label: 'Modelo',            selected: true  },
            { key: 'memoriaRAM',    label: 'Memória RAM (GB)',  selected: true  },
            { key: 'armazenamento', label: 'Armazenamento (GB)',selected: true  },
            { key: 'conectividade', label: 'Carregador',        selected: true  },
            { key: 'operadora',     label: 'Operadora',         selected: true  },
            { key: 'chipIds',       label: 'Chips',             selected: false },
            { key: 'contasWhatsapp',label: 'WhatsApp',          selected: false },
        ],
    },
    {
        key: 'monitores', label: 'Monitores', icon: 'fa-solid fa-desktop', selected: true,
        fn: () => request('monitores'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',       label: 'Modelo',       selected: true  },
            { key: 'tamanho',      label: 'Tamanho (pol)',selected: true  },
            { key: 'resolucao',    label: 'Resolução',    selected: true  },
            { key: 'frequencia',   label: 'Frequência',   selected: true  },
            { key: 'hdmi',         label: 'HDMI',         selected: true  },
            { key: 'displayPort',  label: 'DisplayPort',  selected: true  },
            { key: 'vga',          label: 'VGA',          selected: false },
            { key: 'dvi',          label: 'DVI',          selected: false },
        ],
    },
    {
        key: 'mouses', label: 'Mouses', icon: 'fa-solid fa-computer-mouse', selected: true,
        fn: () => request('mouses'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',       label: 'Modelo',       selected: true },
            { key: 'tipo',         label: 'Tipo',         selected: true },
            { key: 'conectividade',label: 'Conectividade',selected: true },
        ],
    },
    {
        key: 'teclados', label: 'Teclados', icon: 'fa-solid fa-keyboard', selected: true,
        fn: () => request('teclados'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',       label: 'Modelo',       selected: true  },
            { key: 'tipo',         label: 'Tipo',         selected: true  },
            { key: 'conectividade',label: 'Conectividade',selected: true  },
            { key: 'tamanho',      label: 'Tamanho (%)',  selected: true  },
            { key: 'switch',       label: 'Switch',       selected: false },
        ],
    },
    {
        key: 'fones', label: 'Fones', icon: 'fa-solid fa-headphones', selected: true,
        fn: () => request('fones'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',       label: 'Modelo',       selected: true },
            { key: 'tipo',         label: 'Tipo',         selected: true },
            { key: 'microfone',    label: 'Microfone',    selected: true },
            { key: 'conectividade',label: 'Conectividade',selected: true },
        ],
    },
    {
        key: 'ramais', label: 'Ramais', icon: 'fa-solid fa-phone', selected: true,
        fn: () => request('ramais'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',     label: 'Modelo',      selected: true  },
            { key: 'cor',        label: 'Cor',         selected: true  },
            { key: 'tipo',       label: 'Tipo',        selected: true  },
            { key: 'configurado',label: 'Configurado', selected: true  },
            { key: 'linha',      label: 'Linha',       selected: true  },
            { key: 'numero',     label: 'Número',      selected: true  },
            { key: 'ip',         label: 'IP',          selected: true  },
            { key: 'mac',        label: 'MAC',         selected: false },
        ],
    },
    {
        key: 'chips', label: 'Chips', icon: 'fa-solid fa-sim-card', selected: true,
        fn: () => request('chips'),
        campos: [
            ..._camposBase(),
            { key: 'operadora', label: 'Operadora', selected: true  },
            { key: 'numero',    label: 'Número',    selected: true  },
            { key: 'dono',      label: 'Dono',      selected: true  },
            { key: 'plano',     label: 'Plano',     selected: true  },
            { key: 'celularId', label: 'Celular ID',selected: false },
        ],
    },
    {
        key: 'extras', label: 'Extras', icon: 'fa-solid fa-ellipsis', selected: true,
        fn: () => request('extras'),
        campos: [
            ..._camposBase(),
            { key: 'categoria', label: 'Categoria',  selected: true },
            { key: 'descricao', label: 'Descrição',  selected: true },
        ],
    },
];

// =============================================================================
// SEÇÃO 2 — EXPORTAR DADOS
//
// exportarDadosFiltrado(formato, categoriasSelecionadas)
//   Recebe o estado de EXPORT_CAMPOS após as seleções do usuário,
//   busca os dados da API, filtra apenas os campos marcados e gera o arquivo.
// =============================================================================

/**
 * Ponto de entrada chamado pela UI após o fluxo multi-step.
 *
 * @param {'csv'|'xlsx'} formato
 * @param {Array}        exportCampos  Estado atual de EXPORT_CAMPOS (com .selected e campos[].selected)
 */
/**
 * @param {'csv'|'xlsx'} formato
 * @param {Array}        exportCampos  Estado de EXPORT_CAMPOS com seleções
 * @param {Object}       expCache      Cache { key: { dados, selecionados: Set<id> } }
 *                                     gerado no step 3 (registros)
 */
async function exportarDadosFiltrado(formato, exportCampos, expCache) {
    const selecionadas = exportCampos.filter(c => c.selected);
    if (!selecionadas.length) return;

    // Usa os dados do cache (já carregados no step 3) e filtra pelos IDs selecionados
    const resultados = selecionadas.map(cat => {
        const cache = expCache[cat.key];
        if (!cache) return { status: 'fulfilled', value: [] };
        const dados = cache.dados.filter(d =>
            cache.selecionados.has(d.id || d._id)
        );
        return { status: 'fulfilled', value: dados };
    });

    // Sufixo com data e hora: DD-MM-AAAA_HH-MM-SS
    const agora  = new Date();
    const data   = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const hora   = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');
    const sufixo = `${data}_${hora}`;

    if (formato === 'csv') {
        _exportarCSVFiltrado(resultados, selecionadas, sufixo);
    } else {
        await _exportarXLSXFiltrado(resultados, selecionadas, sufixo);
    }
}

/**
 * Filtra os campos de um registro retornado pela API
 * conforme os campos marcados em camposSelecionados.
 *
 * @param   {Object}   item              Objeto retornado pela API
 * @param   {Array}    camposSelecionados Lista de { key, selected }
 * @returns {Object}                     Objeto com apenas os campos selecionados
 */
function _filtrarCampos(item, camposSelecionados) {
    const out = {};
    camposSelecionados
        .filter(f => f.selected)
        .forEach(f => {
            if (Object.prototype.hasOwnProperty.call(item, f.key)) {
                out[f.label] = _flattenValue(item[f.key]);
            }
        });
    return out;
}

/**
 * Gera CSV com apenas as tabelas e campos selecionados.
 */
/**
 * Gera um arquivo CSV por tabela selecionada.
 * Sem linha de título — apenas cabeçalho + dados.
 * Nome do arquivo: nometabela_DD-MM-AAAA_HH-MM.csv
 */
function _exportarCSVFiltrado(resultados, selecionadas, sufixo) {
    const escapar = v => {
        const s = String(v ?? '').replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };

    selecionadas.forEach((cat, i) => {
        const dados     = resultados[i].status === 'fulfilled' ? (resultados[i].value || []) : [];
        const camposSel = cat.campos.filter(f => f.selected);
        const headers   = camposSel.map(f => f.label);

        let conteudo = '\uFEFF'; // BOM UTF-8
        conteudo += headers.map(escapar).join(',') + '\r\n';

        dados.forEach(item => {
            const row = camposSel.map(f => escapar(_flattenValue(item[f.key])));
            conteudo += row.join(',') + '\r\n';
        });

        const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
        _downloadBlob(blob, `${cat.label}_${sufixo}.csv`);
    });
}

/**
 * Gera um arquivo XLSX por tabela selecionada.
 * Sem linha de título — apenas cabeçalho + dados.
 * Nome do arquivo: nometabela_DD-MM-AAAA_HH-MM.xlsx
 */
async function _exportarXLSXFiltrado(resultados, selecionadas, sufixo) {
    await _carregarScript(
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    );

    for (let i = 0; i < selecionadas.length; i++) {
        const cat       = selecionadas[i];
        const dados     = resultados[i].status === 'fulfilled' ? (resultados[i].value || []) : [];
        const camposSel = cat.campos.filter(f => f.selected);
        const headers   = camposSel.map(f => f.label);

        const rows = dados.map(item =>
            camposSel.map(f => {
                const v = _flattenValue(item[f.key]);
                const n = Number(v);
                return v !== '' && !isNaN(n) ? n : v;
            })
        );

        const wsData = headers.length ? [headers, ...rows] : [['(sem dados)']];
        const ws     = XLSX.utils.aoa_to_sheet(wsData);

        // Largura automática
        if (headers.length) {
            ws['!cols'] = headers.map((h, ci) => {
                const maxLen = wsData.slice(1).reduce(
                    (max, row) => Math.max(max, String(row[ci] ?? '').length), h.length
                );
                return { wch: maxLen + 2 };
            });
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
        XLSX.writeFile(wb, `${cat.label}_${sufixo}.xlsx`);
    }
}

// =============================================================================
// SEÇÃO 3 — IMPORTAR DADOS
// Lê o arquivo selecionado pelo usuário (CSV ou XLSX) e envia cada linha
// como POST para o endpoint da categoria escolhida.
//
// Depende de `importArquivo` (variável de estado declarada no HTML inline)
// e das funções de UI: mostrarProgressoImport(), atualizarProgressoImport(),
// mostrarResultadoImport() — também definidas no HTML inline.
// =============================================================================

/**
 * Ponto de entrada chamado pelo botão "Importar" do modal.
 * Lê o arquivo, converte em array de objetos e envia à API.
 */
async function confirmarImport() {
    if (!importArquivo) return;

    const categoria = document.getElementById('importCategoria').value;
    const ext       = importArquivo.name.split('.').pop().toLowerCase();

    // Inicia UI de progresso (definida no HTML inline)
    mostrarProgressoImport('Lendo arquivo…', 20);
    document.getElementById('btnConfirmarImport').disabled = true;

    try {
        let registros = [];

        if (ext === 'csv') {
            const texto = await importArquivo.text();
            registros   = _parseCSV(texto);
        } else {
            // XLSX / XLS — usa SheetJS
            await _carregarScript(
                'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
            );
            const buffer = await importArquivo.arrayBuffer();
            const wb     = XLSX.read(buffer, { type: 'array' });
            const ws     = wb.Sheets[wb.SheetNames[0]];
            registros    = XLSX.utils.sheet_to_json(ws, { defval: '' });
        }

        mostrarProgressoImport(`Enviando ${registros.length} registros para /${categoria}…`, 50);

        // Sanitiza cada registro antes de enviar:
        // remove _id / id / Id para que o MongoDB gere um novo ObjectId,
        // igual ao que acontece ao criar um registro normalmente pela UI.
        const registrosSanitizados = registros.map(r => _coercirTipos(_sanitizarRegistro(r), categoria));

        // Envia registros em sequência — POST /api/{categoria}
        let ok = 0, erros = 0;
        for (const reg of registrosSanitizados) {
            try {
                await request(categoria, 'POST', reg);
                ok++;
            } catch (e) {
                console.warn(`Falha ao importar registro:`, reg, e);
                erros++;
            }
            const pct = 50 + Math.round((ok + erros) / registros.length * 50);
            atualizarProgressoImport(pct);
        }

        atualizarProgressoImport(100, 'Concluído.');

        // Resultado final (função de UI definida no HTML inline)
        if (erros === 0) {
            mostrarResultadoImport('success',
                `<i class="fa-solid fa-circle-check"></i> ${ok} registro(s) importado(s) com sucesso!`
            );
        } else {
            mostrarResultadoImport('error',
                `<i class="fa-solid fa-triangle-exclamation"></i> ${ok} importado(s), ${erros} com erro. Verifique o console para detalhes.`
            );
        }

    } catch (err) {
        console.error('Erro na importação:', err);
        atualizarProgressoImport(100);
        mostrarResultadoImport('error',
            `<i class="fa-solid fa-circle-xmark"></i> Erro ao processar o arquivo: ${err.message}`
        );
    }

    document.getElementById('btnConfirmarImport').disabled = false;
}


// =============================================================================
// SEÇÃO 4 — PARSER CSV INTERNO
// Compatível com o formato gerado por _exportarCSV():
//   - BOM UTF-8 opcional
//   - Linhas ### NOME ### são ignoradas (separadores de categoria)
//   - Suporte a campos entre aspas com vírgulas e quebras de linha
// =============================================================================

/**
 * Converte texto CSV em array de objetos usando a primeira linha como cabeçalho.
 * @param {string} texto  Conteúdo do arquivo CSV (já lido como string)
 * @returns {Object[]}
 */
function _parseCSV(texto) {
    // Remove BOM UTF-8 se presente
    if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);

    // Filtra linhas vazias e separadores de categoria (### ... ###)
    const linhas = texto
        .split(/\r?\n/)
        .filter(l => l.trim() && !l.startsWith('###'));

    if (linhas.length < 2) return [];

    const splitLine = line => {
        const cols = [];
        let cur    = '';
        let quoted = false;

        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"' && !quoted) {
                quoted = true;
            } else if (c === '"' && quoted) {
                // Aspas duplas escapadas dentro de campo
                if (line[i + 1] === '"') { cur += '"'; i++; }
                else quoted = false;
            } else if (c === ',' && !quoted) {
                cols.push(cur); cur = '';
            } else {
                cur += c;
            }
        }
        cols.push(cur);
        return cols;
    };

    const headers = splitLine(linhas[0]);

    return linhas.slice(1).map(l => {
        const vals = splitLine(l);
        const obj  = {};
        headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
        return obj;
    });
}


// =============================================================================
// SEÇÃO 5 — HELPERS PRIVADOS
// =============================================================================

/**
 * Converte os campos vindos do CSV/XLSX para os tipos e estruturas corretas
 * que o backend ASP.NET Core espera.
 *
 * Problemas resolvidos:
 *  1. Coerção de tipos primitivos: string → bool / int / float / decimal
 *  2. Montagem de arrays aninhados a partir de colunas indexadas no CSV:
 *       ram_slot_0, ram_slot_1        → memoriaRAM: [enum, enum]
 *       disco_tipo_0, disco_tamanho_0 → discos: [{tipo, tamanho}]
 *       gpu_tipo_0, gpu_vram_0        → placasVideo: [{tipo, vram}]
 *       conector_video_0              → conectoresVideo: [enum]
 *  3. Todos os campos enviados em camelCase (padrão da API)
 *
 * @param   {Object} reg       Registro já sem _id (saída de _sanitizarRegistro)
 * @param   {string} categoria Endpoint de destino (ex: 'computadores')
 * @returns {Object}           Novo objeto com tipos e estruturas corrigidos
 */
function _coercirTipos(reg, categoria) {

    // ── helpers internos ────────────────────────────────────────────
    const toBool = v =>
        v === true || v === 1 ||
        String(v).trim().toLowerCase() === 'true' ||
        String(v).trim() === '1';

    const toInt = v => { const n = parseInt(v, 10);   return isNaN(n) ? 0 : n; };
    const toFlt = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

    // Extrai colunas indexadas: prefix + índice (0, 1, 2…)
    const extrairIndexados = (prefix) => {
        const lista = [];
        let i = 0;
        while (reg[`${prefix}${i}`] !== undefined) {
            lista.push(reg[`${prefix}${i}`]);
            i++;
        }
        return lista;
    };

    // ── campos base de Equipamento (comum a todas as categorias) ────
    const base = {
        codigo:        reg.Codigo        || reg.codigo        || undefined,
        usuario:       reg.Usuario       || reg.usuario       || '',
        dataAquisicao: reg.DataAquisicao || reg.dataAquisicao || new Date().toISOString(),
        precoAquisicao: toFlt(reg.PrecoAquisicao ?? reg.precoAquisicao ?? 0),
        ativo:         toBool(reg.Ativo  ?? reg.ativo  ?? true),
        setor:         reg.Setor         || reg.setor         || '',
        status:        reg.Status        || reg.status        || '',
        observacoes:   reg.Observacoes   || reg.observacoes   || null,
    };

    // ── computadores ────────────────────────────────────────────────
    if (categoria === 'computadores') {
        const memoriaRAM     = extrairIndexados('ram_slot_').filter(Boolean);
        const conectoresVideo = extrairIndexados('conector_video_').filter(Boolean);

        const discos = [];
        let i = 0;
        while (reg[`disco_tipo_${i}`] !== undefined) {
            discos.push({
                tipo:    reg[`disco_tipo_${i}`]    || 'HDD',
                tamanho: toInt(reg[`disco_tamanho_${i}`] ?? 0),
            });
            i++;
        }

        const placasVideo = [];
        i = 0;
        while (reg[`gpu_tipo_${i}`] !== undefined) {
            placasVideo.push({
                tipo: reg[`gpu_tipo_${i}`] || 'Integrada',
                vram: toInt(reg[`gpu_vram_${i}`] ?? 0),
            });
            i++;
        }

        const qtdSlots    = memoriaRAM.length     || toInt(reg.QuantidadeSlots    ?? reg.quantidadeSlots    ?? 0);
        const qtdDiscos   = discos.length         || toInt(reg.QuantidadeDiscos   ?? reg.quantidadeDiscos   ?? 0);
        const qtdGPUs     = placasVideo.length    || toInt(reg.QuantidadePlacasVideo ?? reg.quantidadePlacasVideo ?? 0);
        const qtdConn     = conectoresVideo.length || toInt(reg.QuantidadeConectoresVideo ?? reg.quantidadeConectoresVideo ?? 0);

        return {
            ...base,
            modelo:                   reg.Modelo             || reg.modelo             || '',
            tipo:                     reg.Tipo               || reg.tipo               || '',
            processadorId:            reg.ProcessadorId      || reg.processadorId      || null,
            geracaoRAM:               reg.GeracaoRAM         || reg.geracaoRAM         || null,
            quantidadeSlots:          qtdSlots,
            memoriaRAM,
            memoriaRAMTotal:          toInt(reg.MemoriaRAMTotal  ?? reg.memoriaRAMTotal  ?? 0),
            velocidadeRAM:            toInt(reg.VelocidadeRAM    ?? reg.velocidadeRAM    ?? 0),
            quantidadeDiscos:         qtdDiscos,
            discos,
            quantidadePlacasVideo:    qtdGPUs,
            placasVideo,
            quantidadeConectoresVideo: qtdConn,
            conectoresVideo,
            sistemaOperacional:       reg.SistemaOperacional || reg.sistemaOperacional || null,
            ativacaoSO:               reg.AtivacaoSO         || reg.ativacaoSO         || null,
            office:                   reg.Office             || reg.office             || null,
            ativacaoOffice:           reg.AtivacaoOffice     || reg.ativacaoOffice     || null,
            ip:                       reg.IP                 || reg.ip                 || null,
        };
    }

    // ── celulares ────────────────────────────────────────────────────
    if (categoria === 'celulares') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            memoriaRAM:    toInt(reg.MemoriaRAM    ?? reg.memoriaRAM    ?? 0),
            armazenamento: toInt(reg.Armazenamento ?? reg.armazenamento ?? 0),
            conectividade: reg.Conectividade  || reg.conectividade  || null,
            operadora:     reg.Operadora      || reg.operadora      || null,
        };
    }

    // ── monitores ────────────────────────────────────────────────────
    if (categoria === 'monitores') {
        return {
            ...base,
            modelo:      reg.Modelo      || reg.modelo      || '',
            tamanho:     toFlt(reg.Tamanho     ?? reg.tamanho     ?? 0),
            resolucao:   reg.Resolucao    || reg.resolucao    || null,
            frequencia:  toInt(reg.Frequencia  ?? reg.frequencia  ?? 0),
            hdmi:        toBool(reg.HDMI        ?? reg.hdmi        ?? false),
            displayPort: toBool(reg.DisplayPort ?? reg.displayPort ?? false),
            vga:         toBool(reg.VGA         ?? reg.vga         ?? false),
            dvi:         toBool(reg.DVI         ?? reg.dvi         ?? false),
        };
    }

    // ── mouses ───────────────────────────────────────────────────────
    if (categoria === 'mouses') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            tipo:          reg.Tipo          || reg.tipo          || null,
            conectividade: reg.Conectividade || reg.conectividade || null,
        };
    }

    // ── teclados ─────────────────────────────────────────────────────
    if (categoria === 'teclados') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            tipo:          reg.Tipo          || reg.tipo          || null,
            conectividade: reg.Conectividade || reg.conectividade || null,
            tamanho:       toInt(reg.Tamanho ?? reg.tamanho ?? 0),
            switch:        reg.Switch        || reg.switch        || null,
        };
    }

    // ── fones ────────────────────────────────────────────────────────
    if (categoria === 'fones') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            tipo:          reg.Tipo          || reg.tipo          || null,
            microfone:     toBool(reg.Microfone    ?? reg.microfone    ?? false),
            conectividade: reg.Conectividade || reg.conectividade || null,
        };
    }

    // ── ramais ───────────────────────────────────────────────────────
    if (categoria === 'ramais') {
        return {
            ...base,
            modelo:      reg.Modelo      || reg.modelo      || '',
            cor:         reg.Cor         || reg.cor         || null,
            tipo:        reg.Tipo        || reg.tipo        || null,
            configurado: toBool(reg.Configurado ?? reg.configurado ?? false),
            linha:       reg.Linha       || reg.linha       || null,
            numero:      reg.Numero      || reg.numero      || null,
            ip:          reg.IP          || reg.ip          || null,
            mac:         reg.MAC         || reg.mac         || null,
        };
    }

    // ── chips ────────────────────────────────────────────────────────
    if (categoria === 'chips') {
        return {
            ...base,
            operadora: reg.Operadora || reg.operadora || '',
            numero:    reg.Numero    || reg.numero    || '',
            dono:      reg.Dono      || reg.dono      || null,
            plano:     toFlt(reg.Plano ?? reg.plano ?? 0),
            celularId: reg.CelularId || reg.celularId || null,
        };
    }

    // ── extras ───────────────────────────────────────────────────────
    if (categoria === 'extras') {
        return {
            ...base,
            categoria:  reg.Categoria  || reg.categoria  || '',
            descricao:  reg.Descricao  || reg.descricao  || null,
        };
    }

    // fallback: devolve o registro com apenas a base corrigida
    return { ...base, ...reg };
}


function _sanitizarRegistro(reg) {
    const ID_KEYS = new Set(['_id', 'id', 'Id', 'ID', '_Id', '_ID']);
    return Object.fromEntries(
        Object.entries(reg).filter(([k]) => !ID_KEYS.has(k))
    );
}

/**
 * Normaliza um valor de campo para string legível,
 * tratando objetos aninhados e arrays (padrão da API do projeto).
 */
function _flattenValue(val) {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) {
        return val.map(v =>
            typeof v === 'object'
                ? (v.nome || v.name || v.numero || JSON.stringify(v))
                : v
        ).join(' | ');
    }
    if (typeof val === 'object') return val.nome || val.name || JSON.stringify(val);
    return String(val);
}

/**
 * Converte um array de objetos em { headers[], rows[][] } para geração de planilha.
 */
function _matriceDeObjetos(arr) {
    if (!arr || arr.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(arr[0]);
    const rows    = arr.map(item => headers.map(h => _flattenValue(item[h])));
    return { headers, rows };
}

/** Dispara o download de um Blob com o nome informado. */
function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Carrega um script externo dinamicamente (evita duplicatas).
 * @param {string} src  URL do script
 * @returns {Promise<void>}
 */
function _carregarScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s   = document.createElement('script');
        s.src     = src;
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
