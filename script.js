// script.js

// =======================================================
// KORRIGIERTER ABSCHNITT: Seitenleisten-Funktionalität
// =======================================================

/**
 * Funktion zur Steuerung der Seitenleiste (Sidebar).
 * Schaltet die CSS-Klasse 'open' auf der Sidebar.
 */
function initialisiereSeitenleiste() {
    // 1. Elemente anhand ihrer korrekten IDs auswählen
    const menuToggle = document.getElementById('menu-toggle'); 
    const sidebar = document.getElementById('sidebar');       // KORRIGIERT: Muss 'sidebar' sein
    const closeButton = document.getElementById('close-sidebar');

    if (menuToggle && sidebar && closeButton) {
        
        // --- Öffnungsfunktion ---
        menuToggle.addEventListener('click', () => {
            // 2. KORRIGIERT: Schaltet die Klasse 'open'
            sidebar.classList.add('open');
        });

        // --- Schließfunktion (X-Button) ---
        closeButton.addEventListener('click', () => {
            // 3. KORRIGIERT: Entfernt die Klasse 'open'
            sidebar.classList.remove('open');
        });
        
        // Optional: Menü schließen, wenn ein Link in der Leiste geklickt wird
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        });

    } else {
        // Dieser Fehler wird in der Konsole sichtbar, falls Elemente fehlen
        console.error("Fehler: Konnte Menü- oder Sidebar-Elemente nicht im DOM finden.");
    }
}

// 4. Die Funktion aufrufen, sobald das gesamte HTML geladen ist
document.addEventListener('DOMContentLoaded', initialisiereSeitenleiste);


// =======================================================
// DEIN BESTEHENDER CODE FOLGT (nur zur Übersicht)
// =======================================================
/* Hier folgt der Rest deines Aktiendaten-Codes (const aktienDaten, function datenAktualisieren, etc.) */