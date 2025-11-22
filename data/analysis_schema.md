Analysis JSON Schema — kurzreferenz

Zweck
- Dokumentiert das erwartete Datenformat für einzelne Analysen in `data/analysen.json`.
- Ein KI‑Agent kann damit neue Einträge automatisch erzeugen, validieren und speichern.

Empfohlene Felder (alle Felder sollten benutzt werden, wenn möglich):

- id (string)
  - Eindeutiger Identifier / Slug, z.B. `fiserv-2025-krise`
  - Wird bevorzugt für Detail‑URLs: `analyse.html?id=<id>` (statt numerischem Index)

- slug (string) [optional]
  - URL‑freundlicher Titel, z.B. `fiserv-krise-2025`

- title (string) — Pflicht
  - Vollständiger Titel der Analyse.

- summary (string) — Pflicht
  - Kurztext (1–2 Sätze) für Karten / Vorschau.

- content (string | HTML) — Pflicht für Detailseite
  - Voller Artikelinhalt in HTML (eingeschränkt) oder Markdown (falls Konverter vorhanden).
  - Wenn `content` gesetzt ist, wird er auf der Detailseite gerendert.

- category (string) — Pflicht
  - Kategorie/Sektor, z. B. `FINANZEN & MÄRKTE`, `TECHNOLOGIE`.

- tags (array<string>) — Optional
  - Stichworte zur Suche/Filterung, z. B. `["Value","FinTech"]`.

- image (string) — Optional aber empfohlen
  - Relativer Pfad ab Projektwurzel, z. `data/vorschaubilder/fiserv.png`.
  - Agent sollte vorhandene Bilder in `data/vorschaubilder/` speichern.

- link (string)
  - Verhalten für öffentliche Klicks: Standard ist `#open-login` (öffnet Login für nicht eingeloggte Nutzer).
  - Wenn öffentliche Klicks direkt zur statischen Seite führen sollen, setze z. B. `Abonenten/fiserv.html`.

- date (string, ISO 8601) — empfohlen
  - Veröffentlichungsdatum, z. B. `2025-11-22`.

- author (string) — Optional
  - Autor/Redaktion, z. B. `capitovo Research`.

- published (boolean) — empfohlen
  - `true`/`false`: nützlich, um Entwürfe zu verwalten.

Anforderungen & Hinweise für Agenten
- Konsistenz der Schlüssel: Verwende genau die oben genannten Feldnamen (case‑sensitive).
- Bildpfade: speichere Bilder immer unter `data/vorschaubilder/` und verwende relative Pfade in `image`.
- IDs/Slugs: generiere `id` aus `title` (Kleinbuchstaben, Bindestriche, nur a–z0–9 und `-`). Prüfe auf Duplikate.
- HTML in `content`: Erlaube nur einfache Tags (`p`, `h1`-`h4`, `ul`, `ol`, `li`, `a`, `table`, `tr`, `td`, `th`, `strong`, `em`, `br`) — keine Skripte oder inline Event‑Handler.
- Link‑Verhalten: Wenn `link` = `#open-login`, bleibt das bestehende Verhalten (Index zeigt Login für Unangemeldete). Für direkte öffentliche Seitensetze `link` auf `Abonenten/<slug>.html`.
- Metadaten zur Automatisierung: Agenten sollten bei Erzeugung einen Prüfpass (checksum) oder `createdAt` Zeitstempel hinzufügen (optional).

Beispiel eines gültigen Eintrags (auch als Template vorhanden):

Siehe `data/analysis_template.json`.

Empfohlene Erweiterung am Code
- `script.js` kann erweitert werden, um `id`/`slug` zu bevorzugen (anstatt numerischem Index). Wenn gewünscht, implementiere ich das.

Ende der Referenz.
