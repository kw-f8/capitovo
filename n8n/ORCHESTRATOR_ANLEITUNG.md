# 🎛️ Capitovo Orchestrator - Zentrale Steuerung

## 📋 Übersicht

Der **Orchestrator** ist das zentrale Dashboard für alle Capitovo n8n-Workflows. Er ermöglicht die einheitliche Steuerung aller Funktionen über ein einziges Formular.

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎛️ CAPITOVO ORCHESTRATOR                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │ Formular │───▶│ Route Action │───▶│ Sub-Workflows      │   │
│  │ Trigger  │    │              │    │                    │   │
│  └──────────┘    └──────────────┘    │ ├─ Neue Analyse    │   │
│                                       │ ├─ Analyse löschen │   │
│                                       │ ├─ Content Strategy│   │
│                                       │ ├─ Status-Übersicht│   │
│                                       │ └─ Support Emails  │   │
│                                       └────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Funktionen

| Aktion | Beschreibung | Erforderliche Parameter |
|--------|--------------|------------------------|
| 🆕 **Neue Analyse** | Erstellt KI-Analyse für ein Unternehmen | Ticker-Symbol |
| 🗑️ **Analyse löschen** | Entfernt Analyse aus GitHub | Slug + Bestätigung |
| 📈 **Content-Strategie** | Zeigt Strategie-Empfehlungen | Keine |
| 📊 **Status-Übersicht** | Zeigt alle Analysen + System-Status | Keine |
| 📧 **Support-Emails** | Info über Email-Verarbeitung | Keine |

---

## ⚙️ Installation

### 1. Workflow importieren

```bash
# In n8n:
# 1. Gehe zu "Workflows" → "Import from File"
# 2. Wähle `n8n_orchestrator.json`
# 3. Klicke auf "Import"
```

### 2. Credentials prüfen

Der Orchestrator verwendet:
- **GitHub Token** (ID: `iCAWAEqg10f57flt`)
- **Alpha Vantage API** (bereits im Code: `YO8C9ZRNBDVLAZ83`)

Stelle sicher, dass der GitHub Token existiert:
```bash
# In n8n:
# Credentials → suche "GitHub Token"
# Falls nicht vorhanden: Neu erstellen (Header Auth)
# Header Name: Authorization
# Header Value: Bearer ghp_DEIN_TOKEN
```

### 3. Workflow aktivieren

```bash
# In n8n:
# Öffne den Orchestrator Workflow
# Klicke auf "Activate" (oben rechts)
```

---

## 🌐 Webhook URLs

Nach Aktivierung sind folgende URLs verfügbar:

| Endpoint | URL |
|----------|-----|
| **Orchestrator Formular** | `https://DEINE-N8N-URL/form/capitovo-orchestrator` |
| **Test-URL** | `https://DEINE-N8N-URL/webhook-test/capitovo-orchestrator` |

---

## 📖 Verwendung

### Option 1: Web-Formular (Empfohlen)

1. Öffne die Formular-URL im Browser
2. Wähle die gewünschte Aktion aus dem Dropdown
3. Fülle die erforderlichen Felder aus
4. Klicke auf "Submit"

### Option 2: API-Aufruf

```bash
# Beispiel: Neue Analyse erstellen
curl -X POST "https://DEINE-N8N-URL/webhook/capitovo-orchestrator" \
  -H "Content-Type: application/json" \
  -d '{
    "Aktion": "🆕 Neue Analyse erstellen",
    "Ticker-Symbol (nur für neue Analyse)": "NVDA",
    "Unternehmensname (optional)": "NVIDIA Corporation"
  }'

# Beispiel: Status-Übersicht
curl -X POST "https://DEINE-N8N-URL/webhook/capitovo-orchestrator" \
  -H "Content-Type: application/json" \
  -d '{
    "Aktion": "📊 Status-Übersicht anzeigen"
  }'

# Beispiel: Analyse löschen
curl -X POST "https://DEINE-N8N-URL/webhook/capitovo-orchestrator" \
  -H "Content-Type: application/json" \
  -d '{
    "Aktion": "🗑️ Analyse löschen",
    "Slug zum Löschen (nur für Analyse löschen)": "nvidia_2026-01-30",
    "Bestätigung für Löschung": "Ja, unwiderruflich löschen"
  }'
```

### Option 3: Manuell in n8n

1. Öffne den Workflow
2. Klicke auf "Test Workflow"
3. Gib die Formulardaten ein

---

## 🔄 Integration mit bestehenden Workflows

### Architektur

```
                    ┌─────────────────┐
                    │   ORCHESTRATOR  │
                    │  (Einstiegspunkt)│
                    └────────┬────────┘
                             │
        ┌────────────┬───────┴───────┬────────────┬─────────────┐
        ▼            ▼               ▼            ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌─────────┐  ┌──────────┐
   │  Neue   │  │ Analyse │   │ Content  │  │  Status │  │ Support  │
   │ Analyse │  │ löschen │   │ Strategy │  │Übersicht│  │  Emails  │
   └─────────┘  └─────────┘   └──────────┘  └─────────┘  └──────────┘
        │            │               │            │             │
        ▼            ▼               ▼            ▼             ▼
   (bereitet       (löscht       (Info-        (liest       (Info-
    Daten vor)     HTML)         Ausgabe)      Katalog)     Ausgabe)
```

### Volle Pipeline einrichten

Um die **komplette KI-Analyse** inkl. Veröffentlichung zu nutzen, musst du:

1. **Orchestrator** für Steuerung
2. **Generator-Workflow** (`n8n_generator_veröffentlichen_löschen.json`) für KI-Generierung

**Zukünftige Erweiterung:** Sub-Workflow-Aufrufe (Execute Workflow Node) für nahtlose Integration.

---

## 📊 Workflow-Struktur

```
🎛️ Orchestrator Formular
    │
    └─▶ Route by Action (Switch Node)
            │
            ├─▶ [0] 🆕 Neue Analyse
            │       └─▶ Validate New Analysis
            │               └─▶ Fetch Company Data (Alpha Vantage)
            │                       └─▶ Prepare Analysis Data
            │                               └─▶ New Analysis Output
            │
            ├─▶ [1] 🗑️ Analyse löschen
            │       └─▶ Validate Delete
            │               └─▶ Get HTML SHA (GitHub)
            │                       └─▶ Delete HTML
            │                               └─▶ Delete Output
            │
            ├─▶ [2] 📈 Content-Strategie
            │       └─▶ Content Strategy Info
            │
            ├─▶ [3] 📊 Status-Übersicht
            │       └─▶ Fetch Catalog (GitHub)
            │               └─▶ Analyze Status
            │                       └─▶ Status Output
            │
            └─▶ [4] 📧 Support-Emails
                    └─▶ Support Emails Info
```

---

## 🛠️ Erweiterungsmöglichkeiten

### 1. Sub-Workflow Integration

Verbinde den Orchestrator mit vollständigen Workflows:

```javascript
// In n8n: Execute Workflow Node hinzufügen
// Source: Database → From list
// Workflow: "Capitovo - Generator, Veröffentlichen & Löschen"
// Mode: Run once with all items
```

### 2. Slack-Benachrichtigungen

Füge am Ende jeder Route einen Slack-Node hinzu:

```javascript
// Nach jedem Output-Node:
// Slack → Send Message
// Channel: #capitovo-alerts
// Message: {{ $json.result }}
```

### 3. Logging & Monitoring

```javascript
// Hinzufügen: Code Node für Logging
const logEntry = {
  timestamp: new Date().toISOString(),
  action: $json.action,
  user: 'orchestrator',
  success: true
};
// Speichern in DB oder File
```

### 4. Automatische Zeitpläne

Nutze den Schedule Trigger für regelmäßige Aktionen:

```json
{
  "cronExpression": "0 9 * * 1",
  "comment": "Jeden Montag 9:00 - Content Strategy"
}
```

---

## 🐛 Troubleshooting

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| "Ticker-Symbol ist erforderlich" | Feld "Ticker-Symbol" ausfüllen bei neuer Analyse |
| "Keine Bestätigung" | Bei Löschen: "Ja, unwiderruflich löschen" wählen |
| GitHub API Fehler | Token-Berechtigungen prüfen |
| Alpha Vantage 404 | Ticker existiert nicht oder API-Limit erreicht |

### Debug-Modus

```bash
# In n8n:
# Settings → Execution → Save Execution Progress: Always
# Damit werden alle Schritte gespeichert
```

---

## 📁 Zusammenhang mit anderen Workflows

| Workflow | Funktion | Orchestrator-Integration |
|----------|----------|-------------------------|
| `n8n_generator_veröffentlichen_löschen.json` | Vollständige Analyse-Pipeline | Kann aufgerufen werden |
| Content Strategy Agent | Marktanalyse | Info-Ausgabe |
| Support Email Agent | Email-Verarbeitung | Info-Ausgabe |

---

## 🔮 Zukünftige Features

- [ ] **Execute Workflow Nodes**: Direkte Ausführung von Sub-Workflows
- [ ] **Webhook-Responses**: JSON-Antworten statt nur Text
- [ ] **Batch-Operationen**: Mehrere Analysen gleichzeitig
- [ ] **Dashboard-Integration**: Übersicht aller laufenden Workflows
- [ ] **Error-Handling**: Automatische Retry bei Fehlern
- [ ] **Audit-Log**: Komplette Historie aller Aktionen

---

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/kw-f8/capitovo/issues
- n8n Community: https://community.n8n.io/

---

*Letzte Aktualisierung: 31. Januar 2026*
