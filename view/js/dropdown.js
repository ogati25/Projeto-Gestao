/**
 * dropdown.js — Dropdowns customizados reutilizáveis
 *
 * Substitui <select> nativos por dropdowns estilizados consistentes em todo o sistema.
 * Estilos definidos em style.css (.cd-*)
 *
 * API pública:
 *   criarCustomDropdown(name, options, valor, placeholder, onChange)
 *   criarCustomDropdownMulti(name, options, valores, placeholder, onApply)
 *   substituirSelect(selectEl, onChange)
 *   initAllSelects(container)
 */

(function (global) {

    /* ─── Fecha todos os painéis abertos (exceto o passado) ──────────── */
    function fecharTodos(exceto) {
        document.querySelectorAll('.cd-panel.open').forEach(p => {
            if (p !== exceto) {
                p.classList.remove('open');
                // Trigger é o primeiro filho do cd-wrap (pai do painel)
                const wrap = p.parentElement;
                if (wrap) {
                    const trigger = wrap.querySelector('.cd-trigger');
                    if (trigger) trigger.classList.remove('open');
                }
            }
        });
    }

    document.addEventListener('click', () => fecharTodos(null));

    /* ─── Toggle de painel ───────────────────────────────────────────── */
    function togglePanel(trigger, panel) {
        const isOpen = panel.classList.contains('open');
        fecharTodos(null);
        if (!isOpen) {
            panel.classList.add('open');
            trigger.classList.add('open');
            const search = panel.querySelector('.cd-search input');
            if (search) setTimeout(() => search.focus(), 50);
        }
    }

    /* ─── Renderiza opções filtradas (seleção única) ─────────────────── */
    function renderOpcoes(listEl, options, valorAtual, placeholder, onSelect, filtro = '', simples = false) {
        listEl.innerHTML = '';

        // Opção vazia/placeholder (apenas no modo completo)
        if (!simples && placeholder) {
            const pOpt = document.createElement('div');
            pOpt.className = 'cd-option cd-placeholder-opt' + (valorAtual === '' ? ' cd-selected' : '');
            pOpt.textContent = placeholder;
            pOpt.addEventListener('click', e => { e.stopPropagation(); onSelect('', placeholder, true); });
            listEl.appendChild(pOpt);
        }

        const filtrados = filtro
            ? options.filter(o => {
                const lbl = typeof o === 'object' ? o.label : String(o);
                return lbl.toLowerCase().includes(filtro.toLowerCase());
            })
            : options;

        if (filtrados.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cd-empty';
            empty.textContent = 'Nenhuma opção encontrada';
            listEl.appendChild(empty);
            return;
        }

        filtrados.forEach(opt => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            const item = document.createElement('div');
            item.className = 'cd-option' + (value === valorAtual ? ' cd-selected' : '');
            item.textContent = label;
            item.dataset.value = value;
            item.addEventListener('click', e => { e.stopPropagation(); onSelect(value, label, false); });
            listEl.appendChild(item);
        });
    }

    /* ─── Seleção única ──────────────────────────────────────────────── */
    function criarCustomDropdown(name, options, valor = '', placeholder = '— Selecione —', onChange = null, simples = false) {
        const wrap = document.createElement('div');
        wrap.className = 'cd-wrap';
        wrap.dataset.cdName = name;

        // Estado interno
        let valorAtual = valor;

        // Trigger
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cd-trigger';

        const labelSpan = document.createElement('span');
        const chevron = document.createElement('i');
        chevron.className = 'fa-solid fa-chevron-down cd-chevron';
        trigger.appendChild(labelSpan);
        trigger.appendChild(chevron);

        // Input hidden para manter compatibilidade com coleta de formulário
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = name;
        hidden.value = valor;

        // Panel
        const panel = document.createElement('div');
        panel.className = simples ? 'cd-panel cd-panel--up' : 'cd-panel';

        // Search (apenas no modo completo)
        let searchInput = null;
        if (!simples) {
            const searchWrap = document.createElement('div');
            searchWrap.className = 'cd-search';
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Pesquisar…';
            searchWrap.appendChild(searchInput);
            panel.appendChild(searchWrap);
        }

        // List
        const listEl = document.createElement('div');
        listEl.className = 'cd-list';
        panel.appendChild(listEl);

        // Atualiza label do trigger
        function atualizarLabel(value, label, isPlaceholder) {
            labelSpan.textContent = label;
            labelSpan.className = isPlaceholder ? 'cd-placeholder' : '';
        }

        // Callback de seleção
        function onSelect(value, label, isPlaceholder) {
            valorAtual = value;
            hidden.value = value;
            atualizarLabel(value, label, isPlaceholder);
            panel.classList.remove('open');
            trigger.classList.remove('open');
            if (searchInput) searchInput.value = '';
            const ph = simples ? null : placeholder;
            renderOpcoes(listEl, options, valorAtual, ph, onSelect, '', simples);
            if (onChange) onChange(value, label);
            // Dispara evento 'change' no hidden para compatibilidade
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Label inicial
        const optInicial = options.find(o => (typeof o === 'object' ? o.value : o) === valor);
        if (optInicial) {
            const lbl = typeof optInicial === 'object' ? optInicial.label : optInicial;
            atualizarLabel(valor, lbl, false);
        } else {
            atualizarLabel('', placeholder, true);
        }

        // Renderiza inicial
        renderOpcoes(listEl, options, valorAtual, simples ? null : placeholder, onSelect, '', simples);

        // Eventos
        trigger.addEventListener('click', e => { e.stopPropagation(); togglePanel(trigger, panel); });
        if (searchInput) {
            searchInput.addEventListener('input', () => renderOpcoes(listEl, options, valorAtual, placeholder, onSelect, searchInput.value));
            searchInput.addEventListener('click', e => e.stopPropagation());
        }
        panel.addEventListener('click', e => e.stopPropagation());

        // API pública no elemento
        wrap.getValue = () => valorAtual;
        wrap.setValue = (v) => {
            const opt = options.find(o => (typeof o === 'object' ? o.value : o) === v);
            if (opt) {
                const lbl = typeof opt === 'object' ? opt.label : opt;
                onSelect(v, lbl, false);
            } else {
                onSelect('', placeholder, true);
            }
        };
        wrap.setOptions = (newOptions, newValor = '') => {
            options = newOptions;
            valorAtual = newValor;
            hidden.value = newValor;
            const opt = newOptions.find(o => (typeof o === 'object' ? o.value : o) === newValor);
            if (opt) {
                const lbl = typeof opt === 'object' ? opt.label : opt;
                atualizarLabel(newValor, lbl, false);
            } else {
                atualizarLabel('', placeholder, true);
            }
            renderOpcoes(listEl, options, valorAtual, placeholder, onSelect);
        };

        wrap.appendChild(trigger);
        wrap.appendChild(hidden);
        wrap.appendChild(panel);
        return wrap;
    }

    /* ─── Seleção múltipla (com checkbox) ───────────────────────────── */
    function criarCustomDropdownMulti(name, options, valores = [], placeholder = '— Selecione —', onApply = null) {
        const wrap = document.createElement('div');
        wrap.className = 'cd-wrap';
        wrap.dataset.cdName = name;

        let selecionados = new Set(valores.map(String));

        // Trigger
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cd-trigger';
        const labelSpan = document.createElement('span');
        const chevron = document.createElement('i');
        chevron.className = 'fa-solid fa-chevron-down cd-chevron';
        trigger.appendChild(labelSpan);
        trigger.appendChild(chevron);

        function atualizarLabel() {
            if (selecionados.size === 0) {
                labelSpan.textContent = placeholder;
                labelSpan.className = 'cd-placeholder';
            } else {
                labelSpan.textContent = `${selecionados.size} selecionado(s)`;
                labelSpan.className = '';
            }
        }
        atualizarLabel();

        // Panel
        const panel = document.createElement('div');
        panel.className = 'cd-panel';

        // Search
        const searchWrap = document.createElement('div');
        searchWrap.className = 'cd-search';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Pesquisar…';
        searchWrap.appendChild(searchInput);
        panel.appendChild(searchWrap);

        // List
        const listEl = document.createElement('div');
        listEl.className = 'cd-list';
        panel.appendChild(listEl);

        function renderMulti(filtro = '') {
            listEl.innerHTML = '';
            const filtrados = filtro
                ? options.filter(o => {
                    const lbl = typeof o === 'object' ? o.label : String(o);
                    return lbl.toLowerCase().includes(filtro.toLowerCase());
                })
                : options;

            if (filtrados.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'cd-empty';
                empty.textContent = 'Nenhuma opção encontrada';
                listEl.appendChild(empty);
                return;
            }

            filtrados.forEach(opt => {
                const value = String(typeof opt === 'object' ? opt.value : opt);
                const label = typeof opt === 'object' ? opt.label : opt;
                const item = document.createElement('div');
                item.className = 'cd-option';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = selecionados.has(value);
                cb.addEventListener('change', e => {
                    e.stopPropagation();
                    if (cb.checked) selecionados.add(value);
                    else selecionados.delete(value);
                });
                const lbl = document.createElement('span');
                lbl.textContent = label;
                item.appendChild(cb);
                item.appendChild(lbl);
                item.addEventListener('click', e => {
                    e.stopPropagation();
                    cb.checked = !cb.checked;
                    if (cb.checked) selecionados.add(value);
                    else selecionados.delete(value);
                });
                listEl.appendChild(item);
            });
        }

        renderMulti();

        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'cd-apply';
        applyBtn.textContent = 'Aplicar';
        applyBtn.addEventListener('click', e => {
            e.stopPropagation();
            atualizarLabel();
            panel.classList.remove('open');
            trigger.classList.remove('open');
            if (onApply) onApply([...selecionados]);
        });
        panel.appendChild(applyBtn);

        // Eventos
        trigger.addEventListener('click', e => { e.stopPropagation(); togglePanel(trigger, panel); });
        searchInput.addEventListener('input', () => renderMulti(searchInput.value));
        searchInput.addEventListener('click', e => e.stopPropagation());
        panel.addEventListener('click', e => e.stopPropagation());

        wrap.getValues = () => [...selecionados];
        wrap.setValues = (vals) => { selecionados = new Set(vals.map(String)); atualizarLabel(); renderMulti(); };

        wrap.appendChild(trigger);
        wrap.appendChild(panel);
        return wrap;
    }

    /* ─── Substitui um <select> existente no DOM ─────────────────────── */
    function substituirSelect(selectEl, onChange = null, simples = false) {
        const name = selectEl.name || selectEl.id || '';
        const options = [];
        let valorAtual = selectEl.value;
        let placeholder = '— Selecione —';

        Array.from(selectEl.options).forEach(opt => {
            if (opt.value === '') { placeholder = opt.textContent; return; }
            options.push({ value: opt.value, label: opt.textContent.trim() });
        });

        // Copia classes e id do select original
        const cd = criarCustomDropdown(name, options, valorAtual, placeholder, onChange, simples);
        if (selectEl.id) cd.dataset.originalId = selectEl.id;
        if (selectEl.className) cd.classList.add(...selectEl.className.split(' ').filter(Boolean));

        // Mantém style inline se houver
        if (selectEl.style.cssText) cd.style.cssText = selectEl.style.cssText;

        selectEl.parentNode.replaceChild(cd, selectEl);
        return cd;
    }

    /* ─── Inicializa todos os <select> dentro de um container ────────── */
    function initAllSelects(container = document, onChange = null) {
        container.querySelectorAll('select:not([data-cd-skip])').forEach(sel => {
            substituirSelect(sel, onChange);
        });
    }

    /* ─── Substitui criarSelect do estoque.js ────────────────────────── */
    // Sobrescreve a função global criarSelect para usar o dropdown customizado
    global.criarSelectCustom = criarCustomDropdown;

    // Exporta funções globalmente
    global.criarCustomDropdown     = criarCustomDropdown;
    global.criarCustomDropdownMulti = criarCustomDropdownMulti;
    global.substituirSelect        = substituirSelect;
    global.initAllSelects          = initAllSelects;

})(window);
