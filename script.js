// =======================================================
// NEUER ABSCHNITT: Responsive Menü-Funktionalität
// =======================================================

/**
 * Funktion zur Steuerung des mobilen Navigationsmenüs.
 * Schaltet die CSS-Klasse 'is-open' und die ARIA-Attribute um.
 */
function initialisiereMenueToggle() {
    // 1. Elemente anhand ihrer ID auswählen
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        // 2. Klick-Event-Listener zum Button hinzufügen
        menuToggle.addEventListener('click', () => {
            // 3. Klasse 'is-open' auf der Navigation umschalten (hinzufügen/entfernen)
            mainNav.classList.toggle('is-open');

            // 4. ARIA-Attribut 'aria-expanded' umschalten (für Barrierefreiheit)
            const isExpanded = mainNav.classList.contains('is-open');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
        
        // OPTIONAL: Menü schließen, wenn ein Link im Menü geklickt wird (auf Mobil)
        // Dadurch bleibt das Menü nicht offen, nachdem der Nutzer navigiert hat.
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Nur schließen, wenn das Menü tatsächlich geöffnet ist
                if (mainNav.classList.contains('is-open')) {
                    mainNav.classList.remove('is-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

    } else {
        console.error("Fehler: Konnte Menü- oder Toggle-Elemente nicht im DOM finden.");
    }
}

// 5. Die Funktion aufrufen, sobald das gesamte HTML geladen ist
// Wir nutzen 'DOMContentLoaded', um sicherzustellen, dass die Elemente existieren.
document.addEventListener('DOMContentLoaded', initialisiereMenueToggle);


// =======================================================
// DEIN BESTEHENDER CODE FOLGT (nur zur Übersicht)
// (Dieser Teil bleibt unverändert)
// =======================================================

// 1. Definition der Aktiendaten (Dummy-Daten zum Testen)
const aktienDaten = {
// ...
};

// 2. Funktion zum Einfügen der Daten in das HTML
function datenAktualisieren(daten) {
// ...
}

// 3. Ausführung der Funktion, sobald die Seite geladen ist
// datenAktualisieren(aktienDaten); // Diesen Aufruf behältst du.