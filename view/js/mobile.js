/* mobile.js — Lógica responsiva compartilhada */

/** Abre/fecha sidebar em mobile */
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    } else {
        // Em desktop (>= 1024px) usa o comportamento original de collapsed
        if (window.innerWidth >= 1024) {
            sidebar.classList.toggle('closed');
        } else {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('open');
        }
    }
}

/** Fecha sidebar ao clicar no overlay */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Fecha sidebar ao navegar em mobile
    document.querySelectorAll('.menu li a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('sidebarOverlay')?.classList.remove('open');
            }
        });
    });

    // Fecha sidebar ao redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebarOverlay')?.classList.remove('open');
        }
    });

    // Redireciona o toggleSidebar original para a função mobile em telas pequenas
    const originalToggle = document.getElementById('toggleSidebar');
    if (originalToggle) {
        // Remove listeners originais e substitui pelo nosso em mobile
        const newToggle = originalToggle.cloneNode(true);
        originalToggle.parentNode.replaceChild(newToggle, originalToggle);
        newToggle.addEventListener('click', toggleMobileSidebar);
    }
});
