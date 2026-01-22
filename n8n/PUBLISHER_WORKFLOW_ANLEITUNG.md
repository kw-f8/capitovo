# Analyse Publisher Workflow - Setup Anleitung

## Übersicht

Dieser Workflow nimmt eine generierte Analyse und veröffentlicht sie auf GitHub Pages:
- **Input:** Analyse-Daten (Unternehmen, Ticker, Analysetext, Quellen)
- **Output:** Live-Seite auf `https://kw-f8.github.io/capitovo/Abonenten/{slug}.html`

## Workflow-Struktur

```
Manual Trigger → Input Daten → HTML Renderer → SVG Generator → Katalog-Eintrag → Base64 Encoding → GitHub Upload (HTML + SVG) → Output Summary
```

## Setup in n8n

### 1. Workflow importieren
1. Öffne n8n
2. Gehe zu "Workflows" → "Import from File"
3. Wähle `n8n_analyse_publisher_workflow.json`

### 2. GitHub Credentials einrichten

**WICHTIG:** Du brauchst einen GitHub Personal Access Token (PAT).

1. Gehe zu GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
2. Erstelle einen neuen Token mit:
   - Repository access: `kw-f8/capitovo`
   - Permissions:
     - Contents: Read and Write
     - Metadata: Read
3. Kopiere den Token

4. In n8n:
   - Gehe zu "Credentials"
   - Erstelle neue "Header Auth" Credentials:
     - Name: `GitHub Token`
     - Header Name: `Authorization`
     - Header Value: `Bearer ghp_DEIN_TOKEN_HIER`

5. In den Upload-Nodes (6a, 6b):
   - Wähle die erstellten Credentials unter "Authentication"

### 3. Input-Daten konfigurieren

Die Input-Node enthält Beispieldaten. Für eine echte Analyse:

```javascript
return {
  json: {
    // Pflichtfelder
    company: 'Unternehmensname',
    ticker: 'TICK',
    slug: 'unternehmensname',  // URL-freundlich, keine Umlaute
    exchange: 'NASDAQ',
    sector: 'Technologie',
    currency: 'USD',
    wkn: '123456',
    isin: 'US1234567890',
    date: '2026-01-22',
    
    // Analyse-Inhalt (vom Generator-Workflow)
    analysisContent: `Der vollständige Analysetext...`,
    
    // Optional: Strukturierte Abschnitte
    sections: [
      { id: 'geschaeftsmodell', title: 'Geschäftsmodell', content: '...' },
      { id: 'finanzen', title: 'Finanzen', content: '...' }
    ],
    
    // Optional: Kennzahlen
    metrics: {
      marketCap: '100 Mrd. USD',
      forwardPE: '25x'
    },
    
    // Quellen
    sources: [
      'https://example.com/source1',
      'https://example.com/source2'
    ]
  }
};
```

## Integration mit Generator-Workflow

### Option A: Manuell (Kopieren)
1. Führe den Generator-Workflow (v10.1) aus
2. Kopiere die Output-Daten
3. Füge sie in die Input-Node des Publisher-Workflows ein
4. Führe den Publisher aus

### Option B: Webhook-Verbindung
1. Ersetze "Manual Trigger" im Publisher durch einen Webhook-Trigger
2. Am Ende des Generator-Workflows: HTTP Request an den Webhook

### Option C: Combined Workflow
Siehe `n8n_analyse_full_pipeline.json` (TODO)

## Output

Nach erfolgreicher Ausführung:

```json
{
  "success": true,
  "company": "Apple Inc.",
  "liveUrl": "https://kw-f8.github.io/capitovo/Abonenten/apple.html",
  "uploads": {
    "html": { "success": true },
    "svg": { "success": true }
  },
  "catalogEntry": {
    "id": "aapl-20260122",
    "title": "Apple Inc. - Unternehmensanalyse",
    "link": "Abonenten/apple.html"
  }
}
```

## Wichtige Hinweise

### GitHub Pages Deployment
- Nach dem Upload dauert es **1-2 Minuten** bis die Seite live ist
- GitHub Pages cached Dateien - bei Updates ggf. Browser-Cache leeren

### Datei überschreiben
- Wenn eine Datei bereits existiert, brauchst du den SHA der bestehenden Datei
- Der Workflow holt den SHA automatisch (TODO: implementieren)

### analysen.json aktualisieren
- Der `catalogEntry` muss manuell zu `data/analysen.json` hinzugefügt werden
- Oder: Erweitere den Workflow um einen zusätzlichen GitHub-Request

## Fehlerbehebung

### 422 Unprocessable Entity
- Datei existiert bereits → SHA fehlt
- Lösung: SHA der existierenden Datei abrufen und im Body mitschicken

### 401 Unauthorized
- Token ungültig oder abgelaufen
- Lösung: Neuen Token erstellen

### 404 Not Found
- Repository-Pfad falsch
- Lösung: Prüfe `kw-f8/capitovo` und Pfade

## Nächste Schritte

1. [ ] SHA-Abruf für Updates implementieren
2. [ ] analysen.json automatisch aktualisieren
3. [ ] Combined Pipeline (Generator + Publisher)
4. [ ] Webhook-Trigger für automatische Veröffentlichung
