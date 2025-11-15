// Verbesserte Modalsteuerung mit leichter UX-Optimierung

function openModal() {
    const modal = document.getElementById('login-modal');
    const sidebar = document.getElementById('sidebar');

    if (!modal) return;

    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Fokus in Formular setzen (UX Upgrade)
    const firstInput = modal.querySelector('input, button');
    if (firstInput) firstInput.focus();
}

function closeModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.style.overflow = '';
}


/* ------- Analysen dynamisch laden ------- */
function createAnalysisArticle(analysis) {
    return `
        <article class="transform transition duration-300">
            <div class="h-40 mb-4 overflow-hidden rounded-lg">
                <img src="${analysis.image}" alt="${analysis.title}"
                     class="w-full h-full object-cover transition-transform duration-400 hover:scale-105">
            </div>
            
            <p class="text-xs font-bold text-gray-700 uppercase mb-2">${analysis.category}</p>

            <h4 class="text-lg font-semibold text-gray-900 mb-2">${analysis.title}</h4>

            <p class="text-sm text-gray-600 mb-4">${analysis.summary}</p>

            <a href="${analysis.link}" class="text-accent-blue hover:text-blue-700 font-medium text-sm flex items-center">
                Vorschau lesen →
            </a>
        </article>
    `;
}

async function loadAndRenderAnalyses() {
    const container = document.getElementById('analysis-grid');
    if (!container) return;

    try {
        const response = await fetch('data/analysen.json?t=' + Date.now());
        if (!response.ok) throw new Error("Fehler: " + response.status);

        const data = await response.json();
        container.innerHTML = data.slice(0, 6).map(createAnalysisArticle).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-red-500 text-center col-span-full">
            Analysen konnten nicht geladen werden.
        </p>`;
    }
}


/* ------- DOM Events ------- */
document.addEventListener('DOMContentLoaded', () => {

    loadAndRenderAnalyses();

    const modal = document.getElementById('login-modal');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');


    /* Sidebar */
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.add('open'));
        closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    /* Login-Links */
    const openLoginLinks = document.querySelectorAll('a[href="#open-login"]');
    openLoginLinks.forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            openModal();
        });
    });

    /* Klick außerhalb → Modal schließen */
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
});
