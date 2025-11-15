// script.js

// Funktion zum Erstellen eines einzelnen Analyse-Artikels als HTML.
function createAnalysisArticle(analysis) {
    return `
        <article class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <div class="h-40 bg-gray-300 rounded-lg mb-4"></div>
            <p class="text-xs font-bold text-gray-700 uppercase mb-2">${analysis.category}</p>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">
                ${analysis.title}
            </h4>
            <p class="text-sm text-gray-600 mb-4">
                ${analysis.summary}
            </p>
            <a href="${analysis.link}" class="text-accent-blue hover:text-blue-700 font-medium text-sm flex items-center">
                Vorschau lesen →
            </a>
        </article>
    `;
}

// Funktion zum Laden der Analysen und Einfügen in die Seite.
async function loadAndRenderAnalyses() {
    const analysisGrid = document.getElementById('analysis-grid');
    if (!analysisGrid) return; 
    
    // Der Pfad zur JSON-Datei
    const apiUrl = 'data/analyses.json'; 
    
    try {
        const response = await fetch(apiUrl); 
        if (!response.ok) {
            // Fängt den 404 Fehler ab, falls die Datei noch nicht von GitHub Pages bereitgestellt wird
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        const analyses = await response.json(); 
        
        // Erzeugt das HTML und fügt es in das Grid ein (lädt max. 6)
        const analysisHTML = analyses.slice(0, 6) 
                                     .map(createAnalysisArticle)
                                     .join('');
        
        analysisGrid.innerHTML = analysisHTML;

    } catch (error) {
        console.error("Fehler beim Laden der Analysen:", error);
        analysisGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Aktuelle Analysen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
    }
}

// Funktion zur Behandlung des Scroll-Events für den Header und den Logowechsel
function handleScrollHeader() {
    const header = document.querySelector('header');
    const logoImg = header.querySelector('.header-logo');
    const menuToggle = document.getElementById('menu-toggle');
    
    const scrollThreshold = 100; 
    
    // ANNAHME: Die Logos heißen 'caitavo_logo_weiß.png' und 'caitavo_logo_dunkel.png'
    const LIGHT_LOGO_SRC = 'caitavo_logo_weiß.png';
    const DARK_LOGO_SRC = 'caitavo_logo_dunkel.png';

    if (window.scrollY > scrollThreshold) {
        // Zustand: Gescrollt (Header wird weiß/sticky)
        header.classList.add('scrolled');
        logoImg.src = DARK_LOGO_SRC; 
    } else {
        // Zustand: Oben (Header ist transparent/im Hero-Bereich)
        header.classList.remove('scrolled');
        logoImg.src = LIGHT_LOGO_SRC; 
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    // **WICHTIG! RUFT DIE FUNKTIONEN JETZT BEIM LADEN DER SEITE AUF**
    loadAndRenderAnalyses();
    
    window.addEventListener('scroll', handleScrollHeader);
    handleScrollHeader(); 
    
    
    // === 1. SEITENLEISTEN-FUNKTIONALITÄT (Ihr Originalcode) ===
    const menuToggle = document.getElementById('menu-toggle'); 
    const sidebar = document.getElementById('sidebar');      
    const closeSidebarButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebar && closeSidebarButton) {
        
        // Öffnet die Seitenleiste
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        // Schließt die Seitenleiste
        closeSidebarButton.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
        
        // Fügt Schließlogik für alle Navigationslinks hinzu
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') !== '#open-login') {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                });
            }
        });
    }

    // --- ENDE SEITENLEISTEN-FUNKTIONALITÄT ---
    
    
    // === 2. LOGIN MODAL-FUNKTIONALITÄT (Ihr Originalcode) ===
    
    const loginModal = document.getElementById('login-modal');
    const openLoginLinks = document.querySelectorAll('a[href="#open-login"]');
    
    if (loginModal) {
        
        // Modal-Funktion: Öffnen, wenn ein Link geklickt wird
        openLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open'); 
                }
                
                loginModal.classList.remove('hidden'); 
            });
        });
        
        // Modal-Funktion: Schließen bei Klick auf den Hintergrund
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add('hidden'); 
            }
        });
        
        // Modal-Funktion: Schließen mit ESC-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModal.classList.contains('hidden')) {
                loginModal.classList.add('hidden');
            }
        });
    }
});