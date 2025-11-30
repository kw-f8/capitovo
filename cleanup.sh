#!/bin/bash
# Cleanup Script für capitovo Projekt
# Entfernt alle unnötigen Dateien (außer n8n-Workflows)

echo "🧹 Starte Projekt-Bereinigung..."
echo ""

# Backup Ordner entfernen
if [ -d "Backup" ]; then
    echo "✅ Entferne Backup/ (indexhtml.txt, sciptjs.txt, stylecss.txt)"
    rm -rf Backup
fi

# Preview Logos HTML entfernen
if [ -f "preview_logos.html" ]; then
    echo "✅ Entferne preview_logos.html"
    rm preview_logos.html
fi

# Tools Ordner entfernen (13 Python-Skripte)
if [ -d "tools" ]; then
    echo "✅ Entferne tools/ (analyze_map.py, generate_*.py, update_*.py, etc.)"
    rm -rf tools
fi

# World Map Paths JSON entfernen
if [ -f "data/world_map_paths.json" ]; then
    echo "✅ Entferne data/world_map_paths.json"
    rm data/world_map_paths.json
fi

echo ""
echo "✨ Bereinigung abgeschlossen!"
echo ""
echo "📁 Verbleibende Projektstruktur:"
echo "================================"
ls -la
echo ""
echo "📁 data/:"
ls -la data/
echo ""
echo "📁 n8n/ (alle Workflows erhalten):"
ls -la n8n/
