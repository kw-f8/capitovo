// script.js

// === HILFSFUNKTIONEN FÜR MODAL & SIDEBAR STEUERUNG ===

/** Öffnet das Login-Modal und schließt die Sidebar, falls geöffnet. */
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const sidebar = document.getElementById('sidebar');

    if (loginModal) {
        // Schließt die Sidebar, falls sie geöffnet ist
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open'); 
        }
        
        loginModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Verhindert Scrollen des Hintergrunds
    }
}

/** Schließt das Login-Modal. */
function closeLoginModal() {
    const loginModal = document.getElementById('login-modal');

    if (loginModal) {
        loginModal.classList.add('hidden');
        document.body.style.overflow = ''; // Stellt das Scrollen wieder her
    }
}


// === ANALYSEN RENDERING LOGIK ===

/**
 * Erstellt das HTML für einen einzelnen Analyse-Artikel.
 * Hinweis: Verwendet 'text-blue-500', da 'text-accent-blue' eine Custom-Klasse ist, 
 * die Tailwind ggf. nicht kennt, falls sie nicht in der config.js ist.
 */
function createAnalysisArticle(analysis) {
    return `
        <article class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <div class="h-40 mb-4 overflow-hidden rounded-lg">
                <img src="${analysis.image}" alt="Titelbild für ${analysis.title}" 
                     class="w-full h-full object-cover">
            </div> 
            
            <p class="text-xs font-bold text-gray-700 uppercase mb-2">${analysis.category}</p>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">
                ${analysis.title}
            </h4>
            <p class="text-sm text-gray-600 mb-4">
                ${analysis.summary}
            </p>
            <a href="#open-login" class="text-blue-500 hover:text-blue-700 font-medium text-sm flex items-center">
                Vorschau lesen →
            </a>
        </article>
    `;
}

/** Lädt die Analysen aus JSON und rendert sie im Grid. */
async function loadAndRenderAnalyses() {
    const analysisGrid = document.getElementById('analysis-grid');
    if (!analysisGrid) return; 
    
    // Cache-Buster
    const cacheBuster = `?t=${new Date().getTime()}`; 
    const apiUrl = 'data/analysen.json' + cacheBuster; 
    
    try {
        const response = await fetch(apiUrl); 
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status} (Pfad: ${apiUrl})`);
        }
        
        const analyses = await response.json(); 
        
        // Erzeugt das HTML und fügt es in das Grid ein (lädt max. 6)
        const analysisHTML = analyses.slice(0, 6) 
                                     .map(createAnalysisArticle)
                                     .join('');
        
        analysisGrid.innerHTML = analysisHTML;

    } catch (error) {
        console.error("Fehler beim Laden der Analysen:", error);
        analysisGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Aktuelle Analysen konnten nicht geladen werden. Prüfen Sie Konsole.</p>';
    }
}


// === INITIALISIERUNGSFUNKTIONEN ===

/** Initialisiert die Funktionalität der Seitenleiste (Sidebar). */
function initSidebar() {
    const sidebarElement = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle'); 
    const closeSidebarButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebarElement && closeSidebarButton) {
        
        // Öffnen/Schließen der Sidebar
        menuToggle.addEventListener('click', () => {
            sidebarElement.classList.add('open');
        });

        closeSidebarButton.addEventListener('click', () => {
            sidebarElement.classList.remove('open');
        });
        
        // Schließt die Sidebar beim Klick auf einen normalen Navigationslink
        const navLinks = sidebarElement.querySelectorAll('a:not([href="#open-login"])');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebarElement.classList.remove('open');
            });
        });
    }
}

/** Initialisiert die Modal-Steuerung mit Event Delegation. */
function initModalControl() {
    const loginModalElement = document.getElementById('login-modal');
    
    if (!loginModalElement) return;

    // 1. Öffnen des Modals via Event Delegation für ALLE #open-login Links
    document.body.addEventListener('click', (e) => {
        // Findet den nächstgelegenen Link, der auf #open-login zeigt
        const link = e.target.closest('a[href="#open-login"]'); 
        
        if (link) {
            e.preventDefault();
            openLoginModal();
        }
    });

    // 2. Schließen des Modals (Backdrop-Klick)
    loginModalElement.addEventListener('click', (e) => {
        if (e.target === loginModalElement) {
            closeLoginModal();
        }
    });
    
    // 3. Schließen des Modals (ESC-Taste)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !loginModalElement.classList.contains('hidden')) {
            closeLoginModal();
        }
    });
}


// === HAUPT-LOGIK ===
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Lade die Analysen
    loadAndRenderAnalyses();
    
    // 2. Initialisiere Sidebar und Navigation
    initSidebar();
    
    // 3. Initialisiere Modal-Steuerung
    initModalControl();
    
});