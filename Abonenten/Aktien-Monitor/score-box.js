/**
 * capitovo Score-Box – Premium-Visualisierung mit durchgängigem Tacho
 * 
 * Zentrales Score-Modul mit:
 * - Kontinuierlicher Tacho-Visualisierung (keine Segmente)
 * - Fließendem Farbverlauf (Rot → Gelb → Grün)
 * - Detaillierten Teil-Score-Interpretationen
 * - Erklärenden Kontext-Texten
 * 
 * RECHTLICHER HINWEIS: Dieses System stellt keine Anlageberatung dar.
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // GUARDS & KONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

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
  // TACHO-VISUALISIERUNG (Gauge)
  // ═══════════════════════════════════════════════════════════════════

  function renderGauge(score) {
    if (typeof score !== 'number') score = 0;
    score = Math.max(0, Math.min(100, score));

    const centerX = 140;
    const centerY = 145;
    const radius = 90;
    const startAngle = -180; // links
    const endAngle = 0;      // rechts

    // Berechne Arc-Pfad für Hintergrund (voller Halbkreis)
    const bgPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
    document.getElementById('gauge-bg').setAttribute('d', bgPath);

    // Berechne Arc-Pfad für Progress (bis zum aktuellen Score)
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const progressPath = describeArc(centerX, centerY, radius, startAngle, scoreAngle);
    document.getElementById('gauge-progress').setAttribute('d', progressPath);

    // Zeiger (Nadel) positionieren
    const needleAngle = scoreAngle * (Math.PI / 180);
    const needleLength = 90;
    const needleX = centerX + needleLength * Math.cos(needleAngle);
    const needleY = centerY + needleLength * Math.sin(needleAngle);

    const needle = document.getElementById('gauge-needle');
    needle.innerHTML = `
      <line x1="${centerX}" y1="${centerY}" x2="${needleX}" y2="${needleY}" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${centerX}" cy="${centerY}" r="8" fill="#1f2937"/>
    `;

    // Score-Text im Zentrum
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
  // INTERPRETATION & KONTEXT-TEXTE
  // ═══════════════════════════════════════════════════════════════════

  function ratingTextFromScore(score) {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return 'Überdurchschnittliches Gesamtprofil';
    if (score >= 50) return 'Ausgewogenes Gesamtprofil';
    return 'Unterdurchschnittliches Gesamtprofil';
  }

  function contextTextFromScore(score, sectorPct) {
    if (typeof score !== 'number') return '—';

    if (score >= 70) {
      return 'Klarer struktureller Vorteil gegenüber dem Branchendurchschnitt';
    }
    if (score >= 50) {
      if (typeof sectorPct === 'number' && sectorPct >= 50) {
        return 'Solides Profil im oberen Bereich des Branchendurchschnitts';
      }
      return 'Profil bewegt sich im Bereich des Branchendurchschnitts';
    }

    // Score < 50
    return 'Kein struktureller Vorteil gegenüber dem Branchendurchschnitt erkennbar';
  }

  // ═══════════════════════════════════════════════════════════════════
  // AMPEL-ERKLÄRUNG
  // ═══════════════════════════════════════════════════════════════════

  function trafficExplainFull(light) {
    if (light === 'green') {
      return 'Grün bedeutet, dass der Gesamt-Score über dem Branchendurchschnitt liegt und die meisten Teilbereiche solide bis stark ausgeprägt sind.';
    }
    if (light === 'yellow') {
      return 'Gelb bedeutet, dass der Gesamt-Score im mittleren Bereich liegt. Einige Teilbereiche sind solide, andere weisen Verbesserungspotenzial auf.';
    }
    if (light === 'red') {
      return 'Rot bedeutet, dass der Gesamt-Score unter dem Branchendurchschnitt liegt und mehrere Teilbereiche schwächer ausgeprägt sind.';
    }
    return '—';
  }

  // ═══════════════════════════════════════════════════════════════════
  // BRANCHENVERGLEICH: Median-Kontext & Vergleichssatz
  // ═══════════════════════════════════════════════════════════════════

  function sectorContextText(sectorPct) {
    if (typeof sectorPct !== 'number') return '—';

    if (sectorPct >= 75) {
      return 'Der Score liegt deutlich über dem Median des Sektors.';
    }
    if (sectorPct >= 50) {
      return 'Der Score liegt über dem Median des Sektors.';
    }
    if (sectorPct >= 35) {
      return 'Der Score liegt unter dem Median des Sektors.';
    }
    return 'Der Score liegt deutlich unter dem Median des Sektors.';
  }

  function sectorComparisonText(sectorPct) {
    if (typeof sectorPct !== 'number') return '—';
    if (sectorPct >= 60) {
      return 'Das Unternehmen schneidet im Branchenvergleich besser ab als die Mehrheit der Wettbewerber.';
    }
    if (sectorPct >= 40) {
      return 'Das Profil liegt im mittleren Bereich der Branche.';
    }
    return 'Die Mehrheit der Wettbewerber weist aktuell stärkere Profile auf.';
  }

  function sectorPositionText(sectorPct) {
    if (typeof sectorPct !== 'number') return '—';
    if (sectorPct >= 80) return 'Position: Oberes Feld';
    if (sectorPct >= 60) return 'Position: Oberes Mittelfeld';
    if (sectorPct >= 40) return 'Position: Mittelfeld';
    if (sectorPct >= 20) return 'Position: Unteres Mittelfeld';
    return 'Position: Unteres Feld';
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEIL-SCORES: Relative Labels
  // ═══════════════════════════════════════════════════════════════════

  function toRelativeLabel(raw) {
    const v = (raw || '').toString().toLowerCase().trim();

    // Qualität / Wachstum / Stabilität
    if (['hervorragend', 'sehr hoch'].includes(v)) return 'Deutlich über Branchenniveau';
    if (['hoch'].includes(v)) return 'Über Branchenniveau';
    if (['solide', 'fair'].includes(v)) return 'Im Branchendurchschnitt';
    if (['moderat'].includes(v)) return 'Leicht unter Branchenniveau';
    if (['schwach'].includes(v)) return 'Unter Branchendurchschnitt';
    if (['sehr schwach'].includes(v)) return 'Deutlich unter Branchenniveau';

    // Bewertung (umgekehrte Logik)
    if (['sehr günstig'].includes(v)) return 'Deutlich unter Branchenniveau bewertet';
    if (['günstig'].includes(v)) return 'Unter Branchenniveau bewertet';
    if (['leicht erhöht'].includes(v)) return 'Leicht über Branchenniveau bewertet';
    if (['erhöht', 'anspruchsvoll'].includes(v)) return 'Über Branchenniveau bewertet';
    if (['sehr anspruchsvoll'].includes(v)) return 'Deutlich über Branchenniveau bewertet';

    return raw || '—';
  }

  // ═══════════════════════════════════════════════════════════════════
  // AMPEL-DOTS (visuell)
  // ═══════════════════════════════════════════════════════════════════

  function setDotActive(light) {
    const dotG = document.getElementById('capitovo-dot-green');
    const dotY = document.getElementById('capitovo-dot-yellow');
    const dotR = document.getElementById('capitovo-dot-red');
    if (!dotG || !dotY || !dotR) return;

    const baseInactive = 'w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300';
    dotG.className = baseInactive;
    dotY.className = baseInactive;
    dotR.className = baseInactive;

    if (light === 'green') dotG.className = 'w-4 h-4 rounded-full bg-green-500 border-2 border-green-600';
    if (light === 'yellow') dotY.className = 'w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-500';
    if (light === 'red') dotR.className = 'w-4 h-4 rounded-full bg-red-500 border-2 border-red-600';
  }

  // ═══════════════════════════════════════════════════════════════════
  // HAUPTLOGIK: fillScoreBox
  // ═══════════════════════════════════════════════════════════════════

  function fillScoreBox(payload) {
    if (!payload) return;

    const score = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;
    const light = payload.traffic_light;

    // ─────────────────────────────────────────────────────────────────
    // 1. TACHO rendern
    // ─────────────────────────────────────────────────────────────────
    renderGauge(score);

    // ─────────────────────────────────────────────────────────────────
    // 2. KOPFBEREICH (Interpretation)
    // ─────────────────────────────────────────────────────────────────
    const elRating = document.getElementById('capitovo-score-rating');
    const elContext = document.getElementById('capitovo-score-context');

    if (elRating) elRating.textContent = ratingTextFromScore(score);
    if (elContext) elContext.textContent = contextTextFromScore(score, sectorPct);

    // ─────────────────────────────────────────────────────────────────
    // 3. AMPEL (sekundär)
    // ─────────────────────────────────────────────────────────────────
    const elTrafficLabel = document.getElementById('capitovo-traffic-label');
    const elTrafficExplain = document.getElementById('capitovo-traffic-explain');

    if (elTrafficLabel) {
      if (light === 'green') elTrafficLabel.textContent = 'Ampel: Grün';
      else if (light === 'yellow') elTrafficLabel.textContent = 'Ampel: Gelb';
      else if (light === 'red') elTrafficLabel.textContent = 'Ampel: Rot';
      else elTrafficLabel.textContent = '—';
    }

    if (elTrafficExplain) elTrafficExplain.textContent = trafficExplainFull(light);
    setDotActive(light);

    // ─────────────────────────────────────────────────────────────────
    // 4. BRANCHENVERGLEICH (erweitert)
    // ─────────────────────────────────────────────────────────────────
    const elSectorLine = document.getElementById('capitovo-sector-line');
    const elSectorContext = document.getElementById('capitovo-sector-context');
    const elSectorComparison = document.getElementById('capitovo-sector-comparison');
    const elSectorPosition = document.getElementById('capitovo-sector-position');

    if (elSectorLine) {
      if (sectorPct === null) {
        elSectorLine.textContent = '—';
      } else {
        elSectorLine.textContent = `Besser als ${sectorPct} % der Unternehmen im Sektor`;
      }
    }

    if (elSectorContext) elSectorContext.textContent = sectorContextText(sectorPct);
    if (elSectorComparison) elSectorComparison.textContent = sectorComparisonText(sectorPct);
    if (elSectorPosition) elSectorPosition.textContent = sectorPositionText(sectorPct);

    // ─────────────────────────────────────────────────────────────────
    // 5. TEIL-SCORES (mit Interpretationen)
    // ─────────────────────────────────────────────────────────────────
    const subScores = [
      { key: 'quality', label: 'score_quality', text: 'interpretation_quality' },
      { key: 'growth', label: 'score_growth', text: 'interpretation_growth' },
      { key: 'stability', label: 'score_stability', text: 'interpretation_stability' },
      { key: 'valuation', label: 'score_valuation', text: 'interpretation_valuation' }
    ];

    subScores.forEach(sub => {
      const elLabel = document.getElementById(`capitovo-sub-${sub.key}`);
      const elText = document.getElementById(`capitovo-sub-${sub.key}-text`);

      if (elLabel) elLabel.textContent = toRelativeLabel(payload[sub.label]);
      if (elText) elText.textContent = (payload[sub.text] || '—');
    });

    // ─────────────────────────────────────────────────────────────────
    // 6. EINORDNUNG DES MODELLS (summary_text)
    // ─────────────────────────────────────────────────────────────────
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
