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
    const apiUrl = 'data/analysen.json'; 
    
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
        // Ausgabe des Fehlers in der Konsole zur Diagnose
        console.error("Fehler beim Laden der Analysen:", error);
        analysisGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Aktuelle Analysen konnten nicht geladen werden. Fehler: Konsole prüfen!</p>';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    // WICHTIG: Startet den Ladevorgang der News-Kästen
    loadAndRenderAnalyses();
    
    
    // === 1. SEITENLEISTEN-FUNKTIONALITÄT ===
    const menuToggle = document.getElementById('menu-toggle'); 
    const sidebar = document.getElementById('sidebar');      
    const closeSidebarButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebar && closeSidebarButton) {
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        closeSidebarButton.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
        
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
    
    
    // === 2. LOGIN MODAL-FUNKTIONALITÄT ===
    
    const loginModal = document.getElementById('login-modal');
    const openLoginLinks = document.querySelectorAll('a[href="#open-login"]');
    
    if (loginModal) {
        
        openLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open'); 
                }
                
                loginModal.classList.remove('hidden'); 
            });
        });
        
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add('hidden'); 
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModal.classList.contains('hidden')) {
                loginModal.classList.add('hidden');
            }
        });
    }
});