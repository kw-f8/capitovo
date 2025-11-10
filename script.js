// script.js

// =======================================================
// KORRIGIERTER ABSCHNITT: Seitenleisten-Funktionalität
// =======================================================

/**
 * Funktion zur Steuerung der Seitenleiste (Sidebar).
 * Schaltet die CSS-Klasse 'open' auf der Sidebar.
 */
function initialisiereSeitenleiste() {
    // 1. Elemente anhand ihrer ID auswählen
    const menuToggle = document.getElementById('menu-toggle'); // Der Hamburger-Button (ID ist korrekt)
    const sidebar = document.getElementById('sidebar');       // KORRIGIERT: Muss 'sidebar' sein
    const closeButton = document.getElementById('close-sidebar'); // Der X-Button zum Schließen (optional, aber gut)

    if (menuToggle && sidebar && closeButton) {
        
        // --- Öffnungsfunktion ---
        menuToggle.addEventListener('click', () => {
            // 2. KORRIGIERT: Klasse 'open' auf der Sidebar hinzufügen
            sidebar.classList.add('open');
            // ARIA-Attribute können optional hinzugefügt werden, sind aber hier nicht das Problem.
        });

        // --- Schließfunktion (X-Button) ---
        closeButton.addEventListener('click', () => {
            // 3. KORRIGIERT: Klasse 'open' auf der Sidebar entfernen
            sidebar.classList.remove('open');
        });
        
        // OPTIONAL: Schließen, wenn ein Link in der Leiste geklickt wird
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        });

    } else {
        console.error("Fehler: Konnte Menü-, Sidebar- oder Schließen-Elemente nicht im DOM finden.");
    }
}

// 4. Die Funktion aufrufen, sobald das gesamte HTML geladen ist
document.addEventListener('DOMContentLoaded', initialisiereSeitenleiste);


// =======================================================
// DEIN BESTEHENDER CODE FOLGT (nur zur Übersicht)
// =======================================================

/* Der Rest deines Aktiendaten-Codes (aktienDaten, datenAktualisieren) 
   bleibt unberührt und kann unten angefügt werden. */