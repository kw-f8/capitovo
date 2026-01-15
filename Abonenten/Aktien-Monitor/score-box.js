/**
 * capitovo Score-Box – Research-Snapshot Design
 * 
 * Design-Prinzipien:
 * - Blau-Verlauf-Tacho (hell → dunkel)
 * - Balken-Visualisierung mit Branchenmedian
 * - Klare Informationshierarchie
 * - Keine Ampel-Farben, keine Signale
 * 
 * RECHTLICH: Keine Anlageberatung
 */
(function () {
  'use strict';

  function isStockDetailPage() {
    try {
      const p = (location && location.pathname ? location.pathname.toLowerCase() : '');
      return p.includes('/abonenten/aktien-monitor/') && p.includes('aktien-monitor_');
    } catch (e) {
      return false;
    }
  }

  if (!isStockDetailPage()) return;

  const SCORE_URL_CANDIDATES = [
    '../../data/scoring_public.json',
    '../data/scoring_public.json',
    '/capitovo/data/scoring_public.json'
  ];

  function normalizeSymbol(sym) {
    return (sym || '').toString().trim().toUpperCase();
  }

  async function fetchScores() {
    for (const url of SCORE_URL_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && typeof data === 'object') return data;
      } catch (e) {
        // try next
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TACHO (BLAU-VERLAUF)
  // ═══════════════════════════════════════════════════════════════════

  function renderGauge(score) {
    if (typeof score !== 'number') score = 0;
    score = Math.max(0, Math.min(100, score));

    const centerX = 130;
    const centerY = 130;
    const radius = 90;
    const startAngle = -180;
    const endAngle = 0;

    // Hintergrund-Arc
    const bgPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
    document.getElementById('gauge-bg').setAttribute('d', bgPath);

    // Progress-Arc (Blau-Verlauf über CSS)
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const progressPath = describeArc(centerX, centerY, radius, startAngle, scoreAngle);
    document.getElementById('gauge-progress').setAttribute('d', progressPath);

    // Marker Position
    const markerPos = polarToCartesian(centerX, centerY, radius, scoreAngle);
    const marker = document.getElementById('gauge-marker');
    if (marker) {
      marker.setAttribute('cx', markerPos.x);
      marker.setAttribute('cy', markerPos.y);
    }

    // Score-Text
    document.getElementById('gauge-score-text').textContent = String(score);
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEXTLICHE EINORDNUNG (OHNE WERTUNG)
  // ═══════════════════════════════════════════════════════════════════

  function getCoreMessage(score) {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return 'Überdurchschnittliche Wettbewerbsposition';
    if (score >= 50) return 'Durchschnittliche Wettbewerbsposition';
    return 'Unterdurchschnittliche Wettbewerbsposition';
  }

  function getContextSentence(score, sectorPct) {
    if (typeof score !== 'number') return '—';
    
    if (score >= 70) {
      return 'Das Unternehmen zeigt strukturelle Vorteile gegenüber dem Branchenmedian.';
    }
    if (score >= 50) {
      return 'Das strukturelle Profil bewegt sich im Bereich des Branchendurchschnitts.';
    }
    return 'Das strukturelle Profil liegt unter dem Branchendurchschnitt.';
  }

  function getSectorLine(sectorPct, sector) {
    if (typeof sectorPct !== 'number') return '—';
    const sectorName = sector || 'Sektor';
    return `Besser als ${sectorPct} % der Unternehmen im ${sectorName}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // BALKEN-VISUALISIERUNG (vs. Branchenmedian)
  // ═══════════════════════════════════════════════════════════════════

  function labelToBarWidth(raw) {
    const v = (raw || '').toString().toLowerCase().trim();
    
    // Qualität / Wachstum / Stabilität (50% = Median)
    if (['hervorragend', 'sehr hoch'].includes(v)) return 85;
    if (['hoch'].includes(v)) return 70;
    if (['solide', 'fair'].includes(v)) return 50;
    if (['moderat'].includes(v)) return 35;
    if (['schwach'].includes(v)) return 25;
    if (['sehr schwach'].includes(v)) return 15;
    
    // Bewertung (umgekehrt: günstig = niedrige Bewertung = positiv)
    if (['sehr günstig'].includes(v)) return 25;
    if (['günstig'].includes(v)) return 35;
    if (['leicht erhöht'].includes(v)) return 60;
    if (['erhöht', 'anspruchsvoll'].includes(v)) return 75;
    if (['sehr anspruchsvoll'].includes(v)) return 90;
    
    return 50;
  }

  function labelToText(raw, isValuation = false) {
    const v = (raw || '').toString().toLowerCase().trim();
    
    if (isValuation) {
      // Bewertung: Beschreibung ohne Wertung
      if (['sehr günstig', 'günstig'].includes(v)) return 'Unter Branchenniveau';
      if (['fair'].includes(v)) return 'Im Branchendurchschnitt';
      if (['leicht erhöht'].includes(v)) return 'Leicht über Branchenniveau';
      if (['erhöht', 'anspruchsvoll', 'sehr anspruchsvoll'].includes(v)) return 'Über Branchenniveau';
    } else {
      // Qualität / Wachstum / Stabilität
      if (['hervorragend', 'sehr hoch'].includes(v)) return 'Deutlich über Branchenniveau';
      if (['hoch'].includes(v)) return 'Über Branchenniveau';
      if (['solide', 'fair'].includes(v)) return 'Im Branchendurchschnitt';
      if (['moderat'].includes(v)) return 'Leicht unter Branchenniveau';
      if (['schwach', 'sehr schwach'].includes(v)) return 'Unter Branchenniveau';
    }
    
    return '—';
  }

  // ═══════════════════════════════════════════════════════════════════
  // HAUPTLOGIK
  // ═══════════════════════════════════════════════════════════════════

  function fillScoreBox(payload) {
    if (!payload) return;

    const score = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;
    const sector = payload.sector || 'Sektor';

    // 1. Tacho rendern
    renderGauge(score);

    // 2. Verbale Einordnung
    const elRating = document.getElementById('capitovo-score-rating');
    const elContext = document.getElementById('capitovo-score-context');
    
    if (elRating) elRating.textContent = getCoreMessage(score);
    if (elContext) elContext.textContent = getContextSentence(score, sectorPct);

    // 3. Branchenvergleich (ein Satz)
    const elSectorLine = document.getElementById('capitovo-sector-line');
    if (elSectorLine) elSectorLine.textContent = getSectorLine(sectorPct, sector);

    // 4. Teilbereiche (Balken + Label)
    const areas = [
      { key: 'quality', field: 'score_quality', isValuation: false },
      { key: 'growth', field: 'score_growth', isValuation: false },
      { key: 'stability', field: 'score_stability', isValuation: false },
      { key: 'valuation', field: 'score_valuation', isValuation: true }
    ];

    areas.forEach(area => {
      const bar = document.getElementById(`capitovo-bar-${area.key}`);
      const label = document.getElementById(`capitovo-sub-${area.key}-label`);
      const rawValue = payload[area.field];
      
      if (bar) {
        bar.style.width = `${labelToBarWidth(rawValue)}%`;
      }
      if (label) {
        label.textContent = labelToText(rawValue, area.isValuation);
      }
    });

    // 5. Einordnung des Modells
    const elSummary = document.getElementById('capitovo-model-summary');
    if (elSummary) elSummary.textContent = (payload.summary_text || '—');
  }

  // ═══════════════════════════════════════════════════════════════════
  // INITIALISIERUNG
  // ═══════════════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', async function () {
    const box = document.getElementById('capitovo-score');
    if (!box) return;

    const title = document.querySelector('[data-ticker]');
    const ticker = normalizeSymbol(title && title.getAttribute('data-ticker'));
    if (!ticker) return;

    const scores = await fetchScores();
    if (!scores || !scores[ticker]) return;

    fillScoreBox(scores[ticker]);
  });
})();
