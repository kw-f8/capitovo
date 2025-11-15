// script.js

// === HILFSFUNKTIONEN FÜR MODAL STEUERUNG ===
// Diese Funktionen rufen die benötigten Elemente IMMER direkt im Moment des Aufrufs ab,
// was sehr robust gegenüber Initialisierungsfehlern ist.

function openModal() {
    // Elemente sicher abrufen
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

function closeModal() {
    const loginModal = document.getElementById('login-modal');

    if (loginModal) {
        loginModal.classList.add('hidden');
        document.body.style.overflow = ''; // Stellt das Scrollen wieder her
    }
}


// Funktion zum Erstellen eines einzelnen Analyse-Artikels als HTML.
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
    
    // Generiert eine zufällige Zahl, um den Browser-Cache zu umgehen (Cache-Buster)
    const cacheBuster = `?t=${new Date().getTime()}`; 
    
    // Der Pfad zur JSON-Datei + Cache-Buster-Parameter
    const apiUrl = 'data/analysen.json' + cacheBuster; 
    
    try {
        const response = await fetch(apiUrl); 
        if (!response.ok) {
            // Wirft einen Fehler, wenn die Datei nicht gefunden wird (z.B. 404)
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
        // Zeigt die rote Fehlermeldung auf der Webseite an
        analysisGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Aktuelle Analysen konnten nicht geladen werden. Prüfen Sie Konsole.</p>';
    }
}


// === HAUPT-LOGIK, die nach dem Laden des DOM ausgeführt wird ===
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Lade die Analysen
    loadAndRenderAnalyses();
    
    // === 2. ELEMENT-SELEKTOREN (JETZT SICHER DEFINIERT) ===
    const loginModalElement = document.getElementById('login-modal');
    const sidebarElement = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle'); 
    const closeSidebarButton = document.getElementById('close-sidebar');

    
    // === 3. SEITENLEISTEN-FUNKTIONALITÄT ===
    
    if (menuToggle && sidebarElement && closeSidebarButton) {
        
        // Öffnet die Seitenleiste beim Klick auf das Hamburger-Menü
        menuToggle.addEventListener('click', () => {
            sidebarElement.classList.add('open');
        });

        // Schließt die Seitenleiste beim Klick auf das X
        closeSidebarButton.addEventListener('click', () => {
            sidebarElement.classList.remove('open');
        });
        
        // Schließt die Seitenleiste/Öffnet Modal beim Klick auf einen Navigationslink
        const navLinks = sidebarElement.querySelectorAll('a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') !== '#open-login') {
                // Schließt die Sidebar für normale Navigation
                link.addEventListener('click', () => {
                    sidebarElement.classList.remove('open');
                });
            } else {
                // Öffnet das Modal für den #open-login Link
                 link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal();
                 });
            }
        });
    }

    
    // === 4. LOGIN MODAL-FUNKTIONALITÄT ===
    
    if (loginModalElement) {
        
        // 4a. Statische Links (z.B. in Sidebar oder Header)
        const openLoginLinks = document.querySelectorAll('a[href="#open-login"]');
        openLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                openModal();
            });
        });
        
        // 4b. Dynamische Links ("Vorschau lesen") via Event Delegation
        const analysisGrid = document.getElementById('analysis-grid');
        if (analysisGrid) {
            analysisGrid.addEventListener('click', (e) => {
                // Findet den nächstgelegenen Link, der auf #open-login zeigt
                const link = e.target.closest('a[href="#open-login"]'); 
                
                if (link) {
                    e.preventDefault();
                    openModal(); // Modal öffnen
                }
            });
        }
        
        // 4c. Schließ-Logik
        
        // Schließt das Modal beim Klick außerhalb des Formulars (auf den Backdrop)
        loginModalElement.addEventListener('click', (e) => {
            if (e.target === loginModalElement) {
                closeModal();
            }
        });
        
        // Schließt das Modal beim Drücken der ESC-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModalElement.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
});