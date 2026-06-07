// =============================================================================
// sidebar.js — Sidebar compartilhada entre todas as telas
// =============================================================================

(function () {

    // ── TEMA: aplica IMEDIATAMENTE (antes do paint) ───────────────────────────
    // Isso evita o flash branco ao trocar de página
    (function aplicarTemaImediato() {
        if (localStorage.getItem('tl_theme') === 'dark') {
            document.documentElement.classList.add('dark-early');
            // move para body assim que disponível
            const mover = () => {
                document.body.classList.add('dark');
                document.documentElement.classList.remove('dark-early');
            };
            if (document.body) mover();
            else document.addEventListener('DOMContentLoaded', mover);
        }
    })();

    // ── HTML DA SIDEBAR ───────────────────────────────────────────────────────
    const SIDEBAR_HTML = `
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<div class="sidebar" id="sidebar">
    <button id="toggleSidebar" class="toggle-btn">
        <i class="fa-solid fa-angles-left icon-close"></i>
        <i class="fa-solid fa-angles-right icon-open"></i>
    </button>
    <div class="sidebar-brand">
        <img src="novatech-logo.png" alt="NovaTech Solutions" style="height:36px;width:auto;">
        <h2>NovaTech Solutions</h2>
    </div>
    <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="sidebarSearch" placeholder="Buscar..." autocomplete="off">
        <i class="fa-solid fa-xmark clear-btn"></i>
    </div>
    <ul class="menu">
        <li><a data-tooltip="Dashboard" href="dashboard.html"><i class="material-icons" style="font-size:18px">dashboard</i><span>Dashboard</span></a></li>
        <li><a data-tooltip="Inventário" href="estoque.html"><i class="fa-solid fa-box-archive"></i><span>Inventário</span></a></li>
        <li><a data-tooltip="Produtos" href="produtos.html"><i class="fa-solid fa-tag"></i><span>Produtos</span></a></li>
        <li><a data-tooltip="Relatórios" href="relatorios.html"><i class="fa-solid fa-file-lines"></i><span>Relatórios</span></a></li>
        <li><a data-tooltip="Configurações" href="configuracoes.html"><i class="fa-solid fa-gear"></i><span>Configurações</span></a></li>
    </ul>
    <div class="sidebar-footer">
        <span>v1.0</span>
        <a href="login.html" class="btn-logout" id="sidebarLogout"><i class="fa-solid fa-right-from-bracket"></i> Sair</a>
    </div>
</div>`;

    // ── INJETA A SIDEBAR NO CONTAINER ─────────────────────────────────────────
    function injetar() {
        const container = document.getElementById('sidebar-container');
        if (!container) return;
        container.innerHTML = SIDEBAR_HTML;
    }

    // ── MARCA O ITEM ATIVO NO MENU ────────────────────────────────────────────
    function marcarAtivo() {
        const pagina = (window.location.pathname.split('/').pop() || '').split('?')[0] || 'dashboard.html';
        document.querySelectorAll('.menu li a').forEach(link => {
            if (link.getAttribute('href') === pagina) {
                link.parentElement.classList.add('active');
            }
        });
    }

    // ── TOGGLE DA SIDEBAR (DESKTOP) ───────────────────────────────────────────
    function setupToggle() {
        const btn     = document.getElementById('toggleSidebar');
        const sidebar = document.getElementById('sidebar');
        if (!btn || !sidebar) return;

        btn.addEventListener('click', () => {
            const fechando = !sidebar.classList.contains('closed');
            if (fechando) {
                sidebar.classList.add('collapsing');
                sidebar.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName !== 'width') return;
                    sidebar.classList.remove('collapsing');
                    sidebar.classList.add('closed');
                    sidebar.removeEventListener('transitionend', handler);
                });
            } else {
                sidebar.classList.remove('closed');
            }
        });
    }

    // ── BUSCA NA SIDEBAR ──────────────────────────────────────────────────────
    function setupBusca() {
        const input    = document.getElementById('sidebarSearch');
        const clearBtn = document.querySelector('#sidebar .clear-btn');
        if (!input) return;

        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            document.querySelectorAll('.menu li').forEach(li => {
                li.style.display = (!q || li.textContent.toLowerCase().includes(q)) ? '' : 'none';
            });
        });

        clearBtn?.addEventListener('click', () => {
            input.value = '';
            document.querySelectorAll('.menu li').forEach(li => li.style.display = '');
        });
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    function setupLogout() {
        const btn = document.getElementById('sidebarLogout');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('tl_token');
            localStorage.removeItem('tl_user');
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = 'login.html';
        });
    }

    // ── TEMA (botão dark/light no header) ─────────────────────────────────────
    function setupTema() {
        const saved = localStorage.getItem('tl_theme') || 'light';
        const btn   = document.getElementById('themeToggle');
        if (!btn) return;

        if (saved === 'light') btn.classList.add('light');

        btn.addEventListener('click', () => {
            const escuro = document.body.classList.toggle('dark');
            btn.classList.toggle('light', !escuro);
            localStorage.setItem('tl_theme', escuro ? 'dark' : 'light');
        });
    }

    // ── AVATAR E NOME DO USUÁRIO ──────────────────────────────────────────────
    function setupUsuario() {
        try {
            const u = JSON.parse(localStorage.getItem('tl_user') || '{}');
            if (!u.nome) return;

            const inicial = u.nome.charAt(0).toUpperCase();

            const avatar = document.getElementById('userAvatar');
            if (avatar) avatar.textContent = inicial;

            const greeting = document.getElementById('greeting-name');
            if (greeting) greeting.textContent = u.nome.split(' ')[0];

            const pdName = document.getElementById('pdName');
            if (pdName) pdName.textContent = `${u.nome} ${u.sobrenome || ''}`.trim();
        } catch (_) {}
    }

    // ── OVERLAY MOBILE ────────────────────────────────────────────────────────
    function setupOverlay() {
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.getElementById('sidebar');
        if (!overlay || !sidebar) return;

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open', 'open');
            overlay.classList.remove('active', 'open');
        });
    }

    // ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        injetar();
        marcarAtivo();
        setupToggle();
        setupBusca();
        setupLogout();
        setupTema();
        setupUsuario();
        setupOverlay();
    });

})();
