# n8n Workflow v2 - Test-Anleitung

## ✅ Änderungen im Workflow

### 1. **Manual Trigger statt Webhook**
- ✅ `Manual Trigger` ersetzt Webhook
- ✅ `Test Data` Node liefert Beispieldaten für Apple (AAPL)

### 2. **Direkte API-Integration**
- ✅ Perplexity API Key direkt im Workflow: `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`
- ✅ Keine Credentials mehr nötig
- ✅ 2 API-Calls: 
  - **4. Perplexity API** (5x parallel für Sektionen)
  - **6. Quality Check** (1x für Bewertung)

### 3. **Test-Modus**
- ✅ Setze `TEST_MODE=true` in n8n Environment Variables für Mock-Content (ohne API-Calls)
- ✅ Setze `TEST_MODE=false` oder lasse es leer für echte API-Calls

---

## 🚀 Workflow in n8n importieren

### Option 1: Über n8n UI
1. Öffne n8n: `http://localhost:5678`
2. Klicke auf **"+"** → **"Import from File"**
3. Wähle: `n8n_analyse_generator_workflow_v2.json`
4. Klicke **"Import"**

### Option 2: Via CLI (wenn n8n lokal läuft)
```bash
cd /Users/kevinwaibel/Dokumente/capitovo/Code/capitovo
n8n import:workflow --input=n8n/n8n_analyse_generator_workflow_v2.json
```

---

## 🧪 Workflow testen

### Test 1: Mit Mock-Content (kein API-Verbrauch)

1. **Environment Variable setzen:**
   - In n8n: Settings → Environment Variables
   - Hinzufügen: `TEST_MODE=true`
   - Speichern & n8n neu starten

2. **Workflow öffnen**
3. **"Execute Workflow" klicken**
4. **Erwartetes Ergebnis:**
   - Sollte durch Mock-Content-Pfad gehen
   - Keine API-Calls zu Perplexity
   - Datei wird erstellt: `Abonenten/apple-aapl.html`
   - JSON wird aktualisiert: `data/analysen.json`

### Test 2: Mit echten API-Calls

1. **Environment Variable ändern:**
   - `TEST_MODE=false` oder Variable löschen

2. **Workflow ausführen**
3. **Was passiert:**
   ```
   Manual Trigger
     → Test Data (company: Apple, ticker: AAPL)
       → 1. Input Validator (validiert & enriched)
         → 2. History Loader (sucht frühere Analysen)
           → Test Mode? (→ FALSE → zu Research)
             → 3. Research Orchestrator (5 Prompts generieren)
               → Split Prompts (5 parallele Items)
                 → 4. Perplexity API (5x parallel) ⚠️ API-CALLS
                   → Extract Content
                     → 5. Content Merger (vereint Sektionen)
                       → Merge Content
                         → 6. Quality Check ⚠️ API-CALL
                           → 7. Quality Gate (Score auswerten)
                             → 8. HTML Renderer
                               → 9. File Writer
                                 → Output
   ```

4. **Erwartete Kosten:**
   - 5 API-Calls à ~1.500 Tokens (Perplexity sonar-pro)
   - 1 API-Call à ~800 Tokens (Perplexity sonar)
   - **Total:** ~8.000-10.000 Tokens
   - **Preis:** ~$0.10-0.15 (bei Perplexity Pricing)

### Test 3: Verschiedene Aktien testen

Ändere die **Test Data** Node:

```javascript
// Beispiel: Tesla
return {
  json: {
    body: {
      company: 'Tesla',
      ticker: 'TSLA',
      sector: 'Technologie',
      date: '2026-01-18'
    }
  }
};
```

Andere Beispiele:
```javascript
// Microsoft
{ company: 'Microsoft', ticker: 'MSFT', sector: 'Technologie' }

// SAP (deutsche Aktie)
{ company: 'SAP', ticker: 'SAP', sector: 'Technologie' }

// Johnson & Johnson
{ company: 'Johnson & Johnson', ticker: 'JNJ', sector: 'Gesundheit' }
```

---

## 🔍 Debugging

### Problem: "Fehlende Pflichtfelder"
**Ursache:** `company` oder `ticker` fehlt in Test Data  
**Lösung:** Prüfe Test Data Node

### Problem: "File write failed"
**Ursache:** `BASE_DIR` nicht gesetzt  
**Lösung:** 
- Setze Environment Variable: `BASE_DIR=/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo`
- Oder ändere im Input Validator: `const baseDir = $env.BASE_DIR || '/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo';`

### Problem: Perplexity API Error 401
**Ursache:** API Key ungültig  
**Lösung:** Prüfe API Key in Nodes **4. Perplexity API** und **6. Quality Check**

### Problem: Quality Check schlägt fehl
**Lösung:** Kein Problem! `continueOnFail: true` ist gesetzt → Workflow läuft weiter mit Default-Score 7

### Problem: Keine Dateien werden erstellt
**Debugging:**
1. Öffne **9. File Writer** Output
2. Prüfe `results.html.success`, `results.json.success`, `results.svg.success`
3. Prüfe Pfade in Error-Messages

---

## 📊 Erwartete Outputs

### 1. HTML-Datei
**Pfad:** `Abonenten/apple-aapl.html`

**Inhalt:**
- Responsive HTML mit Tailwind CSS
- Structured Data (Schema.org)
- 5 Sektionen: Marktbewertung, Fundamentaldaten, Wettbewerb, Risiken, Investment-These
- Empfehlungs-Badge (KAUFEN/HALTEN/VERKAUFEN)
- Quality Score Anzeige
- Footer mit Disclaimer

### 2. JSON-Eintrag
**Pfad:** `data/analysen.json`

**Neuer Eintrag:**
```json
{
  "id": "aapl-2026-01-18",
  "category": "Technologie",
  "title": "Apple: Equity-Research-Bericht",
  "summary": "KAUFEN – Apple Aktienanalyse mit Kursziel 210.00 USD.",
  "link": "Abonenten/apple-aapl.html",
  "image": "data/vorschaubilder/apple-aapl.svg",
  "date": "2026-01-18",
  "author": "capitovo Research",
  "tags": ["Apple", "AAPL", "Technologie", "KAUFEN"],
  "published": true,
  "recommendation": "KAUFEN",
  "priceTarget": 210,
  "qualityScore": 8,
  "wordCount": 1250,
  "isUpdate": false
}
```

### 3. SVG Vorschaubild
**Pfad:** `data/vorschaubilder/apple-aapl.svg`

**Design:**
- 640x360px
- Dunkelblauer Gradient-Hintergrund
- Ticker (AAPL)
- Company Name (Apple)
- Empfehlungs-Badge mit Farbcodierung
- Datum & Sektor

---

## 🎯 Erfolgs-Kriterien

✅ **Workflow läuft ohne Fehler durch**  
✅ **HTML-Datei wird erstellt**  
✅ **JSON wird aktualisiert**  
✅ **SVG wird generiert**  
✅ **Quality Score ≥ 6**  
✅ **Empfehlung ist klar: KAUFEN/HALTEN/VERKAUFEN**  
✅ **Alle 5 Sektionen sind vorhanden**  

---

## 🛠️ Nächste Schritte nach erfolgreichem Test

1. **Webhook wieder aktivieren** (für Production)
2. **Environment Variables sichern** (`BASE_DIR`, `TEST_MODE`)
3. **API Key sicher speichern** (n8n Credentials statt Hardcoding)
4. **Rate Limiting prüfen** (Perplexity API Limits)
5. **Backup-Strategie** für `analysen.json` einrichten
6. **Monitoring** für Quality Scores < 6

---

**Viel Erfolg beim Testen! 🚀**
