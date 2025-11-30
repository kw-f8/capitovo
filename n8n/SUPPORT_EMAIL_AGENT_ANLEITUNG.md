# 📧 Support Email Agent (Outlook) - Setup & Verwendung

## 🎯 Was macht dieser Agent?

Der **Support Email Agent** managed dein Outlook-Postfach vollautomatisch:

### ✨ Kernfunktionen:

1. **🔍 Auto-Classification** - Kategorisiert jede Email automatisch
2. **🤖 AI-Powered Responses** - Perplexity generiert professionelle Antworten
3. **📂 Smart Folders** - Sortiert Emails nach Priorität/Kategorie
4. **🚨 Priority Alerts** - Slack-Benachrichtigung bei dringenden Anfragen
5. **🗑️ Spam Filtering** - Automatische Spam-Erkennung und -Filterung
6. **📊 Daily Summary** - Tägliche Statistiken über Support-Aktivität

---

## 🚀 Installation

### 1. Outlook OAuth2 einrichten

#### In Azure Portal (Microsoft 365):
```
1. Gehe zu: https://portal.azure.com
2. Azure Active Directory > App Registrations > New Registration
3. Name: "capitovo n8n Support Agent"
4. Supported account types: "Accounts in this organizational directory only"
5. Redirect URI: 
   Platform: Web
   URL: https://your-n8n-instance.com/rest/oauth2-credential/callback
6. Register

7. Nach Erstellung:
   - Kopiere "Application (client) ID"
   - Kopiere "Directory (tenant) ID"
   
8. Certificates & secrets > New client secret
   - Description: "n8n Support Agent"
   - Expires: 24 months
   - Kopiere den Secret VALUE (erscheint nur einmal!)

9. API Permissions > Add permission
   - Microsoft Graph > Delegated permissions
   - Wähle aus:
     ✅ Mail.Read
     ✅ Mail.ReadWrite
     ✅ Mail.Send
     ✅ MailboxSettings.Read
   - Grant admin consent
```

#### In n8n:
```
1. Credentials > New Credential > Microsoft Outlook OAuth2 API
2. Name: "Outlook Support Account"
3. Eintragen:
   - Client ID: [aus Azure]
   - Client Secret: [aus Azure]
   - Tenant ID: [aus Azure]
4. OAuth2 Flow durchführen (Connect Button)
5. Outlook-Login mit Support-Account
6. Autorisierung bestätigen
```

### 2. Workflow importieren

```bash
# In n8n:
# Settings > Import from File > n8n_support_email_agent_outlook.json
```

### 3. Outlook-Ordnerstruktur erstellen

Erstelle folgende Ordner in Outlook:

```
📁 Support/
  ├─ 📂 High-Priority      (Dringende Anfragen)
  ├─ 📂 Auto-Replied       (Automatisch beantwortet)
  └─ 📂 Processed          (Manuell bearbeitet)
```

**Wichtig:** Die Ordner-Namen müssen EXAKT so heißen!

### 4. Perplexity API + Slack konfigurieren

Gleiche Credentials wie bei den anderen Agenten.

---

## ⚙️ Konfiguration

### Schedule anpassen

**Standard: Alle 15 Minuten**

```json
{
  "cronExpression": "*/15 * * * *"
}
```

**Alternativen:**
- **Alle 5 Minuten** (aggressiv): `*/5 * * * *`
- **Alle 30 Minuten** (entspannt): `*/30 * * * *`
- **Nur Geschäftszeiten** (Mo-Fr, 8-18 Uhr): `*/15 8-18 * * 1-5`

### Email-Kategorien

Der Agent klassifiziert automatisch in:

| Kategorie | Keywords | Priorität | Auto-Reply |
|-----------|----------|-----------|------------|
| **TECHNICAL_SUPPORT** | fehler, bug, problem, funktioniert nicht | HIGH | ❌ |
| **ACCOUNT_ISSUE** | login, passwort, konto, zugang | HIGH | ❌ |
| **BILLING** | rechnung, abonnement, zahlung, kündigung | HIGH | ❌ |
| **CONTENT_REQUEST** | analyse, aktie, empfehlung, wann kommt | MEDIUM | ✅ |
| **GENERAL_INQUIRY** | frage, wie, was, info | MEDIUM | ✅ |
| **FEEDBACK** | feedback, vorschlag, verbesserung | LOW | ✅ |
| **SPAM** | viagra, lottery, noreply | LOW | ❌ |

### Auto-Reply Rules

**Auto-Reply erfolgt NUR bei:**
- ✅ Kategorie: CONTENT_REQUEST, GENERAL_INQUIRY, FEEDBACK
- ✅ Nicht SPAM
- ✅ autoReply = true

**Manuelle Bearbeitung bei:**
- ⚠️ TECHNICAL_SUPPORT
- ⚠️ ACCOUNT_ISSUE
- ⚠️ BILLING
- ⚠️ Alle HIGH Priority Emails

---

## 🔄 Workflow-Ablauf

```
⏰ Alle 15 Minuten
    ↓
📥 Get Unread Emails (Outlook Inbox)
    ↓
🧠 Classify & Extract
    ├─ Kategorie bestimmen
    ├─ Priorität setzen
    └─ Auto-Reply-Flag
    ↓
    ├─> 🚨 High Priority?
    │   ├─ JA: Move to High-Priority Folder
    │   └─ Slack Alert an Team
    │
    ├─> 🤖 Auto-Reply Eligible?
    │   ├─ JA: Generate AI Response (Perplexity)
    │   │   ↓
    │   │   Send Outlook Reply
    │   │   ↓
    │   │   Mark as Read
    │   │   ↓
    │   │   Move to Auto-Replied Folder
    │   └─ NEIN: In Inbox belassen
    │
    ├─> 🗑️ Is Spam?
    │   ├─ JA: Move to Junk Email
    │   └─ Mark as Read
    │
    └─> 📊 Generate Daily Summary (optional)
        └─ Slack: Statistiken
```

---

## 🤖 AI Response Generation

### Perplexity Prompt-Struktur

```javascript
System Prompt:
"Du bist der KI-Support-Agent von capitovo, einer Premium-Plattform 
für Aktienanalysen. Antworte professionell, hilfsbereit und präzise 
auf Deutsch. Sei freundlich aber effizient."

User Prompt:
"Von: Max Mustermann (max@example.com)
Betreff: Wann kommt Tesla Analyse?
Kategorie: CONTENT_REQUEST
Priorität: MEDIUM

Nachricht:
Hallo, wann kommt endlich eine neue Tesla-Analyse? Ich warte schon 
seit Wochen!

---

Aufgabe: Generiere eine professionelle, hilfreiche Antwort.

Richtlinien:
1. Persönliche Anrede mit Namen
2. Kurz und präzise (max. 150 Wörter)
3. Konkrete Lösungen oder nächste Schritte
4. Bei Content-Requests: Verweis auf Roadmap
5. Freundlicher Abschluss mit Support-Signatur"
```

### Beispiel AI-Response

```
Hallo Max,

vielen Dank für deine Nachricht! 

Wir verstehen dein Interesse an einer Tesla-Analyse. Unsere Content-
Strategie richtet sich nach Marktrelevanz und Investoren-Nachfrage. 
Tesla steht definitiv auf unserer Roadmap.

Aktuell kannst du dir unsere bestehende Tesla-Analyse von [Datum] 
ansehen: [Link]. Wir beobachten die Entwicklungen rund um Tesla 
kontinuierlich und werden bei signifikanten News eine aktualisierte 
Analyse veröffentlichen.

Du kannst uns gerne bei konkreten Fragen zu Tesla kontaktieren!

Beste Grüße,
Dein capitovo Support-Team
```

**Settings:**
- `model: sonar` (schneller, günstiger als sonar-pro)
- `temperature: 0.3` (professionell, aber nicht zu steif)
- `max_tokens: 500` (max. ~150 Wörter)

---

## 📂 Outlook Folder Management

### Automatische Sortierung:

**High-Priority Folder:**
- Alle TECHNICAL_SUPPORT, ACCOUNT_ISSUE, BILLING
- Trigger: Slack Alert an Team
- Action: Manuelle Bearbeitung erforderlich

**Auto-Replied Folder:**
- Alle automatisch beantworteten Emails
- Nachträgliche Review möglich
- Retention: 30 Tage (manuell konfigurierbar)

**Junk Email:**
- Automatisch erkannter Spam
- Als gelesen markiert
- Kein weiteres Handling nötig

**Inbox:**
- Nur unbeantwortete Emails
- Wartet auf manuelle Bearbeitung
- Oder nächsten Agent-Lauf

---

## 🚨 Priority Alerting

### Slack Alert bei HIGH Priority:

```
🚨 HIGH PRIORITY SUPPORT EMAIL

Von: Max Mustermann (max@example.com)
Betreff: Kann mich nicht einloggen!
Kategorie: ACCOUNT_ISSUE
Empfangen: 2025-11-30T14:32:00Z

Nachricht:
```
Hallo, ich kann mich seit heute Morgen nicht mehr einloggen. 
Passwort zurücksetzen funktioniert auch nicht. Bitte um 
schnelle Hilfe!
```

⚠️ Action Required: Manuelle Bearbeitung empfohlen!
📧 Email verschoben nach: Support/High-Priority
```

**Reaktionszeit:**
- HIGH Priority: < 2 Stunden
- MEDIUM Priority: < 24 Stunden
- LOW Priority: < 3 Tage

---

## 📊 Daily Summary (optional)

**Deaktiviert per Default** (Node ist "disabled")

Zum Aktivieren:
```
1. In n8n: Node "Slack: Daily Summary" öffnen
2. "Disabled" Toggle auf OFF
3. Save Workflow
```

**Summary-Format:**
```
📊 Support Email Summary
Datum: 30.11.2025

📧 Gesamt: 24 Emails
🚨 High Priority: 3
🤖 Auto-Replied: 18
🗑️ Spam gefiltert: 3

Kategorien:
• CONTENT_REQUEST: 12
• GENERAL_INQUIRY: 6
• TECHNICAL_SUPPORT: 2
• ACCOUNT_ISSUE: 1
• FEEDBACK: 3
```

**Schedule:** Täglich um 18:00 Uhr
```json
// Separater Schedule Trigger hinzufügen
{
  "cronExpression": "0 18 * * *"
}
```

---

## 🔧 Troubleshooting

### "Outlook authentication failed"

**Ursache:** OAuth2 Token abgelaufen

**Lösung:**
```
1. n8n Credentials > Outlook Support Account
2. "Reconnect" Button klicken
3. Outlook-Login erneut durchführen
4. Autorisierung bestätigen
```

### "Folder 'Support/High-Priority' not found"

**Ursache:** Ordner existiert nicht in Outlook

**Lösung:**
```
1. Outlook öffnen
2. Ordner erstellen: 
   - Rechtsklick auf Inbox > New Folder
   - Name: "Support"
   - In Support: Ordner "High-Priority" erstellen
3. Workflow erneut testen
```

### "AI Response too generic"

**Ursache:** Prompt zu allgemein

**Lösung:**
```javascript
// In "Generate AI Response" Node, Prompt erweitern:
"6️⃣ Berücksichtige folgende FAQs:
   - Tesla-Analyse: Roadmap Q1 2026
   - Login-Probleme: Passwort zurücksetzen über [Link]
   - Abo kündigen: Email an billing@capitovo.de"
```

### "Too many emails, agent slow"

**Ursache:** Viele ungelesene Emails im Postfach

**Lösung:**
```
1. Option A: Batch-Limit setzen
   // In "Get Unread Support Emails" Node
   "options": {
     "limit": 50  // Max. 50 Emails pro Lauf
   }

2. Option B: Schedule häufiger (z.B. alle 5 Minuten)
3. Option C: Historische Emails manuell archivieren
```

---

## 🎨 Anpassungen

### Custom Kategorien hinzufügen

```javascript
// In "Classify & Extract" Node

// Partnership Requests
else if (subjectLower.includes('partnership') || 
         subjectLower.includes('kooperation') ||
         subjectLower.includes('zusammenarbeit')) {
  category = 'PARTNERSHIP';
  priority = 'MEDIUM';
  autoReply = false; // Manuelle Bearbeitung
}

// Press Inquiries
else if (subjectLower.includes('presse') || 
         subjectLower.includes('interview') ||
         subjectLower.includes('journalist')) {
  category = 'PRESS';
  priority = 'HIGH';
  autoReply = false;
}
```

### Spam-Filter erweitern

```javascript
// Mehr Spam-Patterns
else if (subjectLower.includes('crypto') ||
         subjectLower.includes('investment opportunity') ||
         subjectLower.includes('urgent action required') ||
         from.includes('info@') ||
         from.includes('admin@')) {
  category = 'SPAM';
  priority = 'LOW';
}
```

### Multi-Language Support

```javascript
// In AI Response Prompt:
"Erkenne die Sprache der Anfrage und antworte in der gleichen Sprache:
 - Deutsch: Standard
 - Englisch: Professional tone
 - Französisch/Spanisch: Falls möglich"

// Perplexity Settings anpassen:
"model": "sonar-pro",  // Bessere Mehrsprachigkeit
"temperature": 0.4     // Etwas flexibler
```

### Auto-Signature anpassen

```javascript
// In "Prepare Reply" Node, Body erweitern:
return {
  json: {
    ...
    body: aiResponse + `\n\n---\n\n` +
          `📧 capitovo Support\n` +
          `🌐 www.capitovo.de\n` +
          `📱 Social: @capitovo_de\n\n` +
          `💡 Tipp: Folge uns für tägliche Markt-Updates!`
  }
};
```

---

## 📈 Best Practices

### 1. Regelmäßige Review 🔍

**Wöchentlich:**
- "Auto-Replied" Folder durchsehen
- AI-Response-Qualität prüfen
- Bei Fehlern: Prompt anpassen

**Monatlich:**
- Kategorisierungs-Genauigkeit messen
- Neue Spam-Patterns hinzufügen
- FAQ-Datenbank updaten

### 2. Response Time Tracking ⏱️

```javascript
// Erweitere "Classify & Extract" um Timestamp
receivedTime: email.receivedDateTime,
processedTime: new Date().toISOString(),
responseTime: null  // Später berechnen
```

### 3. Escalation Rules 📋

**Auto-Escalation nach 24h:**
```javascript
// Zusätzlicher Node: "Check Unresponded"
// Läuft täglich, prüft Inbox
// Emails >24h alt → Slack Alert + High-Priority
```

### 4. Knowledge Base Integration 📚

```javascript
// In AI Response Prompt, füge FAQ-Datenbank hinzu:
"Berücksichtige folgende FAQs:
{
  'login-probleme': 'Anleitung: [Link]',
  'abo-kuendigung': 'Email an billing@...',
  'analyse-anfrage': 'Roadmap: [Link]'
}"
```

### 5. A/B Testing von Responses 🧪

```javascript
// Variante A: Förmlich
// Variante B: Locker
// Messe: Reply Rate, Positive Feedback
```

---

## 🔗 Integration mit anderen Agenten

### Mit Content Strategy Agent

**Use Case:** Content-Anfragen tracken

```javascript
// Wenn >10 Anfragen für gleiche Aktie → Trigger Content Strategy
if (contentRequests['TSLA'] > 10) {
  // HTTP Request zu Content Strategy Agent
  // Input: "TSLA hat hohe User-Nachfrage"
}
```

### Mit Social Media Agent

**Use Case:** Feedback in Social Monitoring

```javascript
// User-Feedback zu Analysen → Social Sentiment
// "Eure Tesla-Analyse war super!" → Positive Signal
```

### Mit CRM (zukünftig)

**Use Case:** Customer Data enrichment

```javascript
// Email-Interaktionen in CRM speichern
// Segment: "High-Value-Kunden mit vielen Anfragen"
```

---

## 💡 Pro-Tipps

### 1. Inbox Zero Strategy 📬

Ziel: Inbox immer leer
- Agent läuft alle 5-10 Minuten
- Alle Emails werden kategorisiert + verschoben
- Nur HIGH Priority bleibt sichtbar (in separatem Folder)

### 2. Template Responses 📝

Für häufige Anfragen:
```javascript
// Templates in Code Node speichern
const templates = {
  'login-issue': `Hallo {name},\n\nProbiere bitte:\n1. Cache löschen\n2. Passwort zurücksetzen...`,
  'content-request': `Hallo {name},\n\nDanke für deinen Input! {ticker} steht auf unserer Roadmap...`
};
```

### 3. Sentiment Analysis 😊😠

Erweitere AI-Agent:
```javascript
// Erkenne negative Stimmung
if (bodyLower.includes('unzufrieden') || 
    bodyLower.includes('enttäuscht')) {
  priority = 'HIGH';  // Eskaliere frustrierte Kunden
  category = 'COMPLAINT';
}
```

### 4. Auto-Follow-Up ⏰

```javascript
// Wenn nach 3 Tagen keine Antwort:
// "Hallo {name}, konnten wir deine Frage beantworten?"
```

---

## 📚 Ressourcen

- **Microsoft Graph API Docs:** https://learn.microsoft.com/en-us/graph/api/overview
- **n8n Outlook Node:** https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.microsoftoutlook/
- **OAuth2 Setup Guide:** https://docs.n8n.io/integrations/builtin/credentials/microsoft/

---

**Viel Erfolg mit deinem AI-Support-Team! 🤖📧**

*Pro-Tipp: Der Agent spart dir ~10-15 Stunden Support-Arbeit pro Woche!* ⏰✨
