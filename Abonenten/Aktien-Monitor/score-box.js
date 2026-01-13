/**
 * capitovo Score-Box – Radikale Vereinfachung
 * 
 * Design-Prinzipien:
 * - Monochromer Tacho (Grau + Petrol-Akzent)
 * - Maximale Klarheit in 3 Sekunden
 * - Eine zentrale Aussage
 * - Minimale visuelle Komplexität
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
  // TACHO (MONOCHROM)
  // ═══════════════════════════════════════════════════════════════════

  function renderGauge(score) {
    if (typeof score !== 'number') score = 0;
    score = Math.max(0, Math.min(100, score));

    const centerX = 120;
    const centerY = 125;
    const radius = 80;
    const startAngle = -180;
    const endAngle = 0;

    // Hintergrund-Arc (grau)
    const bgPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
    document.getElementById('gauge-bg').setAttribute('d', bgPath);

    // Progress-Arc (Petrol-Akzent)
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const progressPath = describeArc(centerX, centerY, radius, startAngle, scoreAngle);
    document.getElementById('gauge-progress').setAttribute('d', progressPath);

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
  // TEXTE (RADIKAL REDUZIERT)
  // ═══════════════════════════════════════════════════════════════════

  function getCoreMessage(score) {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return 'Überdurchschnittliche Wettbewerbsposition';
    if (score >= 50) return 'Durchschnittliche Wettbewerbsposition';
    return 'Unterdurchschnittliche Wettbewerbsposition';
  }

  function getSectorContext(sectorPct) {
    if (typeof sectorPct !== 'number') return '—';
    if (sectorPct >= 50) return 'Über dem Branchendurchschnitt';
    return 'Unter dem Branchendurchschnitt';
  }

  function toCompactLabel(raw) {
    const v = (raw || '').toString().toLowerCase().trim();
    
    // Qualität / Wachstum / Stabilität
    if (['hervorragend', 'sehr hoch', 'hoch'].includes(v)) return '↑';
    if (['solide', 'fair'].includes(v)) return 'Ø';
    if (['moderat', 'schwach', 'sehr schwach'].includes(v)) return '↓';
    
    // Bewertung (umgekehrt)
    if (['sehr günstig', 'günstig'].includes(v)) return '↓';
    if (['fair'].includes(v)) return 'Ø';
    if (['leicht erhöht', 'erhöht', 'anspruchsvoll', 'sehr anspruchsvoll'].includes(v)) return '↑';
    
    return '—';
  }

  // ═══════════════════════════════════════════════════════════════════
  // HAUPTLOGIK
  // ═══════════════════════════════════════════════════════════════════

  function fillScoreBox(payload) {
    if (!payload) return;

    const score = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;

    // Tacho rendern
    renderGauge(score);

    // Eine zentrale Aussage
    const elRating = document.getElementById('capitovo-score-rating');
    if (elRating) elRating.textContent = getCoreMessage(score);

    // Branchenvergleich (2 Zeilen)
    const elSectorLine = document.getElementById('capitovo-sector-line');
    const elSectorContext = document.getElementById('capitovo-sector-context');

    if (elSectorLine) {
      if (sectorPct === null) {
        elSectorLine.textContent = '—';
      } else {
        elSectorLine.textContent = `Besser als ${sectorPct} % der Unternehmen im Sektor`;
      }
    }

    if (elSectorContext) elSectorContext.textContent = getSectorContext(sectorPct);

    // Teilbereiche (kompakte Symbole)
    const elQ = document.getElementById('capitovo-sub-quality');
    const elG = document.getElementById('capitovo-sub-growth');
    const elS = document.getElementById('capitovo-sub-stability');
    const elV = document.getElementById('capitovo-sub-valuation');

    if (elQ) elQ.textContent = toCompactLabel(payload.score_quality);
    if (elG) elG.textContent = toCompactLabel(payload.score_growth);
    if (elS) elS.textContent = toCompactLabel(payload.score_stability);
    if (elV) elV.textContent = toCompactLabel(payload.score_valuation);

    // Erläuterung (eingeklappt)
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
