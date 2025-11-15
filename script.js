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
        
        // Stellt sicher, dass alle alten Fehlermeldungen entfernt werden
        const existingError = loginModal.querySelector('#login-error-message');
        if (existingError) {
            existingError.remove();
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
    // Verwendung des neuen, von Ihnen genehmigten HTML-Templates, angepasst an die Datenstruktur
    return `
        <a href="${analysis.link}" class="bg-gray-100 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 block transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] overflow-hidden group">
            
            <div class="w-full h-40 bg-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <img src="${analysis.image}" alt="Vorschaubild für ${analysis.title}" 
                     class="w-full h-full object-cover group-hover:opacity-85 transition duration-300">
            </div>
            
            <p class="text-xs font-semibold uppercase tracking-widest text-primary-blue mb-1">
                ${analysis.category}
            </p>
            
            <h4 class="text-lg font-bold text-gray-900 mb-2 leading-snug">
                ${analysis.title}
            </h4>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-3">
                ${analysis.summary}
            </p>
            
            <span class="text-sm font-medium text-primary-blue hover:text-blue-600 transition duration-150 flex items-center">
                Vorschau lesen →
            </span>
            
        </a>
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


// === TEST-LOGIN-LOGIK ===

/** Initialisiert die simulierte Login-Funktionalität. */
function initTestLogin() {
    const TEST_EMAIL = 'test@capitovo.de';
    const TEST_PASSWORD = 'passwort123';
    
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    
    const loginForm = loginModal.querySelector('form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Verhindert das Standard-Formular-Senden

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const enteredEmail = emailInput.value;
        const enteredPassword = passwordInputInput.value;

        // Fehlermeldungen von vorherigen Versuchen entfernen
        const existingError = loginModal.querySelector('#login-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const submitButton = loginModal.querySelector('button[type="submit"]');

        // Überprüfung der Testdaten
        if (enteredEmail === TEST_EMAIL && enteredPassword === TEST_PASSWORD) {
            
            // **ERFOLGREICHE ANMELDUNG (SIMULIERT)**
            alert('Anmeldung erfolgreich! (Simuliert)');
            
            // Felder leeren und Modal schließen
            emailInput.value = '';
            passwordInput.value = '';
            closeLoginModal();
            

        } else {
            
            // **FEHLERHAFTE ANMELDUNG**
            
            // Fehlermeldung erstellen und einfügen
            const errorMessage = document.createElement('p');
            errorMessage.id = 'login-error-message';
            // Styling für Fehlermeldung
            errorMessage.className = 'text-red-500 text-sm mt-3 text-center'; 
            errorMessage.textContent = 'Fehler: Ungültige E-Mail oder Passwort. Verwenden Sie test@capitovo.de / passwort123';
            
            // Die Meldung unter dem Button einfügen
            submitButton.parentNode.insertBefore(errorMessage, submitButton.nextSibling);
        }
    });
}


// === INITIALISIERUNGSFUNKTIONEN (unverändert) ===

/** Initialisiert die Funktionalität der Seitenleiste (Sidebar). */
function initSidebar() {
    const sidebarElement = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle'); 
    const closeSidebarButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebarElement && closeSidebarButton) {
        
        // Öffnen/Schließen der Sidebar
        menuToggle.addEventListener('click', () => {
            sidebarElement.classList.add('open');
            document.body.style.overflow = 'hidden'; // Verhindert Scrollen des Hintergrunds, wenn Sidebar offen
        });

        closeSidebarButton.addEventListener('click', () => {
            sidebarElement.classList.remove('open');
            document.body.style.overflow = ''; // Stellt Scrollen wieder her
        });
        
        // Schließt die Sidebar beim Klick auf einen normalen Navigationslink
        const navLinks = sidebarElement.querySelectorAll('a:not([href="#open-login"])');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebarElement.classList.remove('open');
                document.body.style.overflow = '';
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
        // Prüft, ob das Modal sichtbar (nicht hidden) ist, bevor geschlossen wird
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
    
    // 4. NEU: Initialisiere die simulierte Login-Funktionalität
    initTestLogin();
});