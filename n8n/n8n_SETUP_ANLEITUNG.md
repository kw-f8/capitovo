# 🤖 n8n Analyse-Generator Setup-Anleitung

## 📋 Voraussetzungen

1. **n8n Installation** (selbst gehostet oder Cloud)
2. **Perplexity API Key** (Pro Account)
3. **Dateizugriff** auf `/workspaces/capitovo/`

---

## 🚀 Installation

### 1. Workflow importieren

```bash
# In n8n:
# 1. Gehe zu "Workflows" → "Import from File"
# 2. Wähle `n8n_analyse_generator_workflow.json`
# 3. Klicke auf "Import"
```

### 2. Perplexity API Key einrichten

```bash
# In n8n:
# 1. Gehe zu "Credentials" → "New"
# 2. Wähle "Header Auth"
# 3. Name: "Perplexity API"
# 4. Header Name: "Authorization"
# 5. Header Value: "Bearer pplx-DEIN-API-KEY"
# 6. Speichern
```

### 3. Dateipfade anpassen

Falls dein capitovo-Projekt nicht in `/workspaces/capitovo/` liegt:

**Node: "Update analysen.json"**
```javascript
// Zeile 3 ändern:
const path = '/DEIN/PFAD/ZU/capitovo/data/analysen.json';
```

**Node: "Generate Preview SVG"**
```javascript
// Zeile 25 ändern:
const svgPath = `/DEIN/PFAD/ZU/capitovo/data/vorschaubilder/${filename}.svg`;
```

### 4. Slack-Benachrichtigung (optional)

Wenn du Slack-Benachrichtigungen willst:

```bash
# In n8n:
# 1. Gehe zu "Credentials" → "New"
# 2. Wähle "Slack API"
# 3. Füge deinen Webhook-URL ein
# 4. Verknüpfe mit "Slack Notification" Node
```

Falls nicht: Lösche einfach den "Slack Notification" Node.

---

## 🎯 Verwendung

### Option 1: Webhook (Empfohlen)

Nach Import ist der Webhook aktiv unter:
```
https://DEINE-N8N-URL/webhook/create-analysis
```

**Test-Request:**
```bash
curl -X POST https://DEINE-N8N-URL/webhook/create-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Apple",
    "ticker": "AAPL",
    "sector": "TECHNOLOGIE"
  }'
```

**Response:**
```json
{
  "success": true,
  "filename": "apple",
  "message": "Analyse erfolgreich generiert!"
}
```

### Option 2: Manuell triggern

1. Öffne Workflow in n8n
2. Klicke auf "Execute Workflow"
3. Gib Parameter ein:
   - company: "Microsoft"
   - ticker: "MSFT"
   - sector: "TECHNOLOGIE"

### Option 3: Schedule (Automatisch)

Füge einen "Schedule Trigger" hinzu:

```javascript
// Jeden Montag um 6 Uhr
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 6 * * 1"
      }
    ]
  }
}
```

Dann mit "Code Node" Liste von Unternehmen:
```javascript
const companies = [
  { company: "Apple", ticker: "AAPL", sector: "TECHNOLOGIE" },
  { company: "Tesla", ticker: "TSLA", sector: "ZYKLISCHER KONSUM" },
  { company: "Microsoft", ticker: "MSFT", sector: "TECHNOLOGIE" }
];

return companies.map(c => ({ json: c }));
```

---

## 📂 Output

Nach erfolgreicher Ausführung werden automatisch erstellt:

1. **HTML-Datei**: `/workspaces/capitovo/Abonenten/{company}.html`
2. **SVG-Preview**: `/workspaces/capitovo/data/vorschaubilder/{company}.svg`
3. **JSON-Eintrag**: In `/workspaces/capitovo/data/analysen.json` (ganz oben)

**Beispiel für Tesla:**
- `Abonenten/tesla.html`
- `data/vorschaubilder/tesla.svg`
- Eintrag in `analysen.json`:
```json
{
  "id": "tsla-2025-11-30",
  "category": "ZYKLISCHER KONSUM",
  "title": "Tesla: Equity-Research-Bericht",
  "summary": "...",
  "link": "Abonenten/tesla.html",
  "image": "data/vorschaubilder/tesla.svg",
  "date": "2025-11-30",
  "author": "capitovo Research",
  "tags": ["Tesla", "TSLA", "ZYKLISCHER KONSUM"],
  "published": true
}
```

---

## 🔧 Troubleshooting

### Fehler: "Cannot write file"
```bash
# Prüfe Schreibrechte:
chmod -R 755 /workspaces/capitovo/Abonenten/
chmod -R 755 /workspaces/capitovo/data/
```

### Fehler: "Perplexity API Error 401"
```bash
# API Key prüfen:
# 1. Gehe zu https://www.perplexity.ai/settings/api
# 2. Erstelle neuen Key
# 3. Aktualisiere in n8n Credentials
```

### Fehler: "Module 'fs' not found"
```bash
# n8n muss mit Dateisystem-Zugriff laufen
# Docker: Volume mounten
docker run -v /workspaces/capitovo:/data/capitovo ...
```

### Response ist leer / unvollständig
```bash
# Perplexity Parameter anpassen:
# Node "Perplexity Research" → Body:
{
  "max_tokens": 6000,  // erhöhen
  "temperature": 0.3    // erhöhen für mehr Kreativität
}
```

---

## 💰 Kosten

**Perplexity Pro API:**
- Sonar Pro: ~$0.01 pro Request (4000 tokens)
- Bei 50 Analysen/Monat: **~$0.50/Monat**

**n8n:**
- Self-hosted: Kostenlos
- Cloud Starter: $20/Monat (unbegrenzte Executions)

---

## 🎨 Anpassungen

### Template anpassen
**Node: "Generate HTML"** → Zeile 10+
```javascript
// Passe HTML-Struktur an:
const html = `<!DOCTYPE html>
...
// Deine Custom-Styles hier
...
`;
```

### Prompt optimieren
**Node: "Perplexity Research"** → Body → messages[1].content
```javascript
"Erstelle einen Bericht mit Fokus auf:
- Technische Analyse (RSI, MACD)
- Insider-Trading
- ESG-Bewertung
..."
```

### Zusätzliche Datenquellen
Füge Node hinzu zwischen "Process Input" und "Generate HTML":
```javascript
// Yahoo Finance API
// Alpha Vantage
// FMP (Financial Modeling Prep)
```

---

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe n8n Execution Logs
2. Teste einzelne Nodes manuell
3. Prüfe Perplexity API Status: https://status.perplexity.ai

**Workflow Version:** 1.0  
**Letzte Aktualisierung:** 30. November 2025
