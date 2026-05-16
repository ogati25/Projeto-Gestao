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
 *
 *  O que NÃO está aqui (fica no <script> do produtos.html):
 *   - Renderização da tabela / cards de enum
 *   - Abertura/fechamento de modais
 *   - Eventos de clique, input, teclado
 *   - Toast / feedback visual
 *   - Tema, sidebar, avatar
 * ============================================================
 */

const Produtos = (() => {

    // ============================================================
    //  ESTADO INTERNO
    //  enumData = { Setor: ['RH','Suporte',...], Tipo: [...], ... }
    // ============================================================
    let enumData = {};

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
        // deep copy para o frontend não mutar o estado diretamente
        return JSON.parse(JSON.stringify(enumData));
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

        // Verifica duplicata no estado local antes de ir à API
        const valoresAtuais = enumData[tipo] || [];
        const jaExiste = valoresAtuais.some(v => v.toLowerCase() === valor.toLowerCase());
        if (jaExiste) {
            return { ok: false, mensagem: `"${valor}" já existe em "${tipo}".` };
        }

        try {
            await criarOpcao(tipo, valor); // função de api.js

            // Atualiza estado local
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

            // Atualiza estado local
            if (enumData[tipo]) {
                enumData[tipo] = enumData[tipo].filter(v => v !== valor);
                // Se o tipo ficou vazio, remove o grupo também
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

        // Verifica se o tipo já existe localmente
        if (enumData.hasOwnProperty(tipo)) {
            return { ok: false, mensagem: `O tipo "${tipo}" já existe. Use "Adicionar valor" no card correspondente.` };
        }

        try {
            await criarOpcao(tipo, valor); // função de api.js — cria tipo + valor de uma vez

            // Atualiza estado local
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
        adicionarValor,
        deletarValor,
        adicionarTipo,
    };

})();
