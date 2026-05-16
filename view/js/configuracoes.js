// =============================================================================
// configuracoes.js — Lógica de dados da tela de configurações
//
// Responsabilidades (SOMENTE backend / comunicação com API):
//   SEÇÃO 1 — Mapa de categorias e campos exportáveis (EXPORT_CAMPOS)
//             Mapa de campos filtráveis por categoria (_FILTROS_DEF)
//   SEÇÃO 2 — Exportação de dados
//             exportarDadosFiltrado()   — ponto de entrada chamado pela UI
//             _filtrarCampos()          — filtra campos por seleção do usuário
//             _exportarCSVFiltrado()    — gera e baixa CSV por tabela
//             _exportarXLSXFiltrado()   — gera e baixa XLSX por tabela (SheetJS)
//   SEÇÃO 3 — Importação de dados
//             confirmarImport()         — lê o arquivo e envia à API via POST
//   SEÇÃO 4 — Parser CSV interno
//             _parseCSV()              — converte texto CSV em array de objetos
//   SEÇÃO 5 — Helpers privados
//             _coercirTipos()          — adapta tipos do CSV/XLSX para o backend .NET
//             _sanitizarRegistro()     — remove _id/id antes do POST
//             _flattenValue()          — normaliza valores aninhados para string
//             _matriceDeObjetos()      — converte array de objetos em matriz
//             _downloadBlob()          — dispara download de um Blob
//             _carregarScript()        — carrega script externo dinamicamente
//
// O que NÃO está aqui (fica no <script> inline do configuracoes.html):
//   - Tema, sidebar, avatar, save strip, modais, drag & drop
//   - salvarConfiguracoes / carregarConfiguracoes (localStorage apenas)
//   - limparPreferencias (localStorage apenas)
//   - Todo o fluxo visual multi-step da exportação (renderização, navegação)
//   - Funções de UI da importação: mostrarProgressoImport,
//     atualizarProgressoImport, mostrarResultadoImport
//
// Dependências:
//   - api.js (request) — carregado antes no HTML
//   - Funções de UI definidas no <script> inline do HTML:
//       mostrarProgressoImport(), atualizarProgressoImport(),
//       mostrarResultadoImport(), fecharModalImport()
//   - Variável de estado do HTML: importArquivo (File | null)
// =============================================================================


// =============================================================================
// SEÇÃO 1 — MAPA DE CATEGORIAS, CAMPOS E FILTROS
// =============================================================================

// -----------------------------------------------------------------------------
// _CAMPOS_BASE
// Campos comuns a todas as categorias de equipamento.
// "selected: true" indica que o campo é exportado por padrão.
// Clonado por _camposBase() para que cada categoria tenha sua própria instância.
// -----------------------------------------------------------------------------
const _CAMPOS_BASE = [
    { key: 'id',             label: 'ID',                selected: false },
    { key: 'codigo',         label: 'Código',             selected: true  },
    { key: 'usuario',        label: 'Usuário',            selected: true  },
    { key: 'dataAquisicao',  label: 'Data de Aquisição',  selected: true  },
    { key: 'precoAquisicao', label: 'Preço de Aquisição', selected: true  },
    { key: 'ativo',          label: 'Ativo',              selected: true  },
    { key: 'setor',          label: 'Setor',              selected: true  },
    { key: 'status',         label: 'Status',             selected: true  },
    { key: 'observacoes',    label: 'Observações',        selected: false },
];

/**
 * Retorna um clone de _CAMPOS_BASE para que cada categoria tenha
 * sua própria instância mutável (evita compartilhamento de estado).
 * @returns {Array}
 */
function _camposBase() {
    return _CAMPOS_BASE.map(f => ({ ...f }));
}

// -----------------------------------------------------------------------------
// EXPORT_CAMPOS
// Define todas as categorias exportáveis:
//   - key      : endpoint da API (ex: 'computadores')
//   - label    : nome exibido na UI
//   - icon     : classe Font Awesome
//   - selected : se a tabela está marcada para exportação (mutável pela UI)
//   - fn       : função que busca os dados via api.js (GET /api/{key})
//   - campos   : lista de { key, label, selected } com todos os campos do modelo
//                "key" deve bater com a chave camelCase retornada pela API
//
// Usado por:
//   - configuracoes.html (renderização do step 1, 2, 3)
//   - exportarDadosFiltrado() desta seção
// -----------------------------------------------------------------------------
const EXPORT_CAMPOS = [
    {
        key: 'computadores', label: 'Computadores', icon: 'fa-solid fa-computer', selected: true,
        fn: () => request('computadores'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',                    label: 'Modelo',                   selected: true  },
            { key: 'tipo',                      label: 'Tipo',                     selected: true  },
            { key: 'processadorId',             label: 'Processador',              selected: false },
            { key: 'geracaoRAM',                label: 'Geração RAM',              selected: true  },
            { key: 'quantidadeSlots',           label: 'Qtd. Slots',               selected: true  },
            { key: 'memoriaRAM',                label: 'Memória RAM (slots)',      selected: true  },
            { key: 'memoriaRAMTotal',           label: 'Memória RAM Total (GB)',   selected: true  },
            { key: 'velocidadeRAM',             label: 'Velocidade RAM (MHz)',     selected: true  },
            { key: 'quantidadeDiscos',          label: 'Qtd. Discos',              selected: true  },
            { key: 'discos',                    label: 'Discos (tipo/tamanho)',    selected: true  },
            { key: 'quantidadePlacasVideo',     label: 'Qtd. Placas de Vídeo',    selected: false },
            { key: 'placasVideo',               label: 'Placas de Vídeo',         selected: false },
            { key: 'quantidadeConectoresVideo', label: 'Qtd. Conectores Vídeo',   selected: false },
            { key: 'conectoresVideo',           label: 'Conectores de Vídeo',     selected: false },
            { key: 'sistemaOperacional',        label: 'Sistema Operacional',     selected: true  },
            { key: 'ativacaoSO',                label: 'Ativação SO',             selected: true  },
            { key: 'office',                    label: 'Office',                  selected: true  },
            { key: 'ativacaoOffice',            label: 'Ativação Office',         selected: true  },
            { key: 'ip',                        label: 'IP',                      selected: true  },
        ],
    },
    {
        key: 'celulares', label: 'Celulares', icon: 'fa-solid fa-mobile-screen-button', selected: true,
        fn: () => request('celulares'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',         label: 'Modelo',             selected: true  },
            { key: 'memoriaRAM',     label: 'Memória RAM (GB)',   selected: true  },
            { key: 'armazenamento',  label: 'Armazenamento (GB)', selected: true  },
            { key: 'conectividade',  label: 'Carregador',         selected: true  },
            { key: 'operadora',      label: 'Operadora',          selected: true  },
            { key: 'chipIds',        label: 'Chips',              selected: false },
            { key: 'contasWhatsapp', label: 'WhatsApp',           selected: false },
        ],
    },
    {
        key: 'monitores', label: 'Monitores', icon: 'fa-solid fa-desktop', selected: true,
        fn: () => request('monitores'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',      label: 'Modelo',        selected: true  },
            { key: 'tamanho',     label: 'Tamanho (pol)', selected: true  },
            { key: 'resolucao',   label: 'Resolução',     selected: true  },
            { key: 'frequencia',  label: 'Frequência',    selected: true  },
            { key: 'hdmi',        label: 'HDMI',          selected: true  },
            { key: 'displayPort', label: 'DisplayPort',   selected: true  },
            { key: 'vga',         label: 'VGA',           selected: false },
            { key: 'dvi',         label: 'DVI',           selected: false },
        ],
    },
    {
        key: 'mouses', label: 'Mouses', icon: 'fa-solid fa-computer-mouse', selected: true,
        fn: () => request('mouses'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',        label: 'Modelo',        selected: true },
            { key: 'tipo',          label: 'Tipo',          selected: true },
            { key: 'conectividade', label: 'Conectividade', selected: true },
        ],
    },
    {
        key: 'teclados', label: 'Teclados', icon: 'fa-solid fa-keyboard', selected: true,
        fn: () => request('teclados'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',        label: 'Modelo',        selected: true  },
            { key: 'tipo',          label: 'Tipo',          selected: true  },
            { key: 'conectividade', label: 'Conectividade', selected: true  },
            { key: 'tamanho',       label: 'Tamanho (%)',   selected: true  },
            { key: 'switch',        label: 'Switch',        selected: false },
        ],
    },
    {
        key: 'fones', label: 'Fones', icon: 'fa-solid fa-headphones', selected: true,
        fn: () => request('fones'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',        label: 'Modelo',        selected: true },
            { key: 'tipo',          label: 'Tipo',          selected: true },
            { key: 'microfone',     label: 'Microfone',     selected: true },
            { key: 'conectividade', label: 'Conectividade', selected: true },
        ],
    },
    {
        key: 'ramais', label: 'Ramais', icon: 'fa-solid fa-phone', selected: true,
        fn: () => request('ramais'),
        campos: [
            ..._camposBase(),
            { key: 'modelo',      label: 'Modelo',      selected: true  },
            { key: 'cor',         label: 'Cor',         selected: true  },
            { key: 'tipo',        label: 'Tipo',        selected: true  },
            { key: 'configurado', label: 'Configurado', selected: true  },
            { key: 'linha',       label: 'Linha',       selected: true  },
            { key: 'numero',      label: 'Número',      selected: true  },
            { key: 'ip',          label: 'IP',          selected: true  },
            { key: 'mac',         label: 'MAC',         selected: false },
        ],
    },
    {
        key: 'chips', label: 'Chips', icon: 'fa-solid fa-sim-card', selected: true,
        fn: () => request('chips'),
        campos: [
            ..._camposBase(),
            { key: 'operadora',  label: 'Operadora',  selected: true  },
            { key: 'numero',     label: 'Número',     selected: true  },
            { key: 'dono',       label: 'Dono',       selected: true  },
            { key: 'plano',      label: 'Plano',      selected: true  },
            { key: 'celularId',  label: 'Celular ID', selected: false },
        ],
    },
    {
        key: 'extras', label: 'Extras', icon: 'fa-solid fa-ellipsis', selected: true,
        fn: () => request('extras'),
        campos: [
            ..._camposBase(),
            { key: 'categoria', label: 'Categoria', selected: true },
            { key: 'descricao', label: 'Descrição', selected: true },
        ],
    },
];

// -----------------------------------------------------------------------------
// _FILTROS_DEF
// Define os campos disponíveis para filtragem no step 3 (Registros) por categoria.
// Chave "key" deve bater com a propriedade camelCase retornada pela API.
// Usado por configuracoes.html para montar os selects de filtro.
// -----------------------------------------------------------------------------
const _FILTROS_DEF = {
    computadores: [
        { key: 'codigo',             label: 'Código'           },
        { key: 'usuario',            label: 'Usuário'          },
        { key: 'setor',              label: 'Setor'            },
        { key: 'status',             label: 'Status'           },
        { key: 'modelo',             label: 'Modelo'           },
        { key: 'tipo',               label: 'Tipo'             },
        { key: 'sistemaOperacional', label: 'Sistema Op.'      },
        { key: 'ativo',              label: 'Ativo'            },
        { key: 'ip',                 label: 'IP'               },
    ],
    celulares: [
        { key: 'codigo',    label: 'Código'    },
        { key: 'usuario',   label: 'Usuário'   },
        { key: 'setor',     label: 'Setor'     },
        { key: 'status',    label: 'Status'    },
        { key: 'modelo',    label: 'Modelo'    },
        { key: 'operadora', label: 'Operadora' },
        { key: 'ativo',     label: 'Ativo'     },
    ],
    monitores: [
        { key: 'codigo',    label: 'Código'    },
        { key: 'usuario',   label: 'Usuário'   },
        { key: 'setor',     label: 'Setor'     },
        { key: 'status',    label: 'Status'    },
        { key: 'modelo',    label: 'Modelo'    },
        { key: 'resolucao', label: 'Resolução' },
        { key: 'ativo',     label: 'Ativo'     },
    ],
    mouses: [
        { key: 'codigo',  label: 'Código'  },
        { key: 'usuario', label: 'Usuário' },
        { key: 'setor',   label: 'Setor'   },
        { key: 'status',  label: 'Status'  },
        { key: 'modelo',  label: 'Modelo'  },
        { key: 'tipo',    label: 'Tipo'    },
        { key: 'ativo',   label: 'Ativo'   },
    ],
    teclados: [
        { key: 'codigo',  label: 'Código'  },
        { key: 'usuario', label: 'Usuário' },
        { key: 'setor',   label: 'Setor'   },
        { key: 'status',  label: 'Status'  },
        { key: 'modelo',  label: 'Modelo'  },
        { key: 'tipo',    label: 'Tipo'    },
        { key: 'ativo',   label: 'Ativo'   },
    ],
    fones: [
        { key: 'codigo',  label: 'Código'  },
        { key: 'usuario', label: 'Usuário' },
        { key: 'setor',   label: 'Setor'   },
        { key: 'status',  label: 'Status'  },
        { key: 'modelo',  label: 'Modelo'  },
        { key: 'tipo',    label: 'Tipo'    },
        { key: 'ativo',   label: 'Ativo'   },
    ],
    ramais: [
        { key: 'codigo', label: 'Código'  },
        { key: 'setor',  label: 'Setor'   },
        { key: 'status', label: 'Status'  },
        { key: 'modelo', label: 'Modelo'  },
        { key: 'linha',  label: 'Linha'   },
        { key: 'numero', label: 'Número'  },
        { key: 'ativo',  label: 'Ativo'   },
    ],
    chips: [
        { key: 'codigo',    label: 'Código'    },
        { key: 'operadora', label: 'Operadora' },
        { key: 'numero',    label: 'Número'    },
        { key: 'dono',      label: 'Dono'      },
        { key: 'status',    label: 'Status'    },
        { key: 'ativo',     label: 'Ativo'     },
    ],
    extras: [
        { key: 'codigo',    label: 'Código'    },
        { key: 'usuario',   label: 'Usuário'   },
        { key: 'setor',     label: 'Setor'     },
        { key: 'status',    label: 'Status'    },
        { key: 'categoria', label: 'Categoria' },
        { key: 'ativo',     label: 'Ativo'     },
    ],
};


// =============================================================================
// SEÇÃO 2 — EXPORTAÇÃO DE DADOS
//
// Fluxo:
//   UI (configuracoes.html) coleta seleções → chama executarExportacao(formato)
//   → executarExportacao chama exportarDadosFiltrado() aqui
//   → esta função usa _expCache (já carregado no step 3) e gera o arquivo
// =============================================================================

/**
 * Ponto de entrada chamado pela UI após o fluxo multi-step de exportação.
 * Usa os dados do cache gerado no step 3 (já filtrados por ID selecionado)
 * e gera um arquivo CSV ou XLSX por tabela.
 *
 * @param {'csv'|'xlsx'} formato
 * @param {Array}        exportCampos  Estado atual de EXPORT_CAMPOS (com .selected e campos[].selected)
 * @param {Object}       expCache      Cache { key: { dados: [], selecionados: Set<id> } }
 *                                     gerado pelo step 3 em configuracoes.html
 */
async function exportarDadosFiltrado(formato, exportCampos, expCache) {
    const selecionadas = exportCampos.filter(c => c.selected);
    if (!selecionadas.length) return;

    // Filtra cada categoria pelos IDs que o usuário selecionou no step 3
    const resultados = selecionadas.map(cat => {
        const cache = expCache[cat.key];
        if (!cache) return { status: 'fulfilled', value: [] };
        const dados = cache.dados.filter(d => cache.selecionados.has(d.id || d._id));
        return { status: 'fulfilled', value: dados };
    });

    // Sufixo do nome do arquivo: DD-MM-AAAA_HH-MM-SS
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
 * Filtra as propriedades de um item da API conforme os campos marcados pelo usuário.
 * Usa os labels definidos em EXPORT_CAMPOS como cabeçalhos do arquivo.
 *
 * @param   {Object} item              Objeto retornado pela API
 * @param   {Array}  camposSelecionados Lista de { key, label, selected }
 * @returns {Object}                   Objeto com apenas os campos selecionados (chave = label)
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
 * Gera e baixa um arquivo CSV para cada tabela selecionada.
 * Formato: BOM UTF-8 + cabeçalho + linhas de dados.
 * Nome do arquivo: NomeTabela_DD-MM-AAAA_HH-MM-SS.csv
 *
 * @param {Array}  resultados  Array de { status, value: [] } (um por categoria)
 * @param {Array}  selecionadas Categorias selecionadas de EXPORT_CAMPOS
 * @param {string} sufixo      Data/hora formatados para o nome do arquivo
 */
function _exportarCSVFiltrado(resultados, selecionadas, sufixo) {
    // Escapa o valor para uso em CSV (envolve em aspas se necessário)
    const escapar = v => {
        const s = String(v ?? '').replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };

    selecionadas.forEach((cat, i) => {
        const dados     = resultados[i].status === 'fulfilled' ? (resultados[i].value || []) : [];
        const camposSel = cat.campos.filter(f => f.selected);
        const headers   = camposSel.map(f => f.label);

        let conteudo = '\uFEFF'; // BOM UTF-8 — garante acentos no Excel
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
 * Gera e baixa um arquivo XLSX para cada tabela selecionada.
 * Usa SheetJS (carregado dinamicamente se ainda não estiver na página).
 * Nome do arquivo: NomeTabela_DD-MM-AAAA_HH-MM-SS.xlsx
 *
 * @param {Array}  resultados  Array de { status, value: [] }
 * @param {Array}  selecionadas Categorias selecionadas de EXPORT_CAMPOS
 * @param {string} sufixo      Data/hora formatados para o nome do arquivo
 */
async function _exportarXLSXFiltrado(resultados, selecionadas, sufixo) {
    // Carrega SheetJS dinamicamente para não adicionar peso à página principal
    await _carregarScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

    for (let i = 0; i < selecionadas.length; i++) {
        const cat       = selecionadas[i];
        const dados     = resultados[i].status === 'fulfilled' ? (resultados[i].value || []) : [];
        const camposSel = cat.campos.filter(f => f.selected);
        const headers   = camposSel.map(f => f.label);

        // Converte para número quando possível (melhora formatação no Excel)
        const rows = dados.map(item =>
            camposSel.map(f => {
                const v = _flattenValue(item[f.key]);
                const n = Number(v);
                return v !== '' && !isNaN(n) ? n : v;
            })
        );

        const wsData = headers.length ? [headers, ...rows] : [['(sem dados)']];
        const ws     = XLSX.utils.aoa_to_sheet(wsData);

        // Ajusta largura das colunas automaticamente
        if (headers.length) {
            ws['!cols'] = headers.map((h, ci) => {
                const maxLen = wsData.slice(1).reduce(
                    (max, row) => Math.max(max, String(row[ci] ?? '').length), h.length
                );
                return { wch: maxLen + 2 };
            });
        }

        const wb = XLSX.utils.book_new();
        // Nome da aba limitado a 31 caracteres (restrição do formato XLSX)
        XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
        XLSX.writeFile(wb, `${cat.label}_${sufixo}.xlsx`);
    }
}


// =============================================================================
// SEÇÃO 3 — IMPORTAÇÃO DE DADOS
//
// Lê o arquivo selecionado pelo usuário (CSV ou XLSX), converte em array
// de objetos e envia cada linha como POST para o endpoint da categoria.
//
// Depende de:
//   - importArquivo : variável de estado declarada no script inline do HTML
//   - mostrarProgressoImport(), atualizarProgressoImport(),
//     mostrarResultadoImport() : funções de UI do script inline do HTML
// =============================================================================

/**
 * Ponto de entrada chamado pelo botão "Importar" do modal.
 * Lê o arquivo, converte em array de objetos e envia à API.
 *
 * POST /api/{categoria} (uma requisição por registro)
 * Erros individuais são logados no console sem interromper os demais registros.
 *
 * Chamada por: btnConfirmarImport (vinculado no script inline do HTML)
 * Usa: importArquivo (File) declarado no script inline do HTML
 */
async function confirmarImport() {
    // importArquivo é declarado no script inline do HTML
    if (!importArquivo) return;

    const categoria = document.getElementById('importCategoria').value;
    const ext       = importArquivo.name.split('.').pop().toLowerCase();

    // Inicia barra de progresso (funções de UI definidas no script inline do HTML)
    mostrarProgressoImport('Lendo arquivo…', 20);
    document.getElementById('btnConfirmarImport').disabled = true;

    try {
        let registros = [];

        if (ext === 'csv') {
            // Lê o arquivo como texto e usa o parser interno
            const texto = await importArquivo.text();
            registros   = _parseCSV(texto);
        } else {
            // XLSX / XLS — usa SheetJS carregado dinamicamente
            await _carregarScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
            const buffer = await importArquivo.arrayBuffer();
            const wb     = XLSX.read(buffer, { type: 'array' });
            const ws     = wb.Sheets[wb.SheetNames[0]];
            registros    = XLSX.utils.sheet_to_json(ws, { defval: '' });
        }

        mostrarProgressoImport(`Enviando ${registros.length} registros para /${categoria}…`, 50);

        // Sanitiza cada registro antes de enviar:
        //   - remove _id/id para que o backend gere um novo ID
        //   - converte tipos para o formato esperado pelo backend .NET
        const registrosSanitizados = registros.map(r =>
            _coercirTipos(_sanitizarRegistro(r), categoria)
        );

        // Envia em sequência — POST /api/{categoria}
        let ok = 0, erros = 0;
        for (const reg of registrosSanitizados) {
            try {
                // request() definida em api.js
                await request(categoria, 'POST', reg);
                ok++;
            } catch (e) {
                console.warn('Falha ao importar registro:', reg, e);
                erros++;
            }
            const pct = 50 + Math.round((ok + erros) / registros.length * 50);
            atualizarProgressoImport(pct);
        }

        atualizarProgressoImport(100, 'Concluído.');

        // Exibe resultado final via função de UI do script inline do HTML
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
//
// Compatível com o formato gerado por _exportarCSVFiltrado():
//   - BOM UTF-8 opcional (removido automaticamente)
//   - Campos entre aspas com vírgulas e quebras de linha internas
//   - Aspas duplas escapadas ("") dentro de campos
//   - Linhas vazias ignoradas
// =============================================================================

/**
 * Converte texto CSV em array de objetos usando a primeira linha como cabeçalho.
 * @param {string} texto  Conteúdo do arquivo CSV lido como string
 * @returns {Object[]}
 */
function _parseCSV(texto) {
    // Remove BOM UTF-8 se presente
    if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);

    // Filtra linhas vazias
    const linhas = texto.split(/\r?\n/).filter(l => l.trim());
    if (linhas.length < 2) return [];

    /**
     * Divide uma linha CSV respeitando campos entre aspas.
     * @param {string} line
     * @returns {string[]}
     */
    const splitLine = line => {
        const cols = [];
        let cur    = '';
        let quoted = false;

        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"' && !quoted) {
                quoted = true;
            } else if (c === '"' && quoted) {
                // Aspas duplas escapadas dentro do campo
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
 *  1. Coerção de tipos primitivos: string → bool / int / float
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

    // ── Helpers de conversão de tipo ────────────────────────────────
    const toBool = v =>
        v === true || v === 1 ||
        String(v).trim().toLowerCase() === 'true' ||
        String(v).trim() === '1';

    const toInt = v => { const n = parseInt(v, 10);   return isNaN(n) ? 0 : n; };
    const toFlt = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

    /**
     * Extrai colunas indexadas do CSV (ex: ram_slot_0, ram_slot_1…) em array.
     * @param {string} prefix prefixo das colunas indexadas
     * @returns {Array}
     */
    const extrairIndexados = (prefix) => {
        const lista = [];
        let i = 0;
        while (reg[`${prefix}${i}`] !== undefined) {
            lista.push(reg[`${prefix}${i}`]);
            i++;
        }
        return lista;
    };

    // ── Campos base de Equipamento (comuns a todas as categorias) ────
    const base = {
        codigo:         reg.Codigo         || reg.codigo         || undefined,
        usuario:        reg.Usuario        || reg.usuario        || '',
        dataAquisicao:  reg.DataAquisicao  || reg.dataAquisicao  || new Date().toISOString(),
        precoAquisicao: toFlt(reg.PrecoAquisicao ?? reg.precoAquisicao ?? 0),
        ativo:          toBool(reg.Ativo   ?? reg.ativo          ?? true),
        setor:          reg.Setor          || reg.setor          || '',
        status:         reg.Status         || reg.status         || '',
        observacoes:    reg.Observacoes    || reg.observacoes    || null,
    };

    // ── Computadores ─────────────────────────────────────────────────
    if (categoria === 'computadores') {
        const memoriaRAM      = extrairIndexados('ram_slot_').filter(Boolean);
        const conectoresVideo = extrairIndexados('conector_video_').filter(Boolean);

        const discos = [];
        let i = 0;
        while (reg[`disco_tipo_${i}`] !== undefined) {
            discos.push({
                tipo:    reg[`disco_tipo_${i}`]              || 'HDD',
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

        return {
            ...base,
            modelo:                    reg.Modelo              || reg.modelo              || '',
            tipo:                      reg.Tipo                || reg.tipo                || '',
            processadorId:             reg.ProcessadorId       || reg.processadorId       || null,
            geracaoRAM:                reg.GeracaoRAM          || reg.geracaoRAM          || null,
            quantidadeSlots:           memoriaRAM.length       || toInt(reg.QuantidadeSlots    ?? reg.quantidadeSlots    ?? 0),
            memoriaRAM,
            memoriaRAMTotal:           toInt(reg.MemoriaRAMTotal  ?? reg.memoriaRAMTotal  ?? 0),
            velocidadeRAM:             toInt(reg.VelocidadeRAM    ?? reg.velocidadeRAM    ?? 0),
            quantidadeDiscos:          discos.length           || toInt(reg.QuantidadeDiscos   ?? reg.quantidadeDiscos   ?? 0),
            discos,
            quantidadePlacasVideo:     placasVideo.length      || toInt(reg.QuantidadePlacasVideo ?? reg.quantidadePlacasVideo ?? 0),
            placasVideo,
            quantidadeConectoresVideo: conectoresVideo.length  || toInt(reg.QuantidadeConectoresVideo ?? reg.quantidadeConectoresVideo ?? 0),
            conectoresVideo,
            sistemaOperacional:        reg.SistemaOperacional  || reg.sistemaOperacional  || null,
            ativacaoSO:                reg.AtivacaoSO          || reg.ativacaoSO          || null,
            office:                    reg.Office              || reg.office              || null,
            ativacaoOffice:            reg.AtivacaoOffice      || reg.ativacaoOffice      || null,
            ip:                        reg.IP                  || reg.ip                  || null,
        };
    }

    // ── Celulares ────────────────────────────────────────────────────
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

    // ── Monitores ────────────────────────────────────────────────────
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

    // ── Mouses ───────────────────────────────────────────────────────
    if (categoria === 'mouses') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            tipo:          reg.Tipo          || reg.tipo          || null,
            conectividade: reg.Conectividade || reg.conectividade || null,
        };
    }

    // ── Teclados ─────────────────────────────────────────────────────
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

    // ── Fones ────────────────────────────────────────────────────────
    if (categoria === 'fones') {
        return {
            ...base,
            modelo:        reg.Modelo        || reg.modelo        || '',
            tipo:          reg.Tipo          || reg.tipo          || null,
            microfone:     toBool(reg.Microfone    ?? reg.microfone    ?? false),
            conectividade: reg.Conectividade || reg.conectividade || null,
        };
    }

    // ── Ramais ───────────────────────────────────────────────────────
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

    // ── Chips ────────────────────────────────────────────────────────
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

    // ── Extras ───────────────────────────────────────────────────────
    if (categoria === 'extras') {
        return {
            ...base,
            categoria: reg.Categoria || reg.categoria || '',
            descricao: reg.Descricao || reg.descricao || null,
        };
    }

    // Fallback: devolve o registro com apenas a base corrigida
    return { ...base, ...reg };
}

/**
 * Remove campos de ID do registro antes de enviar ao backend via POST.
 * Garante que o backend gere um novo ID ao criar o registro,
 * assim como acontece na criação normal pela UI.
 *
 * @param   {Object} reg Registro bruto do CSV/XLSX
 * @returns {Object}     Registro sem campos de ID
 */
function _sanitizarRegistro(reg) {
    const ID_KEYS = new Set(['_id', 'id', 'Id', 'ID', '_Id', '_ID']);
    return Object.fromEntries(
        Object.entries(reg).filter(([k]) => !ID_KEYS.has(k))
    );
}

/**
 * Normaliza um valor de campo para string legível,
 * tratando objetos aninhados e arrays (padrão da API do projeto).
 *
 * Ex: [{ nome: 'DDR4' }, { nome: 'DDR5' }] → "DDR4 | DDR5"
 *
 * @param {*} val Valor a normalizar
 * @returns {string}
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
 * Usado internamente nas funções de exportação XLSX.
 *
 * @param   {Object[]} arr Array de objetos da API
 * @returns {{ headers: string[], rows: string[][] }}
 */
function _matriceDeObjetos(arr) {
    if (!arr || arr.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(arr[0]);
    const rows    = arr.map(item => headers.map(h => _flattenValue(item[h])));
    return { headers, rows };
}

/**
 * Dispara o download de um Blob com o nome de arquivo informado.
 * Cria e clica em um link <a> temporário, depois revoga a URL.
 *
 * @param {Blob}   blob     Conteúdo do arquivo
 * @param {string} filename Nome do arquivo para download
 */
function _downloadBlob(blob, filename) {
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    // Libera memória após 5 s (tempo suficiente para o download iniciar)
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Carrega um script externo dinamicamente, evitando duplicatas.
 * Usado para carregar SheetJS apenas quando necessário (exportação/importação XLSX).
 *
 * @param   {string}   src URL do script
 * @returns {Promise<void>}
 */
function _carregarScript(src) {
    return new Promise((resolve, reject) => {
        // Se já foi carregado anteriormente, resolve imediatamente
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s   = document.createElement('script');
        s.src     = src;
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
