#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# n8n Workflow v2 - Quick Start
# ═══════════════════════════════════════════════════════════════

echo "🚀 n8n Workflow v2 - Quick Start"
echo "════════════════════════════════════════════════════════════"
echo ""

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Arbeitsverzeichnis
WORKSPACE="/Users/kevinwaibel/Dokumente/capitovo/Code/capitovo"
cd "$WORKSPACE" || exit 1

echo "📁 Workspace: $WORKSPACE"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. Prüfe Verzeichnisstruktur
# ═══════════════════════════════════════════════════════════════

echo "1️⃣  Prüfe Verzeichnisstruktur..."
echo "────────────────────────────────────────────────────────────"

if [ -d "Abonenten" ]; then
  echo -e "${GREEN}✅${NC} Abonenten/ existiert"
else
  echo -e "${RED}❌${NC} Abonenten/ fehlt"
  mkdir -p Abonenten
  echo -e "${YELLOW}📁${NC} Abonenten/ erstellt"
fi

if [ -d "data" ]; then
  echo -e "${GREEN}✅${NC} data/ existiert"
else
  echo -e "${RED}❌${NC} data/ fehlt"
  mkdir -p data
  echo -e "${YELLOW}📁${NC} data/ erstellt"
fi

if [ -d "data/vorschaubilder" ]; then
  echo -e "${GREEN}✅${NC} data/vorschaubilder/ existiert"
else
  echo -e "${RED}❌${NC} data/vorschaubilder/ fehlt"
  mkdir -p data/vorschaubilder
  echo -e "${YELLOW}📁${NC} data/vorschaubilder/ erstellt"
fi

# Prüfe analysen.json
if [ -f "data/analysen.json" ]; then
  echo -e "${GREEN}✅${NC} data/analysen.json existiert"
  ANALYSE_COUNT=$(jq '. | length' data/analysen.json 2>/dev/null || echo "0")
  echo "   └─ $ANALYSE_COUNT Analysen vorhanden"
else
  echo -e "${YELLOW}⚠️${NC}  data/analysen.json fehlt - wird beim ersten Workflow-Run erstellt"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. Prüfe Workflow-Datei
# ═══════════════════════════════════════════════════════════════

echo "2️⃣  Prüfe Workflow-Datei..."
echo "────────────────────────────────────────────────────────────"

WORKFLOW_FILE="n8n/n8n_analyse_generator_workflow_v2.json"

if [ -f "$WORKFLOW_FILE" ]; then
  echo -e "${GREEN}✅${NC} $WORKFLOW_FILE gefunden"
  
  # JSON validieren
  if jq -e '.' "$WORKFLOW_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} JSON-Syntax valide"
    
    NODE_COUNT=$(jq '.nodes | length' "$WORKFLOW_FILE")
    echo "   └─ $NODE_COUNT Nodes"
    
    # Prüfe API Key
    API_KEY=$(jq -r '.nodes[] | select(.name == "4. Perplexity API") | .parameters.headerParameters.parameters[] | select(.name == "Authorization") | .value' "$WORKFLOW_FILE" 2>/dev/null)
    
    if [[ $API_KEY == Bearer\ pplx-* ]]; then
      echo -e "${GREEN}✅${NC} Perplexity API Key gesetzt (${API_KEY:0:25}...)"
    else
      echo -e "${RED}❌${NC} Perplexity API Key fehlt oder ungültig"
    fi
  else
    echo -e "${RED}❌${NC} JSON-Syntax fehlerhaft"
    exit 1
  fi
else
  echo -e "${RED}❌${NC} $WORKFLOW_FILE nicht gefunden"
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. Workflow-Test (Dry Run)
# ═══════════════════════════════════════════════════════════════

echo "3️⃣  Workflow-Validierung (Dry Run)..."
echo "────────────────────────────────────────────────────────────"

if [ -f "n8n/test_workflow_v2.py" ]; then
  python3 n8n/test_workflow_v2.py | tail -n 20
else
  echo -e "${YELLOW}⚠️${NC}  Test-Skript nicht gefunden - übersprungen"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. n8n Status prüfen
# ═══════════════════════════════════════════════════════════════

echo "4️⃣  n8n Status..."
echo "────────────────────────────────────────────────────────────"

if command -v n8n &> /dev/null; then
  echo -e "${GREEN}✅${NC} n8n installiert"
  N8N_VERSION=$(n8n --version 2>/dev/null || echo "unknown")
  echo "   └─ Version: $N8N_VERSION"
  
  # Prüfe ob n8n läuft
  if curl -s http://localhost:5678 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} n8n läuft auf http://localhost:5678"
    echo ""
    echo -e "${GREEN}🎯 BEREIT FÜR IMPORT!${NC}"
    echo ""
    echo "   1. Öffne: http://localhost:5678"
    echo "   2. Klicke: + → Import from File"
    echo "   3. Wähle: $WORKFLOW_FILE"
    echo "   4. Klicke: Execute Workflow"
    echo ""
  else
    echo -e "${YELLOW}⚠️${NC}  n8n läuft nicht"
    echo ""
    echo "n8n starten:"
    echo "   npx n8n"
    echo ""
    echo "oder (wenn global installiert):"
    echo "   n8n start"
    echo ""
  fi
else
  echo -e "${YELLOW}⚠️${NC}  n8n nicht installiert"
  echo ""
  echo "n8n installieren:"
  echo "   npm install -g n8n"
  echo ""
  echo "oder ohne Installation:"
  echo "   npx n8n"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════"
echo "📊 Status-Übersicht"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Workflow: n8n_analyse_generator_workflow_v2.json"
echo "Nodes: 17"
echo "API: Perplexity (sonar-pro + sonar)"
echo "Kosten/Analyse: ~\$0.08-0.15"
echo ""
echo "Dokumentation:"
echo "  - 📖 WORKFLOW_V2_READY.md"
echo "  - 📖 WORKFLOW_V2_TEST_ANLEITUNG.md"
echo "  - 📖 WORKFLOW_OPTIMIERUNG.md"
echo ""
echo "════════════════════════════════════════════════════════════"
