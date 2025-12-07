// Lokale Konfiguration für die Abonnenten-Seite (wird auf GitHub Pages ausgeliefert)
// Nur Alpha Vantage wird als Datenquelle genutzt. Für Produktion: nutze einen serverseitigen Proxy.
// Alpha Vantage Key: ENTFERNT für öffentliche Auslieferung.
// Für lokale Entwicklung kopiere `src/config.example.js` -> `src/config.js` und setze dort
// deinen `window.ALPHA_VANTAGE_KEY` (diese Datei ist gitignored).
// Cache TTL (Stunden) für Finanzdaten (Client-side). Standard 24 Stunden
window.FINANCIALS_CACHE_TTL_HOURS = 24;
// Proxy URL: setze hier die öffentliche URL deines Proxys, damit Clients live Daten erhalten.
// Beispiel: https://api.dein-host.tld/api
window.FINANCIALS_PROXY_URL = 'https://api.dein-host.tld/api';
