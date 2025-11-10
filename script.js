// script.js

// =======================================================
// KORRIGIERTER ABSCHNITT: Seitenleisten-Funktionalität
// =======================================================

/**
 * Funktion zur Steuerung der Seitenleiste (Sidebar).
 * Schaltet die CSS-Klasse 'open' auf der Sidebar.
 */
function initialisiereSeitenleiste() {
    // WICHTIG: Die IDs entsprechen den Elementen in der index.html
    const menuToggle = document.getElementById('menu-toggle'); 
    const sidebar = document.getElementById('sidebar');      
    const closeButton = document.getElementById('close-sidebar');

    // Stellt sicher, dass alle Elemente im HTML gefunden wurden
    if (menuToggle && sidebar && closeButton) {
        
        // --- Öffnungsfunktion ---
        menuToggle.addEventListener('click', () => {
            // Fügt die Klasse 'open' hinzu (CSS blendet das Menü ein)
            sidebar.classList.add('open');
        });

        // --- Schließfunktion (X-Button) ---
        closeButton.addEventListener('click', () => {
            // Entfernt die Klasse 'open' (CSS blendet das Menü aus)
            sidebar.classList.remove('open');
        });
        
        // Optional: Schließen beim Klick auf einen Link
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        });

    } else {
        console.error("Fehler: Konnte Menü-, Sidebar- oder Schließen-Elemente nicht im DOM finden. Bitte IDs in index.html prüfen.");
    }
}

// Stellt sicher, dass das Skript erst läuft, wenn das gesamte HTML geladen ist
document.addEventListener('DOMContentLoaded', initialisiereSeitenleiste);


// =======================================================
// DEIN BESTEHENDER CODE FOLGT
// (Hier folgen alle anderen Funktionen, z.B. Aktiendaten)
// =======================================================