// script.js

// 1. Definition der Aktiendaten (Dummy-Daten zum Testen)
const aktienDaten = {
    symbol: "TSLA", 
    name: "Tesla Inc. (Dummy)",
    kurs: 195.50,
    währung: "USD",
    veraenderungHeute: -1.25, // Negativ für Test-Zwecke
    prozentChange: -0.64,
    marktkapitalisierung: "625 Mrd. USD",
    analyse: "Die tiefgreifende Analyse wird hier eingebettet, nachdem die Kennzahlen verarbeitet wurden."
};

/**
 * 2. Funktion zum Einfügen der Daten in das HTML
 */
function datenAktualisieren(daten) {
    // Aktualisiere den Namen
    document.getElementById('aktienname').textContent = daten.name;

    // Aktualisiere den Kurs
    const kursElement = document.getElementById('kurs-wert');
    kursElement.textContent = `${daten.kurs.toFixed(2)} ${daten.währung}`;

    // Aktualisiere die Veränderung und färbe sie
    const changeElement = document.getElementById('change-wert');
    changeElement.textContent = `${daten.veraenderungHeute.toFixed(2)} (${daten.prozentChange.toFixed(2)}%)`;
    
    // Logik zur Farbänderung
    if (daten.veraenderungHeute > 0) {
        changeElement.style.color = 'green';
    } else if (daten.veraenderungHeute < 0) {
        changeElement.style.color = 'red';
    } else {
        changeElement.style.color = '#333';
    }

    // Aktualisiere Marktkapitalisierung und Analyse-Text
    document.getElementById('mcap-wert').textContent = daten.marktkapitalisierung;
    document.getElementById('analyse-text').textContent = daten.analyse;
}

// 3. Ausführung der Funktion, sobald die Seite geladen ist
datenAktualisieren(aktienDaten);
