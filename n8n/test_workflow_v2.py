#!/usr/bin/env python3
"""
Standalone Test für n8n Workflow v2
Simuliert die wichtigsten Nodes lokal
"""

import json
import os
from datetime import datetime

# Test-Daten
test_input = {
    "company": "Apple",
    "ticker": "AAPL",
    "sector": "Technologie",
    "date": "2026-01-18"
}

print("🧪 n8n Workflow v2 - Standalone Test\n")
print("=" * 60)

# ═══════════════════════════════════════════════════════════
# STAGE 1: INPUT VALIDATION
# ═══════════════════════════════════════════════════════════

print("\n1️⃣  Input Validator")
print("-" * 60)

# Pflichtfelder prüfen
required_fields = ['company', 'ticker']
missing = [f for f in required_fields if f not in test_input or not test_input[f]]
if missing:
    print(f"❌ Fehlende Pflichtfelder: {', '.join(missing)}")
    exit(1)

# Sector Mapping
sector_map = {
    'tech': 'Technologie',
    'technology': 'Technologie',
    'technologie': 'Technologie',
    'finance': 'Finanzen',
    'healthcare': 'Gesundheit',
}

raw_sector = test_input.get('sector', 'Technologie').lower().strip()
sector = sector_map.get(raw_sector, test_input.get('sector', 'Technologie'))

company = test_input['company'].strip()
ticker = test_input['ticker'].upper().strip()
date = test_input.get('date', datetime.now().strftime('%Y-%m-%d'))
base_dir = '/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo'

# Slug generieren
slug = f"{company}-{ticker}".lower()
slug = slug.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
slug = ''.join(c if c.isalnum() else '-' for c in slug)
slug = slug.strip('-')

# Exchange Detection
exchange_map = {
    'AAPL': {'exchange': 'NASDAQ', 'currency': 'USD'},
    'MSFT': {'exchange': 'NASDAQ', 'currency': 'USD'},
    'TSLA': {'exchange': 'NASDAQ', 'currency': 'USD'},
    'SAP': {'exchange': 'XETRA', 'currency': 'EUR'},
}
exchange_info = exchange_map.get(ticker, {'exchange': 'NYSE', 'currency': 'USD'})

validated_data = {
    'company': company,
    'ticker': ticker,
    'sector': sector,
    'date': date,
    'baseDir': base_dir,
    'slug': slug,
    'exchange': exchange_info['exchange'],
    'currency': exchange_info['currency'],
}

print(f"✅ Company: {company}")
print(f"✅ Ticker: {ticker}")
print(f"✅ Sector: {sector}")
print(f"✅ Exchange: {exchange_info['exchange']}")
print(f"✅ Currency: {exchange_info['currency']}")
print(f"✅ Slug: {slug}")

# ═══════════════════════════════════════════════════════════
# STAGE 2: HISTORY LOADER
# ═══════════════════════════════════════════════════════════

print("\n2️⃣  History Loader")
print("-" * 60)

previous_analysis = None
history_context = ''

try:
    json_path = os.path.join(base_dir, 'data', 'analysen.json')
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            analysen = json.load(f)
        
        # Suche frühere Analyse
        previous = next((a for a in analysen 
                        if a.get('id', '').lower().startswith(f"{ticker.lower()}-") 
                        and a.get('date') != date), None)
        
        if previous:
            previous_analysis = {
                'id': previous['id'],
                'date': previous['date'],
                'title': previous.get('title', ''),
                'recommendation': previous.get('recommendation')
            }
            print(f"✅ Frühere Analyse gefunden: {previous['id']}")
            print(f"   Datum: {previous['date']}")
            print(f"   Empfehlung: {previous.get('recommendation', 'N/A')}")
        else:
            print("ℹ️  Keine frühere Analyse gefunden (erste Analyse)")
    else:
        print(f"⚠️  analysen.json nicht gefunden: {json_path}")
except Exception as e:
    print(f"⚠️  Fehler beim Laden der Historie: {e}")

# ═══════════════════════════════════════════════════════════
# STAGE 3: RESEARCH ORCHESTRATOR
# ═══════════════════════════════════════════════════════════

print("\n3️⃣  Research Orchestrator")
print("-" * 60)

system_prompt = f"""Du agierst als Senior Equity Research Analyst für einen deutschsprachigen Börsenbrief.
SPRACHE: Deutsch
WÄHRUNG: {validated_data['currency']}"""

prompts = [
    {'id': 'marketValuation', 'name': 'Marktbewertung', 'length': '150-200 Wörter'},
    {'id': 'fundamentals', 'name': 'Fundamentaldaten', 'length': '200-250 Wörter'},
    {'id': 'competition', 'name': 'Wettbewerb', 'length': '200-250 Wörter'},
    {'id': 'risks', 'name': 'Risiken', 'length': '200-250 Wörter'},
    {'id': 'thesis', 'name': 'Investment-These', 'length': '250-300 Wörter'},
]

print(f"✅ System Prompt erstellt ({len(system_prompt)} Zeichen)")
print(f"✅ {len(prompts)} spezialisierte Prompts generiert:")
for p in prompts:
    print(f"   - {p['name']} ({p['length']})")

# ═══════════════════════════════════════════════════════════
# MOCK: Perplexity API Calls
# ═══════════════════════════════════════════════════════════

print("\n4️⃣  Perplexity API (MOCK)")
print("-" * 60)
print("⚠️  HINWEIS: Echte API-Calls werden hier simuliert")
print(f"   Würde 5 parallele Calls zu Perplexity sonar-pro machen")
print(f"   Geschätzte Kosten: ~$0.10-0.15")
print()

mock_sections = {
    'marketValuation': f"## Marktbewertung\n\n- **Aktueller Kurs:** 185.50 {validated_data['currency']}\n- **Marktkapitalisierung:** 2.85 Billionen {validated_data['currency']}",
    'fundamentals': "## Fundamentaldaten\n\n| Kennzahl | Wert |\n|----------|------|\n| KGV | 29.5 |",
    'competition': "## Wettbewerb\n\nMarktführer mit ~58% Marktanteil.",
    'risks': "## Risiken\n\n- Regulatorische Eingriffe\n- China-Abhängigkeit",
    'thesis': f"## Investment-These\n\n**Empfehlung: HALTEN**\n\n**Kursziel:** 210 {validated_data['currency']}"
}

print("✅ 5 Sektionen generiert (Mock-Daten)")
for section_id, content in mock_sections.items():
    words = len(content.split())
    print(f"   - {section_id}: {words} Wörter")

# ═══════════════════════════════════════════════════════════
# STAGE 4: QUALITY CHECK
# ═══════════════════════════════════════════════════════════

print("\n6️⃣  Quality Check (MOCK)")
print("-" * 60)

quality_score = 8
quality_comment = "Gute Struktur, klare Empfehlung, präzise Zahlen."

print(f"✅ Quality Score: {quality_score}/10")
print(f"✅ Kommentar: {quality_comment}")

# ═══════════════════════════════════════════════════════════
# STAGE 5: FILE OPERATIONS
# ═══════════════════════════════════════════════════════════

print("\n9️⃣  File Writer (DRY RUN)")
print("-" * 60)

html_path = os.path.join(base_dir, 'Abonenten', f"{slug}.html")
json_path = os.path.join(base_dir, 'data', 'analysen.json')
svg_path = os.path.join(base_dir, 'data', 'vorschaubilder', f"{slug}.svg")

print(f"📄 HTML: {html_path}")
print(f"📄 JSON: {json_path}")
print(f"📄 SVG: {svg_path}")
print()

# Prüfe ob Verzeichnisse existieren
html_dir = os.path.dirname(html_path)
svg_dir = os.path.dirname(svg_path)

if os.path.exists(html_dir):
    print(f"✅ Abonenten/ Verzeichnis existiert")
else:
    print(f"⚠️  Abonenten/ Verzeichnis fehlt: {html_dir}")

if os.path.exists(os.path.dirname(json_path)):
    print(f"✅ data/ Verzeichnis existiert")
else:
    print(f"⚠️  data/ Verzeichnis fehlt: {os.path.dirname(json_path)}")

if os.path.exists(svg_dir):
    print(f"✅ vorschaubilder/ Verzeichnis existiert")
else:
    print(f"⚠️  vorschaubilder/ Verzeichnis fehlt - würde erstellt werden")

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("📊 TEST SUMMARY")
print("=" * 60)
print()
print(f"Analyse: {company} ({ticker})")
print(f"Sektor: {sector}")
print(f"Datum: {date}")
print(f"Slug: {slug}")
print(f"Exchange: {validated_data['exchange']}")
print(f"Currency: {validated_data['currency']}")
print()
print(f"Quality Score: {quality_score}/10")
print(f"Empfehlung: HALTEN")
print(f"Kursziel: 210 {validated_data['currency']}")
print()
print("✅ Alle Validierungen erfolgreich")
print("✅ 5 Sektionen erstellt")
print("✅ Quality Gate bestanden (Score ≥ 6)")
print()
print("⚠️  HINWEIS: Dies ist ein DRY RUN")
print("   Für echte Datei-Operationen: n8n Workflow importieren")
print()
print("=" * 60)
