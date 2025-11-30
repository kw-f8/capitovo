# 📊 Content Strategy Agent - Setup & Verwendung

## 🎯 Was macht dieser Agent?

Der **Content Strategy Agent** analysiert automatisch:

1. ✅ **Bestehende Analysen** - Was wurde bereits veröffentlicht?
2. 📈 **Marktrelevanz** - Welche Unternehmen sind aktuell im Fokus?
3. 🎭 **Sektor-Balance** - Welche Bereiche fehlen noch?
4. ⚡ **Zeitkritische Events** - Earnings, News, Catalysts
5. 🔥 **Investoren-Interesse** - Hohe Handelsvolumina, Trending Topics

**Output:** Eine priorisierte Liste der 3 besten Kandidaten für die nächste Analyse + vollständiger Strategiereport als Markdown.

---

## 🚀 Installation

### 1. Workflow importieren

```bash
# In n8n:
# Settings > Import from File > n8n_content_strategy_agent_workflow.json
```

### 2. Perplexity API konfigurieren

Gleiche Credentials wie beim Analyse-Generator:
- **Type:** Header Auth
- **Name:** `perplexity-api-key`
- **Header Name:** `Authorization`
- **Value:** `Bearer YOUR_API_KEY`

### 3. Slack Webhook (optional)

Für Benachrichtigungen bei neuen Empfehlungen.

---

## ⚙️ Konfiguration

### Schedule Trigger anpassen

Standard: **Jeden Montag um 9:00 Uhr**

```json
{
  "cronExpression": "0 9 * * 1"
}
```

**Andere Beispiele:**
- Täglich 9 Uhr: `0 9 * * *`
- Jeden Mittwoch + Sonntag: `0 9 * * 3,0`
- Alle 3 Tage: `0 9 */3 * *`

### Dateipfade prüfen

Im Node **"Load Existing Analyses"**:
```javascript
const analysenPath = '/workspaces/capitovo/data/analysen.json';
```

Im Node **"Generate Report"**:
```javascript
const reportPath = `/workspaces/capitovo/n8n/content_strategy_report_${date}.md`;
```

---

## 🔄 Workflow-Ablauf

```
Schedule Trigger (jeden Montag 9:00)
    ↓
Load Existing Analyses (analysen.json lesen)
    ↓
    ├─> Content Strategy Agent (Empfehlungen)
    │       ↓
    │   Parse Recommendations
    │       
    └─> Market Intelligence Agent (aktuelle News)
            ↓
        Parse Market Intel
            
    ↓ (beide zusammenführen)
Combine Insights
    ↓
Generate Report (Markdown erstellen)
    ↓
    ├─> Slack Notification
    └─> Trigger Analysis Workflow (optional, disabled)
```

---

## 📋 Verwendung

### Automatisch (Schedule)

Der Agent läuft automatisch nach dem konfigurierten Zeitplan und erstellt wöchentliche Reports.

### Manuell starten

1. In n8n: Workflow öffnen
2. Auf **"Execute Workflow"** klicken
3. Report wird sofort generiert

### Via Webhook (falls gewünscht)

Trigger ändern von `scheduleTrigger` zu `webhook`:

```bash
curl -X POST https://your-n8n-instance.com/webhook/content-strategy
```

---

## 📄 Generated Report

### Dateiname
```
content_strategy_report_2025-11-30.md
```

### Inhalt

**1. Top-Empfehlung**
- Unternehmen + Ticker
- Investment Story
- Begründung
- Aktuelle Catalysts
- Priorität (0-10)

**2. Alternative Empfehlungen**
- 2-3 weitere Kandidaten
- Kürzere Beschreibung

**3. Marktkontext**
- Aktuelle Trends
- Zeitkritische Events
- Trending Sectors
- Upcoming Earnings
- Hot Stocks

**4. Nächste Schritte**
- Konkrete Handlungsempfehlungen
- Webhook-Befehl für automatische Analyse

---

## 🎬 Integration mit Analyse-Generator

### Option 1: Manuell

Report lesen → Top-Empfehlung notieren → Analyse-Workflow manuell starten

### Option 2: Semi-Automatisch

1. Report ansehen in Slack-Benachrichtigung
2. Bei Zustimmung: Webhook-Befehl aus Report kopieren
3. In Terminal ausführen → Analyse wird erstellt

### Option 3: Vollautomatisch

Node **"Trigger Analysis Workflow"** aktivieren:

```javascript
// In Workflow-JSON, Node "trigger-analysis-workflow"
"disabled": false  // von true auf false ändern
```

Dann Webhook-URL des Analyse-Generators eintragen:
```javascript
"url": "https://your-n8n.com/webhook/create-analysis"
```

**⚠️ Vorsicht:** Erstellt automatisch Analysen ohne Review!

---

## 🧠 Agent-Logik

### Content Strategy Agent

**Prompt-Fokus:**
- Marktrelevanz und News der letzten 24h
- Sektor-Diversifikation basierend auf bestehenden Analysen
- Investoren-Nachfrage (Handelsvolumen, Sentiment)
- Story-Potenzial für Retail-Investoren
- Deutsche Relevanz (DAX, MDAX, beliebte Aktien)

**Perplexity Settings:**
- `model: sonar-pro`
- `temperature: 0.3` (kreativ genug für Vorschläge, aber nicht zu random)
- `search_recency_filter: day` (nur aktuelle Daten)

### Market Intelligence Agent

**Prompt-Fokus:**
- Schlagzeilen der letzten 48h
- Deutsche + US Hot Stocks
- Upcoming Earnings (nächste 2 Wochen)
- Ungewöhnliche Handelsvolumina
- Trending Sectors

**Perplexity Settings:**
- `model: sonar-pro`
- `temperature: 0.2` (faktisch, präzise)
- `search_recency_filter: day`

---

## 🎯 Bewertungskriterien

Der Agent bewertet Kandidaten nach:

| Kriterium | Gewichtung | Beschreibung |
|-----------|-----------|--------------|
| **Aktualität** | 30% | News, Earnings, Events in den nächsten 2 Wochen |
| **Diversifikation** | 25% | Sektor unterrepräsentiert in bestehenden Analysen |
| **Nachfrage** | 20% | Handelsvolumen, Google Trends, Social Media |
| **Story** | 15% | Spannende Investment-Thesis, klar kommunizierbar |
| **Relevanz DE** | 10% | DAX, MDAX, oder für deutsche Investoren interessant |

**Priorität-Score:** 0-10 Punkte

---

## 📊 Beispiel-Output

```markdown
# 📊 Content Strategy Report
**Generiert am:** 30.11.2025

---

## 🎯 TOP-EMPFEHLUNG

### NVIDIA Corporation (NVDA)

**Sektor:** TECHNOLOGIE  
**Priorität:** 9/10

#### 💡 Investment Story
Marktführer im KI-Chip-Segment mit explosivem Wachstum durch GPT-4 und
Enterprise-AI-Lösungen. Massive Nachfrage übersteigt Produktionskapazität.

#### 📈 Begründung
NVIDIA meldet morgen Q3-Earnings. Analysten erwarten +170% YoY Revenue-
Wachstum. Neue H100-Chips ausverkauft bis Q2 2026. Microsoft, Amazon, 
Tesla als Großkunden bestätigt.

#### ⚡ Aktuelle Catalysts
- Earnings Release: 01.12.2025 (in 1 Tag!)
- Neue Chip-Generation Ankündigung erwartet
- Handelsvolumen +240% über Durchschnitt
- 15 Analystenupgrades in letzten 2 Wochen

---

## 🥈 Alternative Empfehlungen

### 2. SAP SE (SAP)
**Sektor:** TECHNOLOGIE | **Priorität:** 8/10  
**Story:** Cloud-Transformation zeigt Erfolge, starkes Q3, DAX-Favorit  
**Grund:** Deutsche Relevanz, unterrepräsentiert in Portfolio

### 3. Novo Nordisk (NVO)
**Sektor:** GESUNDHEIT | **Priorität:** 7/10  
**Story:** Wegovy-Boom treibt Rekordumsätze im Adipositas-Markt  
**Grund:** Healthcare fehlt komplett, defensive Beimischung

---

...
```

---

## 🔧 Troubleshooting

### "No recommendations found"

**Ursache:** Perplexity-Response hat falsches Format

**Lösung:** 
```javascript
// In "Parse Recommendations" Node, Regex prüfen:
const sectionRegex = new RegExp(`##\\s*�${rank}`, 'i');
```

### "analysen.json nicht gefunden"

**Ursache:** Falscher Pfad

**Lösung:**
```bash
# Pfad prüfen
ls -la /workspaces/capitovo/data/analysen.json

# In Node "Load Existing Analyses" anpassen
const analysenPath = '/correct/path/to/analysen.json';
```

### Keine Slack-Benachrichtigung

**Ursache:** Webhook nicht konfiguriert

**Lösung:**
1. Slack-Node deaktivieren (optional) oder
2. Webhook konfigurieren in n8n Credentials

---

## 🎨 Anpassungen

### Andere Sektoren priorisieren

Im Prompt des **"Content Strategy Agent"** ändern:

```javascript
"Priorisiere folgende Sektoren: HEALTHCARE, ENERGIE, FINANZEN..."
```

### Nur deutsche Aktien

```javascript
"Empfehle NUR Unternehmen aus DAX, MDAX oder TecDAX..."
```

### Mehr/weniger Empfehlungen

Standard: Top 3

```javascript
// Für Top 5:
"Empfehle DIE 5 besten Unternehmen für die nächste Analyse..."

// Im Parse-Node entsprechend anpassen:
const recommendations = [
  extractRecommendation(response, 1),
  extractRecommendation(response, 2),
  extractRecommendation(response, 3),
  extractRecommendation(response, 4),
  extractRecommendation(response, 5)
].filter(r => r !== null);
```

---

## 📈 Best Practices

### 1. Wöchentliche Review

- Jeden Montag Report lesen
- Top-Empfehlung bewerten
- Bei Zustimmung: Analyse starten

### 2. Pipeline Management

- Top 3 im Blick behalten
- Bei zeitkritischen Catalysts (Earnings) priorisieren
- Sektor-Balance beachten

### 3. Kombination mit anderen Tools

- **Google Trends:** Suchvolumen verifizieren
- **Seeking Alpha:** Analyst-Konsensus prüfen
- **FinViz:** Technische Analyse

### 4. Feedback-Loop

Nach jeder veröffentlichten Analyse:
- Performance tracken (Views, Engagement)
- Mit Agent-Empfehlung vergleichen
- Erkenntnisse für Prompts nutzen

---

## 🚀 Advanced Features

### A/B-Testing

Zwei Versionen des Strategy Agent parallel laufen lassen:
- Version A: Fokus auf News + Catalysts
- Version B: Fokus auf fundamentale Unterbewertung

→ Performance vergleichen

### Sentiment Analysis

Zusätzlichen Node hinzufügen:
```javascript
// Twitter/Reddit Sentiment für Top-3-Kandidaten
// Positive Sentiment → Boost in Priority Score
```

### Backtest

Historische Reports analysieren:
- Welche Empfehlungen hatten beste Performance?
- Muster erkennen
- Prompt optimieren

---

## 📚 Ressourcen

- **Perplexity API Docs:** https://docs.perplexity.ai
- **n8n Docs:** https://docs.n8n.io
- **Cron Expression Generator:** https://crontab.guru

---

## 💡 Ideen für Erweiterungen

1. **Multi-Timeframe Analyse**
   - Short-term (1-2 Wochen): News, Catalysts
   - Long-term (3-6 Monate): Fundamentale Unterbewertung

2. **User-Voting Integration**
   - Community abstimmen lassen über nächste Analyse
   - Agent kombiniert Votes mit eigenen Insights

3. **Konkurrenz-Monitoring**
   - Welche Aktien analysieren andere Finanz-Portale?
   - Gaps identifizieren (hohe Nachfrage, wenig Content)

4. **Saisonale Patterns**
   - Q4: Retail + E-Commerce
   - Januar: "Januar-Effekt" Small Caps
   - Earnings Season: Blue Chips

---

**Viel Erfolg mit der Content-Strategie! 🚀📊**
