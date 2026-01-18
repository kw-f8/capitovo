# ✅ n8n Workflow v2 - Bereit für Import

## 🎯 Status: READY TO IMPORT

**Datum:** 18. Januar 2026  
**Version:** 2.0  
**Workflow-Datei:** `n8n_analyse_generator_workflow_v2.json`

---

## ✅ Durchgeführte Änderungen

### 1. ✅ Manual Trigger implementiert
- ❌ ~~Webhook Trigger~~ (für später)
- ✅ **Manual Trigger** + **Test Data** Node
- ✅ Test-Daten: Apple (AAPL), Technologie

### 2. ✅ Perplexity API Key direkt integriert
- ✅ API Key: `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`
- ✅ Keine Credentials nötig
- ✅ 2 API-Nodes konfiguriert:
  - **4. Perplexity API** (sonar-pro, parallel 5x)
  - **6. Quality Check** (sonar, 1x)

### 3. ✅ Workflow validiert
- ✅ JSON-Syntax korrekt
- ✅ 17 Nodes verbunden
- ✅ Alle Connections geprüft
- ✅ Standalone-Test erfolgreich

### 4. ✅ Dateistruktur vorbereitet
- ✅ `Abonenten/` existiert
- ✅ `data/` existiert
- ✅ `data/vorschaubilder/` erstellt

---

## 📦 Import-Anleitung

### Schritt 1: n8n öffnen
```bash
# Falls n8n noch nicht läuft:
npx n8n

# Oder wenn installiert:
n8n start
```

### Schritt 2: Workflow importieren
1. Öffne n8n im Browser: `http://localhost:5678`
2. Klicke auf **"+"** (neuer Workflow)
3. Klicke auf **"..."** → **"Import from File"**
4. Wähle: `/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo/n8n/n8n_analyse_generator_workflow_v2.json`
5. Klicke **"Import"**

### Schritt 3: Environment Variable setzen (optional)
```bash
# In n8n UI: Settings → Environment Variables
# Hinzufügen:
BASE_DIR=/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo
TEST_MODE=false  # true = Mock-Content, false = echte API-Calls
```

### Schritt 4: Workflow ausführen
1. Klicke **"Execute Workflow"**
2. Warte ~30-60 Sekunden (5 API-Calls parallel + 1 Quality Check)
3. Prüfe Output in letzter Node **"Output"**

---

## 📊 Erwartetes Ergebnis

### Erfolgreiche Ausführung:
```json
{
  "success": true,
  "company": "Apple",
  "ticker": "AAPL",
  "recommendation": "KAUFEN/HALTEN/VERKAUFEN",
  "qualityScore": 7-10,
  "wordCount": 1000-1500,
  "files": {
    "html": { "success": true, "path": ".../Abonenten/apple-aapl.html" },
    "json": { "success": true, "path": ".../data/analysen.json" },
    "svg": { "success": true, "path": ".../data/vorschaubilder/apple-aapl.svg" }
  }
}
```

### Generierte Dateien:
- ✅ `Abonenten/apple-aapl.html` (Responsive HTML mit Schema.org)
- ✅ `data/analysen.json` (Neuer Eintrag am Anfang)
- ✅ `data/vorschaubilder/apple-aapl.svg` (640x360px Preview)

---

## 🧪 Test-Szenarien

### Test 1: Mock-Modus (kein API-Verbrauch)
```bash
# Environment Variable setzen:
TEST_MODE=true

# Workflow ausführen
# → Geht durch "Mock Content" Node
# → Keine API-Calls
# → Schneller Test der Pipeline
```

### Test 2: Live-Modus (mit API-Calls)
```bash
# Environment Variable:
TEST_MODE=false  # oder leer lassen

# Workflow ausführen
# → 5 API-Calls zu Perplexity sonar-pro
# → 1 API-Call zu Perplexity sonar
# → Kosten: ~$0.10-0.15
# → Dauer: ~30-60 Sekunden
```

### Test 3: Andere Aktien
**Ändere Test Data Node:**
```javascript
return {
  json: {
    body: {
      company: 'Microsoft',
      ticker: 'MSFT',
      sector: 'Technologie',
      date: '2026-01-18'
    }
  }
};
```

---

## 🔍 Fehlerbehandlung

### Problem: "Fehlende Pflichtfelder"
**Lösung:** Prüfe **Test Data** Node → `company` und `ticker` müssen vorhanden sein

### Problem: Perplexity API Error 401
**Ursache:** API Key ungültig oder abgelaufen  
**Lösung:** API Key in beiden Nodes prüfen:
- **4. Perplexity API** → Header: `Authorization`
- **6. Quality Check** → Header: `Authorization`

### Problem: "File write failed"
**Ursache:** Pfade falsch oder keine Schreibrechte  
**Lösung:**
```bash
# Prüfe Verzeichnisse:
ls -la /Users/kevinwaibel/Dokumente/capitovo/Code/capitovo/Abonenten/
ls -la /Users/kevinwaibel/Dokumente/capitovo/Code/capitovo/data/

# Setze BASE_DIR Environment Variable wenn nötig
```

### Problem: Quality Check schlägt fehl
**Kein Problem!** Node hat `continueOnFail: true`  
→ Workflow läuft weiter mit Default-Score 7

---

## 📈 Workflow-Architektur

```
Manual Trigger
  ↓
Test Data (Apple, AAPL)
  ↓
1. Input Validator ✅
  ↓
2. History Loader ✅
  ↓
Test Mode? ❓
  ├─ TRUE → Mock Content (kein API) ✅
  └─ FALSE → Research Orchestrator ✅
              ↓
              Split Prompts (5 Items) ✅
              ↓
              4. Perplexity API (5x parallel) 🌐
              ↓
              Extract Content ✅
              ↓
              5. Content Merger ✅
              ↓
Merge Content ✅
  ↓
6. Quality Check 🌐
  ↓
7. Quality Gate ✅
  ↓
8. HTML Renderer ✅
  ↓
9. File Writer ✅
  ↓
Output ✅
```

**Legende:**
- ✅ = Code Node (lokal)
- 🌐 = HTTP Request (Perplexity API)
- ❓ = IF Node (Verzweigung)

---

## 💰 Kosten pro Analyse

| Komponente | Tokens | Preis* |
|------------|--------|--------|
| 5x Perplexity sonar-pro | ~7.500 | $0.075 |
| 1x Perplexity sonar | ~800 | $0.008 |
| **TOTAL** | **~8.300** | **~$0.083** |

*Preise basierend auf Perplexity API Pricing (Stand: Jan 2026)

---

## 🚀 Nächste Schritte

### Nach erfolgreichem Test:

1. **Webhook aktivieren** (für Production-Nutzung)
   - Ersetze Manual Trigger durch Webhook
   - Endpoint: `/create-analysis-v2`

2. **API Key sichern**
   - Aus Workflow entfernen
   - In n8n Credentials speichern

3. **Automatisierung**
   - Cron-Trigger für regelmäßige Updates
   - Integration mit Earnings Calendar

4. **Monitoring**
   - Quality Scores tracken
   - API-Kosten überwachen
   - Error-Logging einrichten

---

## 📄 Weitere Ressourcen

- **Workflow:** `n8n_analyse_generator_workflow_v2.json`
- **Test-Anleitung:** `WORKFLOW_V2_TEST_ANLEITUNG.md`
- **Optimierung-Doku:** `WORKFLOW_OPTIMIERUNG.md`
- **Test-Skript:** `test_workflow_v2.py`

---

**Status: ✅ BEREIT FÜR IMPORT UND TEST**

Viel Erfolg! 🎉
