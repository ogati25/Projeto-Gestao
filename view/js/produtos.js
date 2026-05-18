/**
 * ============================================================
 *  PRODUTOS — SCRIPT DE BACKEND
 * ============================================================
 *  Responsabilidade: dados, lógica de domínio e comunicação
 *  com a API C# (OpcaoEnumController em /api/opcoes).
 *
 *  Depende de: api.js (funções getOpcoes, criarOpcao, deletarOpcao)
 *
 *  Funções expostas para o frontend (produtos.html):
 *   - Produtos.carregarEnums()         → busca todos os enums agrupados
 *   - Produtos.adicionarValor()        → POST novo valor (tipo existente ou novo)
 *   - Produtos.deletarValor()          → DELETE valor de um tipo
 *   - Produtos.adicionarTipo()         → POST tipo novo com primeiro valor
 *   - Produtos.getState()              → retorna o estado atual em memória
 *   - Produtos.getClasses()            → retorna a lista de classes com metadados
 *   - Produtos.getEnumsDaClasse()      → retorna os enums filtrados de uma classe
 *
 *  O que NÃO está aqui (fica no <script> do produtos.html):
 *   - Renderização dos cards de classe
 *   - Abertura/fechamento de modais
 *   - Eventos de clique, input, teclado
 *   - Toast / feedback visual
 *   - Tema, sidebar, avatar
 *   - Navegação para produto-detalhe.html
 * ============================================================
 */

const Produtos = (() => {

    // ============================================================
    //  ESTADO INTERNO
    //  enumData = { Setor: ['RH','Suporte',...], Tipo: [...], ... }
    // ============================================================
    let enumData = {};

    // ============================================================
    //  MAPEAMENTO: CLASSE → ENUMS DINÂMICOS
    //
    //  Cada entrada representa uma "classe" do sistema.
    //  - id         : identificador único usado na URL (?classe=id)
    //  - nome       : nome exibido no card
    //  - descricao  : subtítulo do card
    //  - icone      : classe Font Awesome
    //  - cor        : cor do ícone do card (classe CSS cc-*)
    //  - enums      : lista dos tipos dinâmicos (chaves do enumData)
    //                 que pertencem a esta classe
    //
    //  'Base' é especial: agrupa os enums comuns a todos os equipamentos.
    //  Classes sem enums dinâmicos aparecem como cards informativos
    //  e têm enums: [] — ao abrir mostram aviso de "sem configurações".
    //
    //  ── ENUMS MIGRADOS DE FIXOS PARA DINÂMICOS ──────────────────
    //  Os seguintes tipos foram enums C# estáticos e agora vivem no
    //  banco (OpcoesEnum). Precisam ser populados via tela Produtos
    //  antes de usar os formulários de cadastro:
    //
    //    Base        → Status
    //    Computador  → TipoComputador, TipoMemoriaRAM, TipoConectorVideo
    //    Celular     → TipoConectorCarregador
    //    Periférico  → TipoPeriferico, Conectividade, Switch
    //    Monitor     → Resolucao
    // ============================================================
    const CLASSES = [
        {
            id:         'base',
            nome:       'Base',
            descricao:  'Campos comuns a todos os equipamentos',
            icone:      'fa-layer-group',
            cor:        'slate',
            enums:      [
                'Setor',
                'Status',           // era enum Status (EmUso, EmEstoque, Desativado...)
            ],
        },
        {
            id:         'computador',
            nome:       'Computador',
            descricao:  'Desktops, notebooks e servidores',
            icone:      'fa-computer',
            cor:        'blue',
            enums:      [
                'TipoComputador',   // era enum TipoComputador (PC_Desktop, Notebook, All_in_One)
                'GeracaoRAM',
                'TipoMemoriaRAM',   // era enum TipoMemoriaRAM (GB4=4, GB8=8 ...) — valores: "4GB","8GB"...
                'SistemaOperacional',
                'AtivacaoSO',
                'TipoOffice',
                'AtivacaoOffice',
                'TipoDisco',
                'TipoPlacaVideo',
                'TipoConectorVideo', // era enum TipoConectorVideo (HDMI, DisplayPort, VGA, DVI)
            ],
        },
        {
            id:         'chip',
            nome:       'Chip',
            descricao:  'Chips de telefonia e dados',
            icone:      'fa-sim-card',
            cor:        'green',
            enums:      [
                'Operadora',
            ],
        },
        {
            id:         'celular',
            nome:       'Celular',
            descricao:  'Smartphones corporativos',
            icone:      'fa-mobile-screen',
            cor:        'indigo',
            enums:      [
                'TipoConectorCarregador', // era enum TipoConectorCarregador (USB_C, Lightning...)
            ],
        },
        {
            id:         'monitor',
            nome:       'Monitor',
            descricao:  'Monitores e displays',
            icone:      'fa-display',
            cor:        'cyan',
            enums:      [
                'Resolucao',        // era enum Resolucao (HD, FHD, QHD, UHD4K)
            ],
        },
        {
            id:         'mouse',
            nome:       'Mouse',
            descricao:  'Mouses corporativos e gamer',
            icone:      'fa-computer-mouse',
            cor:        'violet',
            enums:      [
                'TipoPeriferico',   // Gamer, Escritorio
                'Conectividade',    // Bluetooth, Cabo, USB, TriMode
            ],
        },
        {
            id:         'teclado',
            nome:       'Teclado',
            descricao:  'Teclados mecânicos e de membrana',
            icone:      'fa-keyboard',
            cor:        'purple',
            enums:      [
                'TipoPeriferico',   // Gamer, Escritorio
                'Conectividade',    // Bluetooth, Cabo, USB, TriMode
                'Switch',           // Red, Blue, Brown...
            ],
        },
        {
            id:         'fone',
            nome:       'Fone de Ouvido',
            descricao:  'Headsets e fones corporativos',
            icone:      'fa-headphones',
            cor:        'pink',
            enums:      [
                'TipoPeriferico',   // Gamer, Escritorio
                'Conectividade',    // Bluetooth, Cabo, USB, TriMode
            ],
        },
        {
            id:         'ramal',
            nome:       'Ramal',
            descricao:  'Ramais telefônicos',
            icone:      'fa-phone',
            cor:        'orange',
            enums:      [],
        },
        {
            id:         'extra',
            nome:       'Extra',
            descricao:  'Equipamentos e acessórios diversos',
            icone:      'fa-box-open',
            cor:        'amber',
            enums:      [],
        },
    ];

    // ============================================================
    //  SEÇÃO 1 — LEITURA
    // ============================================================

    /**
     * Busca todos os enums agrupados da API e armazena no estado.
     * @returns {Promise<Object>} dicionário { tipo: [valores] }
     */
    async function carregarEnums() {
        enumData = await getOpcoes(); // função de api.js
        return enumData;
    }

    /**
     * Retorna uma cópia do estado atual (somente leitura para o frontend).
     * @returns {Object}
     */
    function getState() {
        return JSON.parse(JSON.stringify(enumData));
    }

    /**
     * Retorna a lista de classes com metadados enriquecidos
     * (quantidade de enums e total de opções calculados em tempo real).
     * @returns {Array}
     */
    function getClasses() {
        return CLASSES.map(cls => {
            const totalOpcoes = cls.enums.reduce((soma, tipo) => {
                return soma + (enumData[tipo] ? enumData[tipo].length : 0);
            }, 0);
            return {
                ...cls,
                totalEnums:  cls.enums.length,
                totalOpcoes,
            };
        });
    }

    /**
     * Retorna somente os enums dinâmicos de uma classe específica,
     * filtrando o enumData pelo mapeamento da classe.
     * @param {string} classeId  - Ex: "computador"
     * @returns {Object}  { SistemaOperacional: [...], AtivacaoSO: [...], ... }
     */
    function getEnumsDaClasse(classeId) {
        const cls = CLASSES.find(c => c.id === classeId);
        if (!cls) return {};
        const resultado = {};
        for (const tipo of cls.enums) {
            resultado[tipo] = enumData[tipo] ? [...enumData[tipo]] : [];
        }
        return resultado;
    }

    /**
     * Retorna os metadados de uma classe pelo id.
     * @param {string} classeId
     * @returns {Object|null}
     */
    function getClasse(classeId) {
        return CLASSES.find(c => c.id === classeId) || null;
    }

    // ============================================================
    //  SEÇÃO 2 — ESCRITA: VALOR
    // ============================================================

    /**
     * Adiciona um novo valor a um tipo existente.
     * @param {string} tipo  - Ex: "Setor"
     * @param {string} valor - Ex: "Financeiro"
     * @returns {Promise<{ok: boolean, mensagem: string}>}
     */
    async function adicionarValor(tipo, valor) {
        tipo  = (tipo  || '').trim();
        valor = (valor || '').trim();

        if (!tipo || !valor) {
            return { ok: false, mensagem: 'Tipo e valor são obrigatórios.' };
        }

        const valoresAtuais = enumData[tipo] || [];
        const jaExiste = valoresAtuais.some(v => v.toLowerCase() === valor.toLowerCase());
        if (jaExiste) {
            return { ok: false, mensagem: `"${valor}" já existe em "${tipo}".` };
        }

        try {
            await criarOpcao(tipo, valor); // função de api.js

            if (!enumData[tipo]) enumData[tipo] = [];
            enumData[tipo].push(valor);
            enumData[tipo].sort((a, b) => a.localeCompare(b, 'pt-BR'));

            return { ok: true, mensagem: `"${valor}" adicionado a "${tipo}" com sucesso.` };
        } catch (err) {
            if (err.status === 409) {
                return { ok: false, mensagem: `"${valor}" já existe em "${tipo}".` };
            }
            return { ok: false, mensagem: 'Erro ao comunicar com o servidor. Tente novamente.' };
        }
    }

    /**
     * Remove um valor de um tipo.
     * @param {string} tipo
     * @param {string} valor
     * @returns {Promise<{ok: boolean, mensagem: string}>}
     */
    async function deletarValor(tipo, valor) {
        tipo  = (tipo  || '').trim();
        valor = (valor || '').trim();

        if (!tipo || !valor) {
            return { ok: false, mensagem: 'Tipo e valor são obrigatórios.' };
        }

        try {
            await deletarOpcao(tipo, valor); // função de api.js

            if (enumData[tipo]) {
                enumData[tipo] = enumData[tipo].filter(v => v !== valor);
                if (enumData[tipo].length === 0) {
                    delete enumData[tipo];
                }
            }

            return { ok: true, mensagem: `"${valor}" removido de "${tipo}".` };
        } catch (err) {
            if (err.status === 404) {
                return { ok: false, mensagem: `"${valor}" não encontrado em "${tipo}".` };
            }
            return { ok: false, mensagem: 'Erro ao comunicar com o servidor. Tente novamente.' };
        }
    }

    // ============================================================
    //  SEÇÃO 3 — ESCRITA: TIPO NOVO
    // ============================================================

    /**
     * Cria um tipo completamente novo com seu primeiro valor.
     * O backend cria o tipo implicitamente ao inserir o primeiro valor.
     * @param {string} tipo  - Nome do novo tipo (ex: "SistemaOperacional")
     * @param {string} valor - Primeiro valor do novo tipo (ex: "Windows 11")
     * @returns {Promise<{ok: boolean, mensagem: string}>}
     */
    async function adicionarTipo(tipo, valor) {
        tipo  = (tipo  || '').trim();
        valor = (valor || '').trim();

        if (!tipo) {
            return { ok: false, mensagem: 'O nome do tipo é obrigatório.' };
        }
        if (!valor) {
            return { ok: false, mensagem: 'O primeiro valor é obrigatório.' };
        }

        if (enumData.hasOwnProperty(tipo)) {
            return { ok: false, mensagem: `O tipo "${tipo}" já existe. Use "Adicionar valor" no card correspondente.` };
        }

        try {
            await criarOpcao(tipo, valor);
            enumData[tipo] = [valor];
            return { ok: true, mensagem: `Tipo "${tipo}" criado com valor "${valor}".` };
        } catch (err) {
            if (err.status === 409) {
                return { ok: false, mensagem: `O tipo "${tipo}" com valor "${valor}" já existe.` };
            }
            return { ok: false, mensagem: 'Erro ao comunicar com o servidor. Tente novamente.' };
        }
    }

    // ============================================================
    //  API PÚBLICA
    // ============================================================
    return {
        carregarEnums,
        getState,
        getClasses,
        getClasse,
        getEnumsDaClasse,
        adicionarValor,
        deletarValor,
        adicionarTipo,
    };

})();
