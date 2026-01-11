# Capitovo Aktien-Scoring-System

Ein **rechtssicheres, erklärbares Scoring-Modell** für Aktienanalyse mit Branchenvergleich.

## 🎯 Übersicht

Dieses System berechnet einen **Gesamt-Score (0-100 Punkte)** für Aktien basierend auf:

- **Qualität** (30%): Profitabilität, Kapitalrendite, Cashflow-Qualität
- **Wachstum** (25%): Umsatz-, Gewinn- und Cashflow-Wachstum
- **Stabilität** (25%): Finanzstärke, Verschuldung, Volatilität
- **Bewertung** (20%): Relative Bewertung im Branchenvergleich

### Wichtige Eigenschaften

- ✅ **Keine Anzeige von Roh-Finanzkennzahlen**
- ✅ **Keine Kauf-/Verkaufsempfehlungen**
- ✅ **Branchenvergleich (Perzentil-basiert)**
- ✅ **Rechtlich risikoarm**
- ✅ **Automatisch generierte Beschreibungstexte**

## 📦 Installation

Das Modul ist ein reines Python-Paket ohne externe Abhängigkeiten:

```bash
cd /path/to/capitovo
python -m scoring.api --list-symbols
```

## 🚀 Schnellstart

### Python API

```python
from scoring import score_company

# Einzelnes Unternehmen
result = score_company("AAPL")
print(result)
```

### Beispiel-Output

```json
{
  "symbol": "AAPL",
  "sector": "Technology",
  "score_total": 78,
  "score_quality": "hoch",
  "score_growth": "solide",
  "score_stability": "sehr hoch",
  "score_valuation": "anspruchsvoll",
  "sector_percentile": 72,
  "traffic_light": "green",
  "summary_text": "Das Unternehmen überzeugt durch hohe Qualität und stabile Cashflows. Im Branchenvergleich liegt es im oberen Drittel. Die Bewertung ist ambitioniert."
}
```

## 📊 Score-Logik

### Gesamt-Score Berechnung

```
Gesamt = 0.30 × Qualität + 0.25 × Wachstum + 0.25 × Stabilität + 0.20 × Bewertung
```

### Ampel-System

| Score | Ampel | Beschreibung |
|-------|-------|--------------|
| ≥ 70 | 🟢 Grün | Attraktives Gesamtprofil |
| 50–69 | 🟡 Gelb | Ausgewogenes Gesamtprofil |
| < 50 | 🔴 Rot | Schwaches Gesamtprofil |

### Qualitative Bewertungsstufen

| Perzentil | Label |
|-----------|-------|
| 90-100 | hervorragend |
| 75-89 | sehr hoch |
| 60-74 | hoch |
| 40-59 | solide |
| 25-39 | moderat |
| 10-24 | schwach |
| 0-9 | sehr schwach |

## 🏗️ Architektur

```
scoring/
├── __init__.py          # Package-Definition, DISCLAIMER
├── config.py            # Konfiguration, Gewichtungen, Schwellenwerte
├── data_loader.py       # Datenschicht (Mock-fähig)
├── scorer.py            # Score-Berechnung
├── sector_ranker.py     # Branchenvergleich
├── text_generator.py    # Automatische Textgenerierung
├── api.py               # Haupt-API
├── tests.py             # Unit-Tests
└── README.md            # Diese Dokumentation
```

### Module

#### `data_loader.py`
- Abstrahierte Datenschicht
- Mock-Datenquelle für Entwicklung
- Erweiterbar für echte APIs

#### `scorer.py`
- Perzentil-basierte Score-Berechnung
- Winsorizing für Extremwerte
- Gewichteter Gesamt-Score

#### `sector_ranker.py`
- Branchenvergleich
- Ranking innerhalb des Sektors
- Cache für Performance

#### `text_generator.py`
- Automatische Textgenerierung
- Rechtssichere Formulierungen
- Keine Handlungsempfehlungen

#### `api.py`
- Haupt-API
- CLI-Interface
- JSON-Output

## 🔧 CLI-Verwendung

```bash
# Einzelnes Unternehmen
python -m scoring.api AAPL

# Mehrere Unternehmen
python -m scoring.api AAPL MSFT GOOGL

# Alle Unternehmen
python -m scoring.api --all

# Sektor-Übersicht
python -m scoring.api --sector Technology

# Verfügbare Symbole
python -m scoring.api --list-symbols

# Verfügbare Sektoren
python -m scoring.api --list-sectors

# Disclaimer anzeigen
python -m scoring.api --disclaimer
```

## 🧪 Tests ausführen

```bash
python -m unittest scoring.tests -v
```

## ⚖️ Rechtliche Hinweise

### Disclaimer

> Die Bewertung basiert auf einem quantitativen Modell und stellt keine Anlageberatung dar.

### Was das System NICHT tut

- ❌ Kauf-/Verkaufsempfehlungen geben
- ❌ Kursziele nennen
- ❌ Renditeversprechen machen
- ❌ Trading-Signale generieren
- ❌ Rohe Finanzkennzahlen anzeigen

### Was das System tut

- ✅ Quantitative Einschätzung liefern
- ✅ Relativen Branchenvergleich bieten
- ✅ Qualitative Beschreibungen generieren
- ✅ Transparente Score-Berechnung

## 🔄 Erweiterung

### Eigene Datenquelle einbinden

```python
from scoring.data_loader import DataSourceBase, CompanyFinancials

class MyAPIDataSource(DataSourceBase):
    def get_company_data(self, symbol: str):
        # Eigene API-Logik
        pass
    
    def get_sector_companies(self, sector: str):
        # Eigene API-Logik
        pass
    
    def get_all_companies(self):
        # Eigene API-Logik
        pass

# Verwendung
from scoring.api import ScoringAPI
from scoring.data_loader import DataLoader

my_source = MyAPIDataSource()
loader = DataLoader(use_mock=False, data_source=my_source)
api = ScoringAPI(data_loader=loader)
```

### Gewichtungen anpassen

Editiere `config.py`:

```python
SCORE_WEIGHTS = {
    "quality": 0.30,      # Qualität: 30%
    "growth": 0.25,       # Wachstum: 25%
    "stability": 0.25,    # Stabilität: 25%
    "valuation": 0.20     # Bewertung: 20%
}
```

## 📅 Tägliche Aktualisierung

Das System ist für tägliche Aktualisierung ausgelegt:

```python
from scoring.api import get_scoring_api

api = get_scoring_api()

# Cache leeren für Neuberechnung
api.refresh_cache()

# Alle Scores neu berechnen
symbols = api.get_available_symbols()
results = api.batch_score(symbols)
```

## 🤝 Verfügbare Mock-Daten

### Sektoren
- Technology
- Healthcare
- Consumer Discretionary
- Consumer Staples
- Financials
- Industrials
- Energy

### Beispiel-Unternehmen
- AAPL, MSFT, GOOGL, NVDA, META (Technology)
- JNJ, UNH, PFE, LLY, ABBV (Healthcare)
- AMZN, TSLA, NKE, MCD, SBUX (Consumer Discretionary)
- JPM, V, MA, BAC (Financials)
- PG, KO, PEP, WMT (Consumer Staples)
- CAT, HON, UPS (Industrials)
- XOM, CVX (Energy)

---

**Version:** 1.0.0  
**Autor:** Capitovo  
**Lizenz:** Proprietär
