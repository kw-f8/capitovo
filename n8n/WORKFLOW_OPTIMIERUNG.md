# 📊 Workflow-Optimierung: capitovo Analyse Generator

## Executive Summary

Der bestehende Workflow ist **funktional, aber architektonisch problematisch** für einen professionellen Börsenbrief mit Publikationsanspruch. Die Hauptdefizite liegen in:

1. **Monolithischer Aufbau** – keine Trennung von Verantwortlichkeiten
2. **Unzureichende KI-Steuerung** – ein generischer Prompt für komplexe Finanzanalysen
3. **Fehlende Qualitätssicherung** – kein Review, keine Validierung
4. **Keine Historienfähigkeit** – frühere Analysen werden nicht berücksichtigt
5. **Inflexible Output-Pipeline** – nur HTML, keine Erweiterbarkeit

---

## 1. Architektonische Analyse (IST-Zustand)

### 1.1 Kritische Schwachstellen

```
┌─────────────────────────────────────────────────────────────────┐
│  IST-ARCHITEKTUR: Monolithischer Single-Pass-Workflow           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Webhook → Input → [Test?] → KI-Prompt → MD→HTML → File-Write  │
│                       │                                         │
│                       └→ Mock                                   │
│                                                                 │
│  PROBLEME:                                                      │
│  ❌ Single Point of Failure: Perplexity-Ausfall = Totalausfall │
│  ❌ Keine Fehlerbehandlung bei API-Timeouts                     │
│  ❌ Tight Coupling: KI-Output direkt in Rendering               │
│  ❌ Keine Zwischenspeicherung / Caching                         │
│  ❌ Keine Parallelisierung möglich                              │
│  ❌ Keine Audit-Trail / Logging                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Identifizierte Risiken

| Risiko | Schwere | Beschreibung |
|--------|---------|--------------|
| **Single Prompt** | Hoch | Ein generischer Prompt für alle Sektoren, Unternehmensgrößen, Marktphasen |
| **Keine Validierung** | Hoch | Halluzinierte Zahlen werden direkt publiziert |
| **Keine Versionierung** | Mittel | Frühere Analysen gehen verloren bei Updates |
| **Keine Redundanzkontrolle** | Mittel | Serienanalysen wiederholen sich textlich |
| **Monolithischer Output** | Mittel | Nur HTML-Format, keine PDF/Mail-Erweiterung |
| **Fehlende Fehlerbehandlung** | Hoch | API-Fehler führen zu Workflow-Abbruch |

---

## 2. SOLL-Architektur (Ziel-Workflow)

### 2.1 Modulare Pipeline-Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SOLL-ARCHITEKTUR: Modulare Multi-Stage-Pipeline                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────┐  │
│  │  INTAKE  │ →  │  RESEARCH    │ →  │  EDITORIAL  │ →  │  PUBLISH  │  │
│  │  STAGE   │    │  STAGE       │    │  STAGE      │    │  STAGE    │  │
│  └──────────┘    └──────────────┘    └─────────────┘    └───────────┘  │
│       │                │                   │                  │         │
│       ▼                ▼                   ▼                  ▼         │
│  • Webhook         • Daten-API        • Quality-Check    • HTML        │
│  • Input-Valid.    • KI-Research      • Fact-Check       • JSON        │
│  • Meta-Enrichm.   • Multi-Prompt     • Style-Review     • SVG         │
│  • History-Chk.    • Caching          • Length-Ctrl.     • Notif.      │
│                                                                         │
│  VORTEILE:                                                              │
│  ✅ Jede Stage kann isoliert getestet werden                           │
│  ✅ Fehler in Stage 2 → Retry ohne Stage 1                             │
│  ✅ Parallelisierung in Research-Stage                                 │
│  ✅ Caching zwischen Stages                                            │
│  ✅ Audit-Trail pro Stage                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Detaillierte Stage-Definition

#### **Stage 1: INTAKE (Eingangsverarbeitung)**

```
┌─────────────────────────────────────────────────────────────────┐
│  INTAKE STAGE                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Webhook Receiver                                            │
│     └─ Body-Validierung (company, ticker, sector required)      │
│                                                                 │
│  2. Input Normalizer                                            │
│     └─ Ticker → Uppercase                                       │
│     └─ Sector → Mapping auf Standard-Kategorien                 │
│     └─ Slug-Generierung                                         │
│                                                                 │
│  3. Meta-Enrichment                                             │
│     └─ ISIN-Lookup (optional)                                   │
│     └─ Exchange-Detection (NYSE, NASDAQ, XETRA)                 │
│     └─ Currency-Detection                                       │
│                                                                 │
│  4. History Check                                               │
│     └─ Frühere Analysen zu diesem Ticker laden                  │
│     └─ Delta-Erkennung (was hat sich geändert?)                 │
│     └─ Update vs. Neuanalyse entscheiden                        │
│                                                                 │
│  OUTPUT: Enriched-Input-Object                                  │
│  {                                                              │
│    company, ticker, sector, date, slug,                         │
│    isin, exchange, currency,                                    │
│    previousAnalysis: { date, summary, recommendation },         │
│    analysisType: "new" | "update" | "quarterly"                 │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

#### **Stage 2: RESEARCH (Multi-Prompt KI-Pipeline)**

```
┌─────────────────────────────────────────────────────────────────┐
│  RESEARCH STAGE (Parallelisierte KI-Pipeline)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Enriched-Input                                                 │
│       │                                                         │
│       ├──┬──┬──┬──┬──┐  (Parallel)                             │
│       │  │  │  │  │  │                                          │
│       ▼  ▼  ▼  ▼  ▼  ▼                                          │
│      [1][2][3][4][5][6]  ← Spezialisierte Prompts               │
│       │  │  │  │  │  │                                          │
│       └──┴──┴──┴──┴──┘                                          │
│              │                                                  │
│              ▼                                                  │
│       Content Merger                                            │
│              │                                                  │
│              ▼                                                  │
│       Raw-Research-Object                                       │
│                                                                 │
│  PROMPTS:                                                       │
│  [1] Marktbewertung & Kurs-Performance                          │
│  [2] Fundamentaldaten & Kennzahlen                              │
│  [3] Wettbewerbsanalyse & Marktposition                         │
│  [4] Risiken & Katalysatoren                                    │
│  [5] Investment-These & Empfehlung                              │
│  [6] Executive Summary (basierend auf 1-5)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### **Stage 3: EDITORIAL (Qualitätssicherung)**

```
┌─────────────────────────────────────────────────────────────────┐
│  EDITORIAL STAGE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Raw-Research-Object                                            │
│       │                                                         │
│       ▼                                                         │
│  1. Quality-Check Agent                                         │
│     └─ Fact-Validation (Kennzahlen plausibel?)                  │
│     └─ Completeness-Check (alle Sections vorhanden?)            │
│     └─ Consistency-Check (Empfehlung passt zu Analyse?)         │
│     └─ Score: 1-10                                              │
│       │                                                         │
│       ▼                                                         │
│  2. Style-Review Agent                                          │
│     └─ Sprachstil prüfen (Börsenbrief-Ton)                      │
│     └─ Redundanzen entfernen                                    │
│     └─ Plagiatsprüfung (gegen frühere Analysen)                 │
│       │                                                         │
│       ▼                                                         │
│  3. Length-Controller                                           │
│     └─ Target: 3-4 DIN A4 (ca. 2000-2500 Wörter)                │
│     └─ Kürzen oder Erweitern je nach Bedarf                     │
│       │                                                         │
│       ▼                                                         │
│  4. Decision Gate                                               │
│     └─ Score >= 7 → Weiter zu Publish                           │
│     └─ Score < 7  → Alert + Manual Review Queue                 │
│                                                                 │
│  OUTPUT: Validated-Content-Object                               │
│  {                                                              │
│    content: { markdown, sections },                             │
│    qualityScore: 8,                                             │
│    wordCount: 2340,                                             │
│    validatedAt: "2026-01-18T..."                                │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

#### **Stage 4: PUBLISH (Multi-Format-Output)**

```
┌─────────────────────────────────────────────────────────────────┐
│  PUBLISH STAGE (Multi-Format-Pipeline)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Validated-Content                                              │
│       │                                                         │
│       ├──┬──┬──┬──┐  (Parallel)                                │
│       │  │  │  │  │                                             │
│       ▼  ▼  ▼  ▼  ▼                                             │
│      HTML SVG JSON PDF Mail                                     │
│       │  │  │  │  │                                             │
│       └──┴──┴──┴──┘                                             │
│              │                                                  │
│              ▼                                                  │
│       File-Writer (atomic writes)                               │
│              │                                                  │
│              ▼                                                  │
│       Notification Dispatcher                                   │
│              │                                                  │
│              ▼                                                  │
│       Response Builder                                          │
│                                                                 │
│  OUTPUTS:                                                       │
│  • HTML: Abonenten/{slug}.html                                  │
│  • SVG:  data/vorschaubilder/{slug}.svg                         │
│  • JSON: data/analysen.json (Entry)                             │
│  • PDF:  exports/pdf/{slug}.pdf (optional)                      │
│  • Mail: Newsletter-Queue (optional)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. KI-Strategie: Spezialisierte Prompts

### 3.1 Prompt-Hierarchie

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT-ARCHITEKTUR                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MASTER-SYSTEM-PROMPT (für alle Research-Calls)                 │
│  ├── Rolle: Senior Equity Analyst                               │
│  ├── Stil: Deutscher Börsenbrief, sachlich-analytisch           │
│  ├── Constraints: Keine Disclaimer, keine Spekulation           │
│  └── Format: Markdown mit ## Überschriften                      │
│                                                                 │
│  SECTION-PROMPTS (spezialisiert)                                │
│  ├── [1] Marktbewertung                                         │
│  │       └── Fokus: Kurs, Marktkapitalisierung, 52W-Range       │
│  ├── [2] Fundamentaldaten                                       │
│  │       └── Fokus: KGV, KBV, EV/EBITDA, Margins, Schulden      │
│  ├── [3] Wettbewerb                                             │
│  │       └── Fokus: Marktposition, Peers, Moat-Analyse          │
│  ├── [4] Risiken & Katalysatoren                                │
│  │       └── Fokus: Regulatorik, Zyklus, Management, Events     │
│  ├── [5] Investment-These                                       │
│  │       └── Fokus: Bull/Bear-Case, Kursziel, Empfehlung        │
│  └── [6] Executive Summary                                      │
│          └── Input: Ergebnisse von 1-5, Synthese                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Konkrete Prompt-Definitionen

#### Master-System-Prompt

```
Du agierst als Senior Equity Research Analyst für einen deutschsprachigen 
Börsenbrief mit professionellem Publikum. 

STIL-VORGABEN:
- Sachlich-analytisch, keine emotionalen Formulierungen
- Präzise Zahlenangaben mit Quellenkontext (z.B. "laut Q3-Bericht")
- Keine Floskeln wie "Es bleibt abzuwarten" oder "Die Zukunft wird zeigen"
- Keine Disclaimer oder Risikohinweise (werden separat hinzugefügt)
- Keine Spekulationen, nur belegbare Fakten und begründete Einschätzungen

FORMAT:
- Markdown mit ## für Hauptüberschriften
- Bullet Points für Aufzählungen
- Tabellen für Kennzahlenvergleiche (falls sinnvoll)
- Fettdruck für wichtige Zahlen und Empfehlungen

SPRACHE: Deutsch
```

#### Section-Prompt: Marktbewertung

```
Analysiere die aktuelle Marktbewertung von {COMPANY} ({TICKER}):

PFLICHTINHALTE:
1. Aktueller Aktienkurs (mit Währung und Datum)
2. Marktkapitalisierung
3. 52-Wochen-Hoch/Tief mit prozentualem Abstand
4. Performance YTD und 12 Monate
5. Vergleich zum Sektorindex

LÄNGE: 150-200 Wörter
OUTPUT-FORMAT: Markdown, beginne mit ## Marktbewertung
```

#### Section-Prompt: Investment-These

```
Formuliere eine Investment-These für {COMPANY} ({TICKER}) basierend auf 
den folgenden Analyseergebnissen:

{VORHERIGE_SECTIONS}

PFLICHTINHALTE:
1. Bull-Case: 2-3 Argumente für ein Investment
2. Bear-Case: 2-3 Argumente gegen ein Investment
3. Kursziel: Begründetes 12-Monats-Kursziel
4. Empfehlung: KAUFEN / HALTEN / VERKAUFEN (fett markiert)
5. Begründung der Empfehlung in 2-3 Sätzen

WICHTIG: 
- Die Empfehlung muss konsistent mit der Analyse sein
- Bei Unsicherheit: HALTEN bevorzugen
- Kursziel muss mathematisch plausibel sein (nicht >50% vom aktuellen Kurs)

LÄNGE: 250-300 Wörter
OUTPUT-FORMAT: Markdown, beginne mit ## Investment-These
```

### 3.3 Redundanzvermeidung bei Serienanalysen

```javascript
// Kontext-Injection für Follow-Up-Analysen
const previousAnalysisContext = `
HINWEIS: Dies ist ein UPDATE zur Analyse vom ${previousDate}.

VORHERIGE EMPFEHLUNG: ${previousRecommendation}
VORHERIGES KURSZIEL: ${previousPriceTarget}

ANWEISUNG: 
- Beziehe dich explizit auf Änderungen seit der letzten Analyse
- Vermeide Wiederholung von Basisinformationen zum Unternehmen
- Fokussiere auf: Was ist neu? Was hat sich geändert?
- Falls Empfehlung sich ändert: Begründe explizit warum
`;
```

---

## 4. Daten- & Metadaten-Design

### 4.1 Erweitertes Schema für analysen.json

```json
{
  "id": "aapl-2026-01-18",
  "version": "1.0.0",
  "status": "published",
  
  "meta": {
    "company": "Apple Inc.",
    "ticker": "AAPL",
    "isin": "US0378331005",
    "sector": "Technologie",
    "exchange": "NASDAQ",
    "currency": "USD"
  },
  
  "content": {
    "title": "Apple: Equity-Research-Bericht",
    "summary": "Apple überzeugt mit stabilen Services-Umsätzen...",
    "recommendation": "HALTEN",
    "priceTarget": 195.00,
    "currentPrice": 182.50,
    "wordCount": 2340
  },
  
  "quality": {
    "score": 8,
    "validatedAt": "2026-01-18T14:30:00Z",
    "validatedBy": "quality-agent-v1"
  },
  
  "history": {
    "previousAnalysisId": "aapl-2025-10-15",
    "previousRecommendation": "KAUFEN",
    "recommendationChange": true
  },
  
  "files": {
    "html": "Abonenten/apple.html",
    "svg": "data/vorschaubilder/apple.svg",
    "pdf": "exports/pdf/apple-2026-01-18.pdf"
  },
  
  "publishing": {
    "date": "2026-01-18",
    "author": "capitovo Research",
    "publishedAt": "2026-01-18T15:00:00Z",
    "tags": ["Apple", "AAPL", "Technologie", "Mega-Cap"],
    "featured": false
  },
  
  "audit": {
    "createdAt": "2026-01-18T14:00:00Z",
    "createdBy": "n8n-workflow-v2",
    "checksum": "sha256:abc123..."
  }
}
```

### 4.2 Versionierung & Historie

```
┌─────────────────────────────────────────────────────────────────┐
│  VERSIONS-STRATEGIE                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dateistruktur:                                                 │
│  data/                                                          │
│  ├── analysen.json          (aktueller Stand, alle published)   │
│  ├── analysen_archive/                                          │
│  │   ├── 2025/                                                  │
│  │   │   ├── aapl-2025-10-15.json                              │
│  │   │   └── aapl-2025-07-20.json                              │
│  │   └── 2026/                                                  │
│  │       └── aapl-2026-01-18.json                              │
│  └── analysen_drafts/       (noch nicht published)              │
│      └── msft-2026-01-18-draft.json                            │
│                                                                 │
│  Regeln:                                                        │
│  • Jede Analyse bekommt eigene Archiv-Datei                     │
│  • analysen.json enthält nur published=true                     │
│  • Drafts können reviewt und manuell published werden           │
│  • Bei Empfehlungsänderung: Newsletter-Alert                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Output-Design: Semantisches HTML

### 5.1 Verbesserte HTML-Struktur

```html
<!DOCTYPE html>
<html lang="de" itemscope itemtype="https://schema.org/Article">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{company}}: Equity-Research-Bericht | capitovo</title>
  
  <!-- SEO Meta -->
  <meta name="description" content="{{summary}}">
  <meta name="author" content="capitovo Research">
  <meta name="robots" content="noindex, nofollow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{company}} Analyse">
  <meta property="og:image" content="{{svgPath}}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "{{company}} ({{ticker}})",
    "category": "{{sector}}"
  }
  </script>
  
  <link rel="stylesheet" href="../style.css">
</head>
<body class="analysis-page">
  
  <header class="site-header">
    <!-- Navigation -->
  </header>
  
  <main class="analysis-content">
    <article itemscope itemtype="https://schema.org/AnalysisNewsArticle">
      
      <!-- Meta-Header -->
      <header class="analysis-header">
        <div class="analysis-meta">
          <span class="sector" itemprop="articleSection">{{sector}}</span>
          <span class="ticker">{{ticker}}</span>
          <span class="exchange">{{exchange}}</span>
        </div>
        <h1 itemprop="headline">{{company}}: Equity-Research-Bericht</h1>
        <div class="byline">
          <span itemprop="author">capitovo Research</span>
          <time itemprop="datePublished" datetime="{{isoDate}}">{{formattedDate}}</time>
        </div>
      </header>
      
      <!-- Key Metrics Box -->
      <aside class="key-metrics">
        <div class="metric">
          <span class="label">Empfehlung</span>
          <span class="value recommendation-{{recommendationClass}}">{{recommendation}}</span>
        </div>
        <div class="metric">
          <span class="label">Kursziel</span>
          <span class="value">{{priceTarget}} {{currency}}</span>
        </div>
        <div class="metric">
          <span class="label">Aktueller Kurs</span>
          <span class="value">{{currentPrice}} {{currency}}</span>
        </div>
      </aside>
      
      <!-- Content Sections -->
      <section class="analysis-body" itemprop="articleBody">
        {{content}}
      </section>
      
      <!-- Disclaimer -->
      <footer class="analysis-footer">
        <div class="disclaimer">
          <strong>Disclaimer:</strong> Diese Analyse stellt keine Anlageberatung dar.
          Bitte beachten Sie unsere <a href="/rechtliches/haftung.html">Haftungshinweise</a>.
        </div>
        <div class="version-info">
          Analyse-ID: {{id}} | Version: {{version}}
        </div>
      </footer>
      
    </article>
  </main>
  
  <footer class="site-footer">
    <!-- Footer -->
  </footer>
  
</body>
</html>
```

### 5.2 PDF-Export-Vorbereitung

```javascript
// PDF-Template-Struktur (für späteren Export via Puppeteer/WeasyPrint)
const pdfTemplate = {
  pageFormat: 'A4',
  margins: { top: 25, right: 20, bottom: 25, left: 20 },
  header: {
    logo: 'assets/capitovo_logo.png',
    text: 'capitovo Equity Research'
  },
  footer: {
    pageNumbers: true,
    disclaimer: 'Keine Anlageberatung. © capitovo'
  },
  styles: {
    fontFamily: 'Inter, sans-serif',
    headingColor: '#0f172a',
    accentColor: '#3b82f6'
  }
};
```

---

## 6. Konkrete Handlungsempfehlungen

### 6.1 Node-Struktur des optimierten Workflows

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPTIMIERTER WORKFLOW: Node-Übersicht                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INTAKE STAGE (3 Nodes)                                                 │
│  ├── [1] Webhook Trigger (unverändert)                                  │
│  ├── [2] Input Validator & Normalizer (NEU)                             │
│  │       └─ Schema-Validierung, Sector-Mapping, Slug-Generierung        │
│  └── [3] History Loader (NEU)                                           │
│          └─ Frühere Analyse laden, Delta berechnen                      │
│                                                                         │
│  RESEARCH STAGE (7 Nodes)                                               │
│  ├── [4] Research Orchestrator (NEU)                                    │
│  │       └─ Steuert parallele Prompt-Ausführung                         │
│  ├── [5-9] Section Prompts (5x parallel)                                │
│  │       └─ Marktbewertung, Fundamentals, Wettbewerb, Risiken, These    │
│  └── [10] Content Merger (NEU)                                          │
│           └─ Zusammenführung + Summary-Generierung                      │
│                                                                         │
│  EDITORIAL STAGE (4 Nodes)                                              │
│  ├── [11] Quality Check Agent (NEU)                                     │
│  │        └─ Fact-Check, Consistency, Score                             │
│  ├── [12] Style Review Agent (NEU)                                      │
│  │        └─ Redundanzen, Plagiat, Ton                                  │
│  ├── [13] Length Controller (NEU)                                       │
│  │        └─ 2000-2500 Wörter sicherstellen                             │
│  └── [14] Quality Gate (NEU)                                            │
│           └─ Score >= 7 → Weiter, sonst Alert                           │
│                                                                         │
│  PUBLISH STAGE (5 Nodes)                                                │
│  ├── [15] Template Renderer (ERSETZT Build Content + Write Files)       │
│  │        └─ Saubere Template-Engine                                    │
│  ├── [16] File Writer (REFACTORED)                                      │
│  │        └─ Atomic Writes, Error Handling                              │
│  ├── [17] Archive Manager (NEU)                                         │
│  │        └─ Versionierung, Historie                                    │
│  ├── [18] Notification Dispatcher (ERWEITERT)                           │
│  │        └─ Slack, optional Mail                                       │
│  └── [19] Response Builder (unverändert)                                │
│                                                                         │
│  TOTAL: 19 Nodes (vorher: 8 Nodes)                                      │
│  PARALLELISIERUNG: Sections 5-9 parallel                                │
│  ERROR HANDLING: Try-Catch um jede Stage                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Priorisierte Umsetzungsreihenfolge

| Prio | Maßnahme | Aufwand | Impact |
|------|----------|---------|--------|
| 1 | **Quality Check Agent** einführen | Mittel | Hoch |
| 2 | **Multi-Prompt-Pipeline** (5 Sections parallel) | Hoch | Hoch |
| 3 | **Input Validator** mit Schema | Gering | Mittel |
| 4 | **History Loader** für Updates | Mittel | Mittel |
| 5 | **Semantisches HTML-Template** | Gering | Mittel |
| 6 | **Archivierung & Versionierung** | Mittel | Mittel |
| 7 | **PDF-Export-Pipeline** (optional) | Hoch | Gering |

### 6.3 Empfohlene Sub-Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│  SUB-WORKFLOWS (wiederverwendbar)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. "AI Research Call" (Sub-Workflow)                           │
│     └─ Input: systemPrompt, userPrompt, model, temperature      │
│     └─ Output: content, tokens, latency                         │
│     └─ Features: Retry-Logic, Rate-Limiting, Caching            │
│                                                                 │
│  2. "File Writer" (Sub-Workflow)                                │
│     └─ Input: path, content, type (html/json/svg)               │
│     └─ Output: success, path, checksum                          │
│     └─ Features: Atomic Write, Backup, Error-Handling           │
│                                                                 │
│  3. "Quality Scorer" (Sub-Workflow)                             │
│     └─ Input: content, expectedSections, company                │
│     └─ Output: score, issues, suggestions                       │
│     └─ Features: Configurable thresholds                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Nächste Schritte

### Phase 1: Foundation (1-2 Tage)
- [ ] Input Validator implementieren
- [ ] Schema für analysen.json erweitern
- [ ] HTML-Template semantisch überarbeiten

### Phase 2: Quality Layer (2-3 Tage)
- [ ] Quality Check Agent als eigene Node
- [ ] Score-basiertes Gate implementieren
- [ ] Alert bei Score < 7

### Phase 3: Multi-Prompt (3-5 Tage)
- [ ] Spezialisierte Prompts definieren
- [ ] Parallele Ausführung in n8n konfigurieren
- [ ] Content Merger implementieren

### Phase 4: History & Archiving (1-2 Tage)
- [ ] History Loader implementieren
- [ ] Archiv-Struktur anlegen
- [ ] Versionierung aktivieren

---

## Fazit

Der aktuelle Workflow ist ein **funktionaler Prototyp**, aber kein **publikationsreifes System**. Die vorgeschlagene Architektur transformiert ihn zu einer **robusten, skalierbaren Publishing-Pipeline**, die:

- **Qualitätssicherung** durch mehrstufige KI-Reviews gewährleistet
- **Konsistenz** durch spezialisierte Prompts und Style-Guidelines sicherstellt
- **Skalierbarkeit** durch Modularisierung und Parallelisierung ermöglicht
- **Wartbarkeit** durch klare Trennung von Concerns verbessert

Die Umsetzung sollte **inkrementell** erfolgen, beginnend mit dem Quality Check Agent als kritischster Verbesserung.
