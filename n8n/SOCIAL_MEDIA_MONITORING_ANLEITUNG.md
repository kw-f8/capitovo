# 🔥 Social Media Monitoring Agent - Setup & Verwendung

## 🎯 Was macht dieser Agent?

Der **Social Media Monitoring Agent** trackt Social Media Buzz rund um Aktien und identifiziert virale Trends **bevor** sie Mainstream werden.

### 🔍 3 Haupt-Agenten:

#### 1. **Portfolio Social Monitoring** 📊
- Überwacht ALLE bereits analysierten Aktien (aus `analysen.json`)
- Twitter/X, Reddit WSB, StockTwits Sentiment
- Mention-Spikes und Viral-Potenzial
- Red Flags (FUD, Short-Kampagnen)

#### 2. **Trend Discovery Agent** 🚀
- Findet NEUE aufkommende Aktien
- Reddit Posts mit >500 Upvotes
- Twitter Mention-Spikes (+200% vs. Vorwoche)
- Meme-Stock-Potenzial identifizieren
- Short Squeeze Kandidaten

#### 3. **Influencer Tracking Agent** 👥
- Monitort bekannte FinTwit-Accounts:
  - Elon Musk (@elonmusk)
  - Cathie Wood (@CathieDWood)
  - Chamath Palihapitiya (@chamath)
  - Bill Ackman, Michael Burry, Jim Cramer
  - Deutsche Finanz-Influencer
- Bullish/Bearish Signale
- Market Impact Measurement

---

## 🚀 Installation

### 1. Workflow importieren

```bash
# In n8n:
# Settings > Import from File > n8n_social_media_monitoring_agent.json
```

### 2. Perplexity API konfigurieren

Gleiche Credentials wie bei den anderen Agenten.

### 3. Slack Webhook (empfohlen!)

**Wichtig:** Dieser Agent sendet **Urgency-Alerts** bei hoher Social-Aktivität!

---

## ⚙️ Konfiguration

### Schedule anpassen

**Standard: Alle 6 Stunden**

```json
{
  "cronExpression": "0 */6 * * *"
}
```

**Empfohlene Alternativen:**
- **Alle 4 Stunden** (aggressiv): `0 */4 * * *`
- **Alle 12 Stunden** (entspannt): `0 */12 * * *`
- **Nur Börsenzeiten** (9-17 Uhr, Mo-Fr): `0 9-17/2 * * 1-5`

### Dateipfade prüfen

```javascript
// In "Load Portfolio" Node
const analysenPath = '/workspaces/capitovo/data/analysen.json';

// In "Generate Social Report" Node
const reportPath = `/workspaces/capitovo/n8n/social_media_report_${date}.md`;
```

---

## 🔄 Workflow-Ablauf

```
⏰ Schedule Trigger (alle 6h)
    ↓
📂 Load Portfolio (analysen.json lesen)
    ↓
    ├─> 📊 Portfolio Social Monitoring (Perplexity)
    │       ↓ Hot Trends, Sentiment, Alerts
    │   Parse Portfolio Monitoring
    │
    ├─> 🚀 Trend Discovery Agent (Perplexity)
    │       ↓ Neue virale Aktien
    │   Parse Trend Discovery
    │
    └─> 👥 Influencer Tracking Agent (Perplexity)
            ↓ Influencer-Mentions
        Parse Influencer Tracking
            
    ↓ (alle kombinieren)
Combine Social Insights
    ↓ (Urgency Score berechnen)
Generate Social Report (.md Datei)
    ↓
High Urgency? (If-Node)
    ├─> 🚨 YES: Slack Urgent Alert
    └─> ✅ NO: Slack Routine Update
```

---

## 📊 Urgency Scoring System

Der Agent berechnet einen **Urgency Score (0-6)**:

| Component | Points | Trigger |
|-----------|--------|---------|
| **Portfolio Hot Trends** | +3 | Bestehende Aktien viral |
| **New Emerging Trends** | +2 | Neue Kandidaten gefunden |
| **Influencer Mentions** | +1 | VIP-Accounts aktiv |

### Urgency Levels:

- **🚨 HIGH (4-6):** Sofortiges Handeln erforderlich
- **⚠️ MEDIUM (2-3):** Beobachten, bei Momentum reagieren
- **✅ LOW (0-1):** Routine-Monitoring, keine Actions

---

## 📄 Generated Report

### Dateiname
```
social_media_report_2025-11-30.md
```

### Struktur

#### 1. Portfolio Sentiment
- 🔥 **Hot Right Now:** Top 3 trending Aktien aus Portfolio
- 📈 **Sentiment Overview:** Alle überwachten Aktien
- 🚨 **Alerts:** Negative Shifts, FUD
- 💡 **Content Opportunities:** Welche priorisieren?

#### 2. New Emerging Trends
- 🚀 **Top 5 Discoveries:** Neue virale Aktien
- 📈 **Trend Categories:** AI, EV, Biotech, etc.
- ⚠️ **Pump & Dump Warnings:** Verdächtige Aktivitäten

#### 3. Influencer Signals
- 📢 **Recent Activity:** Wer hat was erwähnt?
- 🔥 **Most Impactful:** Größte Market-Moving-Mention
- 📊 **Sentiment Breakdown:** Bullish vs. Bearish

#### 4. Action Items
- Basierend auf Urgency Level
- Top New Candidate for Analysis
- Konkrete Next Steps

---

## 🎯 Use Cases

### 1. Portfolio-Schutz 🛡️
**Problem:** Deine Ferrari-Analyse ist draußen, plötzlich geht FUD viral auf Reddit.

**Lösung:** Agent erkennt negative Sentiment-Shifts → Alert → Du kannst reagieren (Update, Gegendarstellung)

### 2. Trend-Surfing 🏄
**Problem:** Aktie geht viral, aber du hast keine Analyse.

**Lösung:** Agent identifiziert frühe Trends → Du erstellst Analyse BEVOR es Mainstream wird → Maximaler Traffic

### 3. Influencer-Alpha 💎
**Problem:** Cathie Wood kauft massiv eine Aktie, du erfährst es zu spät.

**Lösung:** Agent trackt Influencer-Activity → Sofortige Benachrichtigung → Du schreibst Analyse während es hot ist

### 4. Meme-Stock-Warnung ⚠️
**Problem:** Pump & Dump koordiniert auf Reddit/Discord.

**Lösung:** Agent erkennt verdächtige Muster → Warnt dich → Du vermeidest riskante Analysen

---

## 🔔 Slack Notifications

### HIGH Urgency Alert 🚨
```
🔥 SOCIAL MEDIA ALERT - HIGH URGENCY

⚠️ Urgency Level: HIGH (Score: 5/6)

🚀 Top New Trend: NVDA

📊 Report: social_media_report_2025-11-30.md

💡 Empfehlung: Hohe Social Media Aktivität! 
Prüfe Portfolio-Aktien und erwäge schnelle Content-Reaktion.

🔗 Action: Report öffnen und TOP-Trends priorisieren!
```

### Routine Update ✅
```
📊 Social Media Monitoring Update

✅ Urgency Level: LOW

📈 Top Trend: Keine besonderen Trends

📄 Report: social_media_report_2025-11-30.md

*Routine-Monitoring abgeschlossen. Keine dringenden Actions.*
```

---

## 🧠 Agent-Logik

### Portfolio Social Monitoring

**Input:** Liste aller Tickers aus `analysen.json`

**Perplexity Prompt:**
- Welche dieser Aktien werden diskutiert? (letzte 24h)
- Sentiment: Bullish/Bearish/Neutral (Score 0-10)
- Top Posts mit Engagement-Zahlen
- Warum trendet es? (Catalysts)
- Viral Potential: Low/Medium/High

**Settings:**
- `temperature: 0.2` (faktisch, präzise)
- `search_recency_filter: day` (nur aktuelle Daten)

### Trend Discovery Agent

**Input:** EXCLUDE bereits analysierte Aktien

**Perplexity Prompt:**
- Reddit WSB: Posts >500 Upvotes (48h)
- Twitter: Mention-Spikes +200% vs. Vorwoche
- StockTwits: Watchlist-Adds +50%
- YouTube: Neue Videos von großen Channels
- Meme-Potential: Short Interest >20%, Market Cap <$10B

**Suchkriterien:**
1. Viral Score (0-10)
2. Investment Thesis
3. Risk Level (Low/Medium/High)
4. Action: Sofort / Beobachten / Ignorieren

**Settings:**
- `temperature: 0.3` (etwas kreativer für Discovery)
- `max_tokens: 3000` (mehr Details)

### Influencer Tracking Agent

**Input:** Liste wichtiger FinTwit-Accounts

**Tracked Accounts:**
- US: Elon, Cathie, Chamath, Ackman, Burry, Cramer, Portnoy
- DE: Kolja Barghoorn, etc.

**Perplexity Prompt:**
- Welche Aktien erwähnt? (48h)
- Stance: Bullish/Bearish/Neutral
- Buy/Sell/Hold Signale
- Engagement (Likes, RTs)
- Market Impact (Kurs-Reaktion)

**Settings:**
- `temperature: 0.1` (sehr präzise, keine Halluzinationen)
- `max_tokens: 2000`

---

## 📈 Best Practices

### 1. Schnelle Reaktion bei HIGH Urgency 🚨
- Report sofort lesen
- Top-Trend prüfen
- Entscheidung: Analyse starten? Social Media Post? Abwarten?
- Innerhalb 1-2 Stunden reagieren (viral window!)

### 2. Portfolio-Maintenance 🛠️
- MEDIUM Alerts: Wöchentlich reviewen
- Negative Sentiment → Analyse updaten?
- Positive Buzz → Social Media nutzen für Promotion

### 3. Trend-Pipeline 📊
- Top 3 New Trends in Watchlist
- Bei weiterem Momentum → Content Strategy Agent triggern
- Nicht JEDES Meme verfolgen (Pump & Dump Warnings beachten!)

### 4. Influencer-Alpha nutzen 💎
- Cathie Wood kauft → Bullish Signal
- Burry shortet → Bearish (aber contrarian möglich)
- Cramer empfiehlt → Inverse Cramer? 😄

---

## 🔧 Troubleshooting

### "No trending stocks found"

**Ursache:** Perplexity findet keine relevanten Social-Daten

**Lösung:**
- Prüfe ob Tickers korrekt sind (US-Tickers: TSLA, nicht Tesla)
- Schedule auf aktivere Zeiten legen (Börsenöffnung)
- `search_recency_filter` auf "week" erweitern

### "Urgency always LOW"

**Ursache:** Scoring-Schwellwerte zu hoch

**Lösung:**
```javascript
// In "Combine Social Insights" Node anpassen:
const hasHotTrending = portfolio.hotTrending.length > 50; // war 100
const hasNewTrends = trends.trendingStocks.length > 0;
const hasInfluencerMentions = influencers.mostImpactful.length > 30; // war 50
```

### Zu viele FALSE Positives (Pump & Dumps)

**Ursache:** Koordinierte Pump-Kampagnen

**Lösung:**
- Trend Discovery Agent ist bereits darauf trainiert
- **Immer** "Pump & Dump Warnings" Section lesen
- Aktien mit Risk Level "HIGH" + Short Interest >50% skeptisch prüfen

---

## 🎨 Anpassungen

### Andere Social Platforms hinzufügen

Im Prompt ergänzen:
```javascript
// Z.B. LinkedIn, YouTube Comments, Discord, Telegram
"Analysiere auch: LinkedIn Finance Posts, YouTube Kommentare bei großen Finance-Channels..."
```

### Nur deutsche Aktien monitoren

```javascript
// Im "Portfolio Social Monitoring" Prompt:
"Fokussiere NUR auf deutsche Aktien (DAX, MDAX, SDAX). US-Aktien ignorieren."
```

### Custom Influencer-Liste

```javascript
// Im "Influencer Tracking Agent" Prompt:
"Überwache folgende Accounts: @custom1, @custom2, ..."
```

### Erweiterte Metrics

```javascript
// Zusätzliche Daten abfragen:
"6️⃣ Google Trends: Suchvolumen-Entwicklung"
"7️⃣ Options Activity: Unusual Options Volume"
"8️⃣ Insider Trading: Recent Buys/Sells"
```

---

## 🔗 Integration mit anderen Agenten

### 1. Content Strategy Agent
**Trigger bei MEDIUM/HIGH Urgency:**
```javascript
// In "High Urgency?" Node einen Branch hinzufügen
// → Startet Content Strategy Agent mit Top-Trend als Input
```

### 2. Analyse Generator
**Automatische Analyse bei viralem Trend:**
```javascript
// Webhook-Call zum Analyse-Generator
// Input: topNewCandidate Ticker + Company
```

### 3. Fact-Checking Agent (wenn gebaut)
**Bei negativem Sentiment:**
```javascript
// Triggert Fact-Check für Portfolio-Aktien mit Alerts
// Verifiziert ob FUD berechtigt ist
```

---

## 📊 Expected Results

### Beispiel: HIGH Urgency Szenario

**Situation:** Tesla kündigte gestern neue Robotaxi-Pläne an.

**Agent Output:**
```markdown
## 🔥 HOT RIGHT NOW

### 1. TSLA - Tesla Inc.
**Mention Spike:** +340% vs. gestern
**Sentiment:** Bullish (Score: 9/10)
**Top Post:** Reddit WSB Post mit 4.2K Upvotes: "TSLA to the moon! 🚀"
**Catalysts:** Robotaxi Event gestern, Musk tweeted 3x
**Viral Potential:** HIGH

## 👥 INFLUENCER ACTIVITY

### Elon Musk
**Mentioned:** TSLA
**Statement:** "Full Self-Driving update rolling out next week"
**Engagement:** 125K Likes, 18K RTs
**Market Impact:** +5.2% intraday spike

## 🎯 ACTION ITEMS
🚨 URGENT: Hohe Social Media Aktivität erkannt!

1. Tesla-Analyse SOFORT updaten mit Robotaxi-News
2. Social Media Posts vorbereiten (Strike while hot!)
3. Newsletter mit Breaking News verschicken
```

**Deine Reaktion:**
1. Alert kommt via Slack (innerhalb 10 Minuten)
2. Du öffnest Report → siehst TSLA trending
3. Du startest Analyse-Update-Workflow
4. Neue Analyse online in 1-2 Stunden
5. Maximaler Traffic durch perfektes Timing! 🎯

---

## 🚀 Advanced Features

### Multi-Language Sentiment

Erweitere Prompts für deutsche Social Media:
```javascript
"Analysiere auch deutsche Plattformen: FinanzNachrichten.de, WallStreet Online Forum, etc."
```

### Sentiment History

Speichere Reports in Datenbank:
```javascript
// Trend über Zeit tracken
// "War TSLA letzte Woche auch schon bullish?"
```

### Custom Scoring

Eigene Urgency-Faktoren hinzufügen:
```javascript
// Z.B. Google Trends Score
// Z.B. Trading Volume Anomalies
const urgencyScore = 
  (hasHotTrending ? 3 : 0) + 
  (hasNewTrends ? 2 : 0) + 
  (hasInfluencerMentions ? 1 : 0) +
  (googleTrendsSpike ? 2 : 0);
```

---

## 💡 Pro-Tipps

### 1. Timing ist alles ⏰
Viral windows sind kurz (4-12h). HIGH Urgency = sofort reagieren!

### 2. Nicht jedem Trend folgen 🎯
Pump & Dumps ignorieren. Quality over Quantity.

### 3. Contrarian Opportunities 🔄
Negative Sentiment kann Kaufchance sein (wenn fundamental stark).

### 4. Combine mit Fundamentals 📊
Social Buzz + starke Fundamentals = perfekter Sturm!

### 5. Influencer-Inverse 🔀
"Inverse Cramer" ist real. Teste es! 😄

---

## 📚 Ressourcen

- **Reddit WallStreetBets:** r/wallstreetbets
- **StockTwits:** stocktwits.com
- **FinTwit:** twitter.com/search?q=%24TICKER
- **Unusual Whales:** unusualwhales.com (Options Activity)

---

**Viel Erfolg beim Social Media Monitoring! 🔥🚀**

*Remember: The trend is your friend... until it ends!* 📈
