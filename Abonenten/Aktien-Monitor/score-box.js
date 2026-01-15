/**
 * capitovo-Score Box (Research-Snapshot Design, Refined)
 * 
 * Sprachliche & visuelle Verfeinerung:
 * - Klare Hauptaussage + Subline + Kontext (keine Widersprüche)
 * - Rot-Orange-Grün Farbverlauf in Balken (gedämpft)
 * - Branchenmedian als dezente graue Linie
 * - Kürzere Texte mit besserem Rhythmus
 */

(function() {
  'use strict';

  const SCORE_DATA_PATH = '../../data/scoring_public.json';
  const COMPANY_SYMBOL = 'AAPL'; // Hard-coded für Apple

  // =========================================
  // 1. HAUPTHEADLINE & EINORDNUNG
  // =========================================

  /**
   * Generiert die Hauptheadline basierend auf dem Gesamtscore
   */
  function getMainHeadline(scoreTotal) {
    if (scoreTotal >= 70) return "Überdurchschnittliche Wettbewerbsposition im Branchenvergleich";
    if (scoreTotal >= 50) return "Durchschnittliche Wettbewerbsposition im Branchenvergleich";
    return "Unterdurchschnittliche Wettbewerbsposition im Branchenvergleich";
  }

  /**
   * Generiert die Subline (erklärend)
   */
  function getSubline(scoreTotal, sector) {
    const sectorName = sector === 'Technology' ? 'Technologiesektors' : 
                       sector === 'Healthcare' ? 'Gesundheitssektors' : 
                       'Sektors';
    
    if (scoreTotal >= 50) {
      return `Der Score liegt über dem Median des ${sectorName}.`;
    }
    return `Der Score liegt unter dem Median des ${sectorName}.`;
  }

  /**
   * Generiert die Kontextzeile (einordnend, positiv-neutral)
   */
  function getContextLine(sectorPercentile, sector) {
    const sectorName = sector === 'Technology' ? 'Technology' :
                       sector === 'Healthcare' ? 'Healthcare' : 
                       sector;
    
    const percentage = Math.round(sectorPercentile);
    return `Besser positioniert als rund ${percentage} % der vergleichbaren Unternehmen im ${sectorName}.`;
  }

  // =========================================
  // 2. BALKEN: LABEL → BREITE & TEXT
  // =========================================

  /**
   * Konvertiert qualitative Labels in Balkenbreite (50% = Median)
   */
  function labelToBarWidth(raw) {
    const v = String(raw).toLowerCase();
    
    // Oberer Bereich (über Median)
    if (['hervorragend', 'sehr hoch'].includes(v)) return 85;
    if (['solide', 'hoch'].includes(v)) return 70;
    
    // Median-Bereich
    if (['fair', 'moderat', 'durchschnittlich'].includes(v)) return 50;
    
    // Unterer Bereich (unter Median)
    if (['schwach', 'niedrig'].includes(v)) return 30;
    if (['kritisch', 'sehr niedrig'].includes(v)) return 15;
    
    return 50; // Fallback
  }

  /**
   * Konvertiert qualitative Labels in klare Einordnung
   */
  function labelToText(raw) {
    const v = String(raw).toLowerCase();
    
    if (['hervorragend', 'sehr hoch', 'solide', 'hoch'].includes(v)) {
      return "Über Branchenniveau";
    }
    if (['fair', 'moderat', 'durchschnittlich'].includes(v)) {
      return "Im Branchendurchschnitt";
    }
    return "Unter Branchenniveau";
  }

  // =========================================
  // 3. TACHO-VISUALISIERUNG
  // =========================================

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const rad = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(rad)),
      y: centerY + (radius * Math.sin(rad))
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function renderGauge(score) {
    const centerX = 130;
    const centerY = 130;
    const radius = 100;
    const startAngle = 180;
    const endAngle = 0;

    // Hintergrund
    const bgPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
    document.getElementById('gauge-bg').setAttribute('d', bgPath);

    // Progress
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const progressPath = describeArc(centerX, centerY, radius, startAngle, scoreAngle);
    document.getElementById('gauge-progress').setAttribute('d', progressPath);

    // Marker Position
    const markerPos = polarToCartesian(centerX, centerY, radius, scoreAngle);
    document.getElementById('gauge-marker').setAttribute('cx', markerPos.x);
    document.getElementById('gauge-marker').setAttribute('cy', markerPos.y);

    // Score Text
    document.getElementById('gauge-score-text').textContent = score;
  }

  // =========================================
  // 4. EINORDNUNG DES MODELLS (KURZ & PRÄGNANT)
  // =========================================

  /**
   * Generiert eine kurze, flüssige Zusammenfassung (2-3 Sätze)
   */
  function generateModelSummary(data) {
    const { quality, growth, stability, valuation } = data.subscores_labels;
    const sector = data.sector === 'Technology' ? 'Technologiesektor' : 'Sektor';

    // Satz 1: Durchschnittliche Bereiche
    const avgAreas = [];
    if (['fair', 'moderat', 'durchschnittlich'].includes(quality.toLowerCase())) avgAreas.push('Profitabilität');
    if (['fair', 'moderat', 'durchschnittlich'].includes(stability.toLowerCase())) avgAreas.push('Stabilität');
    
    let sentence1 = '';
    if (avgAreas.length > 0) {
      sentence1 = `Die ${avgAreas.join(' und ')} ${avgAreas.length === 1 ? 'bewegt sich' : 'bewegen sich'} im Branchendurchschnitt.`;
    }

    // Satz 2: Schwache Bereiche
    const weakAreas = [];
    if (['schwach', 'niedrig', 'kritisch', 'sehr niedrig'].includes(growth.toLowerCase())) weakAreas.push('Wachstum');
    if (['schwach', 'niedrig', 'kritisch', 'sehr niedrig'].includes(valuation.toLowerCase())) weakAreas.push('Bewertung');
    
    let sentence2 = '';
    if (weakAreas.length > 0) {
      sentence2 = ` ${weakAreas.length === 1 ? 'Das' : 'Die'} ${weakAreas.join(' und das ')} ${weakAreas.length === 1 ? 'bleibt' : 'bleiben'} hinter vielen Wettbewerbern zurück.`;
    }

    // Satz 3: Gesamteinordnung
    const positionWord = data.score_total >= 50 ? 'durchschnittliche' : 'unterdurchschnittliche';
    const sentence3 = ` Insgesamt ergibt sich eine ${positionWord} Position im ${sector}.`;

    return (sentence1 + sentence2 + sentence3).trim();
  }

  // =========================================
  // 5. HAUPTFUNKTION: ALLES BEFÜLLEN
  // =========================================

  function fillScoreBox(data) {
    if (!data) {
      console.error('[capitovo-Score] Keine Daten gefunden');
      return;
    }

    // 1. Tacho
    renderGauge(data.score_total);

    // 2. Hauptheadline, Subline, Kontextzeile
    document.getElementById('capitovo-main-headline').textContent = getMainHeadline(data.score_total);
    document.getElementById('capitovo-subline').textContent = getSubline(data.score_total, data.sector);
    document.getElementById('capitovo-context-line').textContent = getContextLine(data.sector_percentile, data.sector);

    // 3. Balken (mit Animation)
    const bars = [
      { id: 'quality', label: data.subscores_labels.quality },
      { id: 'growth', label: data.subscores_labels.growth },
      { id: 'stability', label: data.subscores_labels.stability },
      { id: 'valuation', label: data.subscores_labels.valuation }
    ];

    bars.forEach(bar => {
      const width = labelToBarWidth(bar.label);
      const text = labelToText(bar.label);
      
      const barEl = document.getElementById(`capitovo-bar-${bar.id}`);
      const labelEl = document.getElementById(`capitovo-sub-${bar.id}-label`);
      
      if (barEl) {
        setTimeout(() => {
          barEl.style.width = width + '%';
        }, 100);
      }
      
      if (labelEl) {
        labelEl.textContent = text;
      }
    });

    // 4. Einordnung des Modells
    const modelSummary = generateModelSummary(data);
    document.getElementById('capitovo-model-summary').textContent = modelSummary;
  }

  // =========================================
  // 6. DATEN LADEN & INITIALISIERUNG
  // =========================================

  function loadScoreData() {
    fetch(SCORE_DATA_PATH)
      .then(response => {
        if (!response.ok) throw new Error('Scoring-Daten nicht verfügbar');
        return response.json();
      })
      .then(allScores => {
        const scoreData = allScores.find(s => s.symbol === COMPANY_SYMBOL);
        if (!scoreData) {
          console.warn(`[capitovo-Score] Keine Daten für ${COMPANY_SYMBOL}`);
          return;
        }
        fillScoreBox(scoreData);
      })
      .catch(error => {
        console.error('[capitovo-Score] Fehler beim Laden:', error);
      });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadScoreData);
  } else {
    loadScoreData();
  }

})();
