// script.js

document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. SEITENLEISTEN-FUNKTIONALITÄT (Dein alter, korrigierter Code) ===
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
            // WICHTIG: Das Schließen soll NICHT passieren, wenn der Login-Link geklickt wird
            // da der Login-Link jetzt das Modal öffnet
            if (link.getAttribute('href') !== '#open-login') {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                });
            }
        });
    }

    // --- ENDE SEITENLEISTEN-FUNKTIONALITÄT ---
    
    
    // === 2. LOGIN MODAL-FUNKTIONALITÄT (NEU: Öffnet das Pop-up) ===
    
    const loginModal = document.getElementById('login-modal');
    // Wählt alle Links, die das Modal öffnen sollen (Wir nutzen den href="#open-login")
    const openLoginLinks = document.querySelectorAll('a[href="#open-login"]');
    
    if (loginModal) {
        
        // Modal-Funktion: Öffnen, wenn ein Link geklickt wird
        openLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stoppt die Navigation zu einer neuen Seite
                
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open'); // Schließt zuerst die Seitenleiste
                }
                
                loginModal.classList.remove('hidden'); // Zeigt das Modal (entfernt die Tailwind-Klasse 'hidden')
            });
        });
        
        // Modal-Funktion: Schließen bei Klick auf den Hintergrund
        loginModal.addEventListener('click', (e) => {
            // Prüft, ob der Klick direkt auf den Hintergrund des Modals erfolgte (nicht auf das Formular selbst)
            if (e.target === loginModal) {
                loginModal.classList.add('hidden'); // Versteckt das Modal
            }
        });
        
        // Modal-Funktion: Schließen mit ESC-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !loginModal.classList.contains('hidden')) {
                loginModal.classList.add('hidden');
            }
        });
    }

    // === DEIN BESTEHENDER CODE FOLGT HIER ===
});