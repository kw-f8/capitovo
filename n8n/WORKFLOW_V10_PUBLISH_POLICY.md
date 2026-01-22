# Capitovo Analyse Generator v10.1 - INTERN/EXTERN SEPARATION

## Release v10.1: Strikte Trennung Public/Internal

### Das Problem (v10.0)
Die Analyse war rechtlich publishfähig, aber interne QA-Daten (Scores, Flags, Warnings, Pipeline-Versionen) wurden im öffentlichen HTML angezeigt. Das untergräbt die professionelle Wirkung.

### Die Lösung (v10.1)
**Zwei getrennte Output-Ebenen:**

#### 1. Public View (Reader-Fassung)
- **Datei:** `Abonenten/{slug}.html`
- **Enthält NUR:** Analyse-Text, Quellen, Disclaimer, Copyright
- **Enthält NICHT:** Scores, Flags, Warnings, Pipeline-Versionen, Datenqualitäts-Hinweise

#### 2. Internal View (Control View)  
- **Datei:** `data/internal/{ticker}-{date}_internal.json`
- **Enthält:** Alle QA-Daten für Redaktions-Dashboard

### Output-Struktur
```json
{
  "public": { "html": "...", "svg": "...", "catalog": {...} },
  "internal": { "publication": {...}, "qualityMetrics": {...}, "compliance": {...} },
  "filePaths": { "publicHtml": "...", "internalJson": "..." }
}
```

---

## FINALE SYSTEMANWEISUNG (verbindlich)

### 0. Grundsatz

Dieses System erstellt **journalistische Unternehmensanalysen**, **keine Anlageempfehlungen**.  
Unsicherheit, Datenlücken und Risikoabwägungen sind **Qualitätsmerkmale**, keine Fehler.

**Eine Analyse gilt als publikationsfähig, sobald sie keine rechtlichen oder fachlichen K.O.-Fehler enthält.**

---

## 1. K.O.-Kriterien (EINZIGE Publish-Blocker)

Eine Analyse wird **NUR** blockiert bei:

### 1.1 Rechtlich
- Explizite Kauf-/Verkaufsempfehlung (`kaufen`, `verkaufen`, `buy`, `sell`)
- Implizite Empfehlung (`unterbewertet`, `attraktiv bewertet`, `Chance`, `lohnt sich`)
- Kursziele

### 1.2 Fachlich  
- Keine Quellenangaben vorhanden (GAR keine)
- Technischer Abbruch (`[text folgt]`, `[tbd]`)
- Extrem kurz (<400 Wörter)

**→ NUR diese Punkte blockieren.**

---

## 2. Explizit ERLAUBT (dürfen NICHT blockieren)

Diese Inhalte **erhöhen die Research-Qualität**:

- Datenqualität: partial/mittel
- Fehlende Segment-/Bilanzdetails  
- Anomalien mit plausibler Erklärung
- Szenarien, Risiken, Unsicherheiten
- Konservative/neutrale Schlussfolgerungen
- Kritische Einordnung hoher Multiplikatoren
- Aussagen wie „setzt voraus", „impliziert", „abhängig von"

---

## 3. Anomalie-Logik (NEU)

Eine Anomalie gilt als **behandelt** wenn:
- Plausible ökonomische Erklärung, ODER
- Hinweis auf Basiseffekt/Bilanzstruktur, ODER  
- Explizite Kennzeichnung als datenbedingt/unsicher

**Vollständige Auflösung ist NICHT erforderlich.**  
**Erkennen + Einordnen REICHT.**

---

## 4. Score-System (NEU)

- Score misst **Analysentiefe**, NICHT Veröffentlichbarkeit
- Skala: 1-10
- Score < Maximalwert blockiert NIEMALS allein

### Veröffentlichungsregel
```
Wenn keine K.O.-Kriterien erfüllt:
→ published = true
→ status = "PUBLIKATIONSFÄHIG"
```

---

## 5. Finale Entscheidungslogik

> **Im Zweifel IMMER veröffentlichen**,  
> solange keine rechtliche oder fachliche Unzulässigkeit vorliegt.

Research lebt von Unsicherheit.  
Das System darf Unsicherheit **nicht bestrafen**.

---

## 6. Metaregel

Das System darf **sich selbst nicht endlos verschärfen**.  
Regeln dürfen **nur** verschärft werden bei:
- Rechtlicher Beanstandung
- Faktischem Fehler  
- Begründeter Nutzerbeschwerde

---

## Output-Struktur v10

```json
{
  "metrics": {
    "wordCount": 1050,
    "depthScore": 7.5,
    "scoreDisplay": "7.5/10 (Analysentiefe)",
    "publicationReady": true,
    "statusText": "PUBLIKATIONSFÄHIG"
  },
  "publishPolicy": {
    "hasKO": false,
    "koFlags": [],
    "warnings": ["Superlative vorhanden (1)"],
    "qualityIndicators": ["Unsicherheiten benannt", "Szenarien thematisiert"],
    "principle": "Im Zweifel IMMER veröffentlichen"
  }
}
```

---

## Änderungshistorie

### v10.0 (aktuell) - Publish Policy
- K.O.-Kriterien als einzige Blocker
- Score misst nur Tiefe, blockiert nicht
- Anomalie-Logik: Erkennen + Einordnen reicht
- "Im Zweifel veröffentlichen" als Grundsatz
- Metaregel gegen Selbstverschärfung

### v9.2 - Produktion (abgelöst)
- Anomalien-Logik vereinheitlicht
- Score-System semantisch korrigiert
- Quellen-Mindeststandard

### v9.1 - Konservativ (abgelöst)
- Konservative Bewertungslogik (Basis 7)
- Vollständigkeitsprüfung
- Pflichtsektion Gesamteinordnung

### v9.0 - Research-Grade (abgelöst)
- 4-Phasen-Architektur
- Trennung Fakten/Analyse/Kritik/Redaktion

---

## Zusammenfassung

**Das Produkt ist nicht perfekt, aber:**
- Es ist ernsthaft
- Es ist eigenständig  
- Es ist glaubwürdig
- Es ist veröffentlichbar

**Die Iterationshölle ist beendet.**

### 1. Konservative Bewertungslogik
- **Basis-Score jetzt 7** (nicht mehr 10)
- **Maximaler Score: 8** wenn keine offenen Punkte
- **Maximaler Score: 6** wenn offene Punkte existieren
- Workflow kann sich NICHT mehr selbst 8/10+ geben

### 2. Vollständigkeitsprüfung (NEU)
Erkennt automatisch:
- Abgebrochene Sätze (`[Text folgt]`, `...`, `[hier`)
- Fehlende Pflichtsektion "Sachliche Gesamteinordnung"
- Zu kurze Analysen (<800 Wörter)

Bei Erkennung: `isIncomplete = true` → Score maximal 3

### 3. Pflichtsektion "Sachliche Gesamteinordnung"
Jede Analyse MUSS enden mit:
- Was ist strukturell stark?
- Was ist strukturell begrenzt?
- Welche Annahmen tragen die Bewertung?
- Welche Annahmen sind unsicher?

### 4. Anomalie-Behandlung verschärft
- Jede erkannte Anomalie MUSS im Text behandelt werden
- Wenn nicht: Abzug im Score + explizite Issue-Markierung

### 5. Mindestanforderungen
- **800 Wörter** Minimum (vorher 1000)
- **Alle 5 Sektionen** müssen vollständig sein
- **Keine Platzhalter** erlaubt

---

## Fundamentaler Unterschied zu v8

### Problem v8
Eine KI machte alles: Daten interpretieren, bewerten, formulieren, sich selbst kontrollieren.
→ Ergebnis: Deskriptiv statt analytisch, generische Aussagen, keine echte Qualitätskontrolle.

### Lösung v9
**4 getrennte intellektuelle Instanzen** mit klaren Verantwortungen:

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 1: FAKTENINSTANZ                      │
│           (Code - keine KI, rein mechanisch)                   │
├────────────────────────────────────────────────────────────────┤
│ • API-Daten sammeln                                            │
│ • Automatische Anomalie-Erkennung (regelbasiert)               │
│ • Strukturiertes Faktenblatt erstellen                         │
│ • KEINE Interpretation, KEIN Fließtext                         │
│                                                                │
│ Output: Faktenblatt + Anomalie-Flags                           │
└─────────────────────────┬──────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                  PHASE 2: ANALYSEINSTANZ                       │
│              (LLM - Senior Equity Analyst)                     │
├────────────────────────────────────────────────────────────────┤
│ UNTERSCHIED zu v8:                                             │
│ • ANALYSE statt Beschreibung                                   │
│ • KAUSALE ZUSAMMENHÄNGE herstellen                             │
│ • PRIORITÄTEN setzen (was ist ENTSCHEIDEND?)                   │
│ • WIDERSPRÜCHE erklären                                        │
│ • UNSICHERHEITEN explizit benennen                             │
│ • SZENARIEN durchdenken                                        │
│                                                                │
│ VERBOTEN:                                                      │
│ • "Das KGV beträgt 35, das ist hoch" ← BESCHREIBUNG            │
│                                                                │
│ GEFORDERT:                                                     │
│ • "Das KGV von 35 impliziert, dass der Markt                   │
│    zweistelliges Gewinnwachstum für 3-5 Jahre einpreist.       │
│    Bei aktuellem EPS-Wachstum wäre das nur gerechtfertigt,     │
│    wenn [Bedingung]. Das zentrale Risiko ist daher [X]."       │
│    ← ANALYSE                                                   │
│                                                                │
│ Output: Analyse v1 (~1700 Wörter)                              │
└─────────────────────────┬──────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│              PHASE 3: KRITISCHE PRÜFINSTANZ                    │
│           (LLM - Separater kritischer Reviewer)                │
├────────────────────────────────────────────────────────────────┤
│ DAS FEHLTE KOMPLETT IN V8!                                     │
│                                                                │
│ Diese Instanz ZERSTÖRT die Analyse aktiv:                      │
│ • Markiert SCHWACHE Passagen                                   │
│ • Identifiziert GENERISCHE Aussagen                            │
│ • Findet UNBEGRÜNDETE Behauptungen                             │
│ • Zeigt LÜCKEN auf                                             │
│ • Prüft COMPLIANCE                                             │
│                                                                │
│ Output-Format:                                                 │
│ TEIL A: Kritik-Protokoll (mind. 5 konkrete Kritikpunkte)       │
│ TEIL B: Überarbeitete Analyse (alle Kritik eingearbeitet)      │
│                                                                │
│ Output: Kritik + Analyse v2                                    │
└─────────────────────────┬──────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│             PHASE 3b: QUELLENVALIDIERUNG                       │
│                    (Code - regelbasiert)                       │
├────────────────────────────────────────────────────────────────┤
│ Kategorisiert alle Quellen:                                    │
│ • PRIMÄR: SEC, 10-K, IR, Earnings Calls                        │
│ • SEKUNDÄR: Reuters, Bloomberg, WSJ, Statista                  │
│ • NEWS: Blogs, Retail-Seiten                                   │
│ • VERBOTEN: Reddit, Social Media                               │
│                                                                │
│ Warnt wenn:                                                    │
│ • Keine Primärquellen vorhanden                                │
│ • Mehr News als Research-Quellen                               │
│                                                                │
│ Output: Quellenqualitäts-Score + Kategorisierung               │
└─────────────────────────┬──────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│               PHASE 4: REDAKTIONELLE INSTANZ                   │
│                  (LLM - Nur Lesbarkeit)                        │
├────────────────────────────────────────────────────────────────┤
│ ERLAUBT:                                                       │
│ • Grammatik korrigieren                                        │
│ • Satzstruktur verbessern                                      │
│ • Übergänge verbessern                                         │
│ • Wiederholungen entfernen                                     │
│                                                                │
│ STRIKT VERBOTEN:                                               │
│ • Inhaltliche Änderungen                                       │
│ • Neue Fakten oder Zahlen                                      │
│ • Empfehlungen hinzufügen                                      │
│                                                                │
│ Output: Finaler Text                                           │
└─────────────────────────┬──────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                    QUALITY GATE                                │
│              (Code - technische Prüfung)                       │
├────────────────────────────────────────────────────────────────┤
│ Technische Compliance-Prüfung:                                 │
│ • Verbotene Begriffe (kaufen, verkaufen, Kursziel...)          │
│ • Warnbegriffe (führend, dominant, einzigartig...)             │
│ • Wortzahl-Check (min. 1000)                                   │
│ • Anomalien-Adressierung prüfen                                │
│                                                                │
│ Qualitäts-Score berechnen (0-10)                               │
│ Publikationsentscheidung (Score ≥6, keine kritischen Flags)    │
│                                                                │
│ Output: Score + Publikationsstatus                             │
└────────────────────────────────────────────────────────────────┘
```

## Kernänderungen der Prompts

### Phase 2: Analyst (NEU)

```
BESCHREIBUNG (VERBOTEN): 
"Das KGV beträgt 35, das ist hoch für den Sektor."

ANALYSE (GEFORDERT): 
"Das KGV von 35 impliziert, dass der Markt zweistelliges 
Gewinnwachstum für die nächsten 3-5 Jahre einpreist. 
Bei aktuellem EPS-Wachstum von X% wäre das nur gerechtfertigt, 
wenn [konkrete Bedingung]. Das zentrale Risiko ist daher [X]."
```

### Phase 3: Kritische Prüfinstanz (KOMPLETT NEU)

Prüfkriterien:
1. **SUBSTANZ-CHECK**: Enthält der Absatz eine THESE oder nur Beschreibung?
2. **GENERIK-CHECK**: Könnte dieser Satz für JEDES Unternehmen gelten?
3. **LOGIK-CHECK**: Folgt die Schlussfolgerung aus den Prämissen?
4. **LÜCKEN-CHECK**: Welche Fragen bleiben unbeantwortet?
5. **COMPLIANCE-CHECK**: Enthaltene Kursziele? Implizite Empfehlungen?

Die Prüfinstanz muss:
- Mindestens 5 konkrete Kritikpunkte liefern
- Die gesamte Analyse ÜBERARBEITEN mit allen Verbesserungen

## Anomalie-Erkennung (automatisch)

Flags die automatisch gesetzt werden:
- **EXTREM**: Gewinnwachstum >50%
- **AUFFÄLLIG**: Umsatzwachstum >30%
- **UNGEWÖHNLICH**: ROE <5% oder >100%
- **HOCH**: KGV >50
- **EXTREM**: P/B >30
- **INKONSISTENT**: Nettomarge > Bruttomarge
- **WARNUNG**: Umsatz mehrfach rückläufig

Für jede Anomalie MUSS der Analyst eine Erklärung liefern.

## Qualitäts-Scoring

```
Basis: 10 Punkte

Abzüge:
- Kritischer Begriff (kaufen, verkaufen...): -3 pro Begriff
- Warnbegriff (führend, dominant...): -1 pro Begriff
- Wortzahl <1200: -2
- Quellenqualität niedrig: -2
- Quellenqualität mittel: -1
- Nicht adressierte Anomalien: -1

Bonus:
- Kritik-Protokoll ≥5 Punkte: +1
- Primärquellen vorhanden: +1

Publikation: Score ≥6 UND keine kritischen Flags
```

## Datei-Location

```
/n8n/n8n_analyse_generator_workflow_v9.json
```

## Unterschied zu menschlichem Research-Team

| Rolle | Mensch | v9 Workflow |
|-------|--------|-------------|
| Junior Analyst | Daten sammeln | P1: Fakteninstanz |
| Senior Analyst | Interpretieren | P2: Analyseinstanz |
| Reviewer | Kritisch prüfen | P3: Prüfinstanz |
| Editor | Glätten | P4: Redaktion |
| Compliance | Freigabe | Quality Gate |

## Test-Anleitung

1. Workflow in n8n importieren
2. Manuell ausführen
3. Output prüfen:
   - Hat die Kritische Prüfinstanz echte Kritikpunkte geliefert?
   - Wurden Anomalien (z.B. 91% Gewinnwachstum) kritisch eingeordnet?
   - Enthält der Text ANALYSE statt nur Beschreibung?
   - Quellenqualität-Bewertung prüfen

## Was sich ändern sollte (erwartetes Ergebnis)

### Vorher (v8):
> "Das Gewinnwachstum von 91,2% erfordert kritische Einordnung."
> (Dann Aufzählung von Möglichkeiten ohne Gewichtung)

### Nachher (v9):
> "Das gemeldete Gewinnwachstum von 91,2% ist mit hoher Wahrscheinlichkeit 
> ein Artefakt der Datenquelle oder ein Basiseffekt. Apple's 
> historisches EPS-Wachstum der letzten 5 Jahre lag bei X-Y%. 
> Ein nachhaltiger Sprung auf 91% würde [konkrete Bedingung] erfordern, 
> wofür derzeit keine Evidenz vorliegt. Diese Zahl sollte daher 
> nicht als Prognosebasis verwendet werden."
