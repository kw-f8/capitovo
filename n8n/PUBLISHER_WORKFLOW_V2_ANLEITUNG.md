# PUBLISHING WORKFLOW v2 – SYSTEMANWEISUNG

> **Rolle:** Deterministischer Publishing-Agent  
> **Version:** 2.0  
> **Stand:** 29. Januar 2026

---

## 🎯 Grundprinzip

**Der Publishing-Workflow interpretiert nicht. Er platziert nur.**

Die Analyse-Vorlage ist das führende System. Der Workflow füllt lediglich vordefinierte Slots.

---

## 🔒 Grundregeln (NICHT VERHANDELBAR)

### 1. Die Analyse-Vorlage ist das führende Dokument

- Abschnittsnamen ✅
- Reihenfolge ✅  
- Hierarchie ✅
- Terminologie ✅

**→ Dürfen NICHT verändert werden.**

### 2. Jeder Abschnitt der Vorlage ist ein Pflicht-Slot

- Wenn Content fehlt → Abschnitt bleibt leer, aber sichtbar
- Keine Zusammenlegung
- Keine Umbenennung

### 3. Keine impliziten Entscheidungen

- ❌ Keine neue Überschrift
- ❌ Keine neue Gliederung  
- ❌ Keine inhaltliche Verdichtung

---

## 🧱 Strukturdefinition (VERBINDLICH)

Der veröffentlichte Output MUSS exakt diese Struktur haben:

### Titelblock
- Unternehmen
- Ticker · WKN · ISIN
- Kategorie/Sektor
- Datum
- Autor

### Executive Intro
- Max. 3–4 Sätze
- Aus vorhandenem Text extrahiert
- NICHT neu formuliert

### Pflichtabschnitte (exakt diese Reihenfolge)

| Nr. | ID | Titel |
|-----|-----|-------|
| 1) | `marktperformance` | Marktperformance & Bewertung |
| 2) | `finanzielle-grundlagen` | Finanzielle Grundlagen |
| 3) | `strategie` | Strategische Ausrichtung |
| 4) | `analysten` | Analystenerwartungen & Institutionelles Interesse |
| 5) | `votum` | Bewertungskontext & Votum |

### Quellen
- Dedizierter Block
- Keine Fließtext-Integration
- Am Ende vor Disclaimer

### Disclaimer (FIXER TEXT)
```
Diese Analyse stellt keine Anlageberatung dar. Capitovo erbringt keine 
regulierten Finanzdienstleistungen. Alle Angaben erfolgen ohne Gewähr. 
Investitionsentscheidungen sollten auf Basis eigener Recherche und ggf. 
nach Konsultation eines Finanzberaters getroffen werden.
```

### Footer
- Copyright
- Rechtliches (Impressum, Datenschutz, Haftung, AGB)
- Navigation

---

## 🧼 Formatierungsregeln (KRITISCH)

| Regel | Umsetzung |
|-------|-----------|
| Nummerierung | Einheitlich: `1)`, `2)`, etc. |
| Zeilenumbrüche | Keine harten Umbrüche im Fließtext |
| Silbentrennung | Keine (deaktiviert) |
| Überschriften | Nur H1 (Titel) und H2 (Abschnitte) |
| Links | Nur in Quellen & Footer, nicht im Haupttext |

---

## 🧪 Validierungs-Gate (PFLICHT)

Vor Veröffentlichung wird geprüft:

```
✅ Alle 5 Pflichtabschnitte vorhanden
✅ Reihenfolge korrekt
✅ Keine fremden Überschriften
✅ Disclaimer vorhanden
✅ Mindestens 1 Quelle vorhanden
✅ Votum-Text vorhanden
```

**Wenn EINE Bedingung verletzt ist → Veröffentlichung wird ABGEBROCHEN**

---

## 📥 Input-Format für den Workflow

```javascript
{
  // === METADATEN (PFLICHTFELDER) ===
  company: 'Apple Inc.',
  ticker: 'AAPL',
  slug: 'apple_2026-01-29',
  exchange: 'NASDAQ',
  sector: 'TECHNOLOGIE',
  wkn: '865985',
  isin: 'US0378331005',
  date: '2026-01-29',
  author: 'capitovo Research',
  
  // === INTRO (max. 400 Zeichen) ===
  intro: 'In dieser Analyse ordnen wir...',
  
  // === PFLICHTABSCHNITTE ===
  sections: {
    'marktperformance': {
      content: 'Fließtext...',
      kennzahlen: [
        { label: 'Aktueller Kurs', wert: '178 USD', kommentar: 'Stand: heute' }
      ]
    },
    'finanzielle-grundlagen': { content: '...', kennzahlen: [...] },
    'strategie': { content: '...', kennzahlen: null },
    'analysten': { content: '...', kennzahlen: [...] },
    'votum': {
      content: '...',
      votumText: 'Neutral / Halten',
      votumBegruendung: 'Die Bewertung reflektiert...',
      kennzahlen: null
    }
  },
  
  // === QUELLEN ===
  sources: [
    'Apple Investor Relations: investor.apple.com',
    'SEC EDGAR Filings'
  ]
}
```

---

## ⚠️ Was der Workflow NICHT tut

- ❌ Texte umschreiben oder zusammenfassen
- ❌ Abschnitte umbenennen
- ❌ Abschnitte zusammenlegen oder aufteilen
- ❌ Neue Überschriften erfinden
- ❌ Bewertungen oder Meinungen hinzufügen
- ❌ Fehlende Inhalte mit Platzhaltern füllen

---

## 🔄 Workflow-Ablauf

```
1. Struktur-Definition laden (unveränderlich)
       ↓
2. Input-Daten empfangen
       ↓
3. VALIDIERUNGS-GATE (blockiert bei Fehlern)
       ↓
4. Deterministischer HTML-Renderer
       ↓
5. SVG-Vorschaubild generieren
       ↓
6. Katalog-Eintrag erstellen
       ↓
7. Base64-Encoding
       ↓
8. Paralleler Upload: HTML + SVG
       ↓
9. analysen.json aktualisieren
       ↓
10. Abschluss-Report
```

---

## 📁 Dateien

| Datei | Beschreibung |
|-------|--------------|
| `n8n_analyse_publisher_workflow_v2.json` | Neuer deterministischer Workflow |
| `n8n_analyse_publisher_workflow.json` | Alter Workflow (deprecated) |
| `vorlage.html` | Führende Struktur-Vorlage |

---

## 🚀 Migration vom alten Workflow

1. Alten Workflow deaktivieren
2. Neuen Workflow importieren
3. GitHub Token Credentials prüfen
4. Test mit Dummy-Daten durchführen
5. Validierung prüfen (muss bei fehlendem Abschnitt abbrechen)

---

*Letzte Aktualisierung: 29.01.2026*
