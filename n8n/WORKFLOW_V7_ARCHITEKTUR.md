# Capitovo Analyse Generator v7 - Data-First Architecture

## Zusammenfassung der Änderungen

Diese Version löst das **Kernproblem** der v6-Pipeline: LLMs wurden für Faktenrecherche missbraucht, obwohl sie dafür ungeeignet sind.

### Architektur-Prinzip v7

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA-FIRST ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │ Alpha Vantage│     │   Fakten-    │     │    LLM       │    │
│  │     API      │────▶│   JSON       │────▶│  ERKLÄRT     │    │
│  │ (Primärquelle)│    │ (strukturiert)│    │  (erfindet   │    │
│  └──────────────┘     └──────────────┘     │   NICHT)     │    │
│                                             └──────────────┘    │
│                                                                  │
│  ROLLE: Fact Provider    ROLLE: Daten-      ROLLE: Analyst      │
│                          Schicht                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kernänderungen gegenüber v6

### 1. Finanzdaten-Provider (NEU)

**v6 (alt):** LLM sollte Finanzdaten via Perplexity recherchieren
**v7 (neu):** Dedizierte API-Calls zu Alpha Vantage

```
Nodes 3a + 3b: Alpha Vantage OVERVIEW + INCOME_STATEMENT
       ↓
Node 4: Financials Aggregator (konsolidiert + strukturiert)
       ↓
Node 5: Facts Formatter (erstellt Fakten-JSON für LLM)
```

**Vorteile:**
- Zahlen kommen aus verifizierbarer Primärquelle
- Jede Zahl hat explizite Quellenangabe
- Kein Halluzinationsrisiko bei Fundamentaldaten

### 2. Strikte Datenintegrität (NEU)

**Prompt-Regel für alle LLM-Module:**
```
KRITISCHE REGEL - DATENINTEGRITÄT:
1. Du DARFST NUR die Zahlen aus dem bereitgestellten Fakten-Block verwenden
2. Du DARFST KEINE zusätzlichen Zahlen recherchieren oder erfinden
3. Jede Zahl im Text MUSS mit "(Quelle: ...)" aus den Fakten stammen
4. Wenn eine Info fehlt, schreibe "Keine Daten verfügbar" - NICHT improvisieren
5. Bei Unsicherheit: Weglassen ist besser als Erfinden
```

**Validierung (Node 10):**
- Zahlen aus LLM-Output werden mit API-Daten abgeglichen
- Nicht-verifizierte Zahlen werden gezählt
- Hard-Fail bei Verifikationsrate < 70%

### 3. Kritik-Agent (NEU)

**Node 9: Kritik-Agent**
Separater LLM-Call der die generierte Analyse prüft auf:
- Logische Brüche
- Unbelegte Behauptungen
- Implizite Empfehlungen
- Übertreibungen

**Workflow:**
```
Generierung → Kritik-Agent → Kritik-Evaluator → Weiterverarbeitung
```

### 4. Quellen-Whitelist/Blacklist (Verbessert)

**Primärquellen (erwünscht):**
- sec.gov, investor.*.com, ir.*, alphavantage.co

**Sekundärquellen (akzeptiert):**
- reuters, bloomberg, wsj, ft, statista, morningstar

**Verboten (Hard-Fail):**
- reddit, youtube, facebook, twitter, tiktok, blog, forum, wikipedia, medium, substack

**Neu - Irrelevanz-Filter:**
- Disney, Netflix, etc. (wenn nicht das Analyseunternehmen)

### 5. Score-Kalibrierung (Überarbeitet)

**v6 (alt):** Gewichtung unklar, Länge überbewertet

**v7 (neu):**
| Kriterium | Gewichtung |
|-----------|------------|
| Datenintegrität | 40% |
| Quellenqualität | 25% |
| Logik/Konsistenz | 20% |
| Stil/Bias | 15% |
| Analysetiefe | Bonus |

**Erwartete Auswirkung:**
Eine Analyse wie die Apple-Analyse mit Quellenproblemen würde jetzt **6-7/10** statt **8/10** erhalten.

---

## Node-Übersicht v7

| Node | Name | Funktion |
|------|------|----------|
| 1 | Input Data | Unternehmensdaten eingeben |
| 2 | Input Validator | Pflichtfelder prüfen |
| **3a** | **Alpha Vantage Overview** | **API: Fundamentaldaten** |
| **3b** | **Alpha Vantage Income** | **API: Income Statement Historie** |
| **4** | **Financials Aggregator** | **Daten konsolidieren + strukturieren** |
| **5** | **Facts Formatter** | **Fakten-JSON für LLM erstellen** |
| 6 | Prompt Builder | Module-Prompts mit strikten Regeln |
| 7a-e | API: Module | LLM-Generierung (5 Module parallel) |
| 8 | Module Collector | Ergebnisse zusammenführen |
| **9** | **Kritik-Agent** | **Qualitätsprüfung durch LLM** |
| **9b** | **Kritik Evaluator** | **Kritik auswerten** |
| **10** | **Data Integrity Check** | **Zahlen-Verifikation** |
| 11 | Source Validation | Quellen-Whitelist/Blacklist |
| 12 | Anti-Bias Check | Bias-Phrasen erkennen |
| 13 | Depth Validation | Mindestlänge prüfen |
| 14 | Publication Gate | Finale Entscheidung |
| 15 | Editorial Assembly | Analyse zusammenstellen |
| 16 | HTML Renderer | HTML mit Daten-Header |
| 17 | Output Generator | Finale Ausgabe |

---

## Konfiguration

### Umgebungsvariablen

In n8n müssen folgende Credentials/Variablen gesetzt werden:

```
ALPHA_VANTAGE_KEY     # Alpha Vantage API Key
PERPLEXITY_API_KEY    # Perplexity API Key
```

### Alpha Vantage API

- **Kostenlos:** 25 Requests/Tag
- **Premium:** Für Produktionsbetrieb empfohlen
- Dokumentation: https://www.alphavantage.co/documentation/

---

## Migration von v6 zu v7

1. Workflow-Datei importieren: `n8n_analyse_generator_workflow_v7.json`
2. Credentials setzen (ALPHA_VANTAGE_KEY, PERPLEXITY_API_KEY)
3. Test-Run mit bekanntem Ticker (z.B. AAPL)
4. Score-Ergebnisse vergleichen

**Erwartete Unterschiede:**
- Höhere Datenqualität
- Niedrigere (realistischere) Scores
- Transparente Datenherkunft im HTML

---

## Bekannte Einschränkungen

1. **Alpha Vantage Rate Limits:** Kostenlose Version limitiert auf 25 Calls/Tag
2. **Nicht alle Ticker verfügbar:** Kleine/internationale Unternehmen evtl. nicht in Alpha Vantage
3. **Fallback-Mechanismus:** Bei API-Fehler bricht Pipeline ab (by design)

### Geplante Erweiterungen (v7.1+)

- [ ] Financial Modeling Prep als Backup-API
- [ ] SEC EDGAR Parser für 10-K/10-Q
- [ ] Historische Multiples-Datenbank
- [ ] Peer-Vergleichsautomatik

---

## Architektur-Diagramm

```
                    ┌─────────────────────────────────────────┐
                    │            EINGABE                       │
                    │  Company, Ticker, Sector                 │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │         DATEN-SCHICHT (NEU)              │
                    │  ┌─────────────┐  ┌─────────────┐       │
                    │  │Alpha Vantage│  │Alpha Vantage│       │
                    │  │  Overview   │  │   Income    │       │
                    │  └──────┬──────┘  └──────┬──────┘       │
                    │         └────────┬───────┘              │
                    │                  ▼                       │
                    │         ┌─────────────┐                 │
                    │         │  Financials │                 │
                    │         │ Aggregator  │                 │
                    │         └──────┬──────┘                 │
                    │                │                         │
                    │         ┌──────▼──────┐                 │
                    │         │   Fakten    │                 │
                    │         │  Formatter  │                 │
                    │         └──────┬──────┘                 │
                    └────────────────┼────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────┐
                    │           LLM-SCHICHT                    │
                    │  (Erklärt nur, erfindet NICHT)          │
                    │  ┌───────┬───────┬───────┬───────┐     │
                    │  │Business│Fundam.│Valuat.│ These │     │
                    │  └───┬───┴───┬───┴───┬───┴───┬───┘     │
                    │      └───────┴───────┴───────┘          │
                    │                  ▼                       │
                    │         ┌─────────────┐                 │
                    │         │   Module    │                 │
                    │         │  Collector  │                 │
                    │         └──────┬──────┘                 │
                    └────────────────┼────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────┐
                    │        VALIDIERUNG (ERWEITERT)          │
                    │  ┌───────────────────────────┐          │
                    │  │     KRITIK-AGENT (NEU)    │          │
                    │  │  Prüft: Logik, Quellen,   │          │
                    │  │  Empfehlungen, Bias       │          │
                    │  └─────────────┬─────────────┘          │
                    │                ▼                         │
                    │  ┌─────────────────────────────────┐    │
                    │  │ Data Integrity │ Source Valid.  │    │
                    │  │    (40%)       │    (25%)       │    │
                    │  └────────┬──────┴────────┬───────┘    │
                    │  ┌────────▼──────┬────────▼───────┐    │
                    │  │ Anti-Bias     │ Depth Valid.   │    │
                    │  │    (15%)      │   (Bonus)      │    │
                    │  └────────┬──────┴────────┬───────┘    │
                    │           └───────┬───────┘             │
                    │                   ▼                      │
                    │         ┌─────────────────┐             │
                    │         │ PUBLICATION GATE│             │
                    │         │  Score 0-10     │             │
                    │         └────────┬────────┘             │
                    └──────────────────┼──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │              AUSGABE                     │
                    │  HTML + SVG + JSON (mit Daten-Header)   │
                    └─────────────────────────────────────────┘
```

---

## Changelog

### v7.0 (2026-01-21)
- **NEU:** Data-First Architecture mit Alpha Vantage API
- **NEU:** Kritik-Agent für zweistufige Validierung
- **NEU:** Datenintegritäts-Prüfung (Zahlen-Verifikation)
- **VERBESSERT:** Quellen-Whitelist/Blacklist mit Irrelevanz-Filter
- **VERBESSERT:** Score-Gewichtung (40/25/20/15)
- **VERBESSERT:** HTML mit Daten-Header für Transparenz
- **VERBESSERT:** Strikte Prompts verhindern Zahlen-Halluzination
