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

  function ratingTextFromScore(score) {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return 'Attraktives Gesamtprofil';
    if (score >= 50) return 'Ausgewogenes Gesamtprofil';
    return 'Schwaches Gesamtprofil';
  }

  function trafficExplain(score, sectorPct) {
    if (typeof score !== 'number') return '—';

    // Neutral, beschreibend; keine Imperative.
    if (score >= 70) {
      return 'Das Gesamtprofil wirkt im Branchenvergleich überdurchschnittlich ausgeprägt.';
    }
    if (score >= 50) {
      return 'Das Gesamtprofil wirkt im Branchenvergleich insgesamt ausgewogen.';
    }

    // Bei Rot etwas konkreter, aber neutral.
    if (typeof sectorPct === 'number' && sectorPct < 50) {
      return 'Das aktuelle Gesamtprofil liegt unter dem Branchendurchschnitt und zeigt mehrere Schwachpunkte.';
    }
    return 'Das aktuelle Gesamtprofil wirkt unterdurchschnittlich ausgeprägt.';
  }

  function sectorPositionText(sectorPct) {
    if (typeof sectorPct !== 'number') return '—';
    if (sectorPct >= 75) return 'Oberes Feld';
    if (sectorPct >= 55) return 'Oberes Mittelfeld';
    if (sectorPct >= 45) return 'Mittelfeld';
    if (sectorPct >= 25) return 'Unteres Mittelfeld';
    return 'Unteres Feld';
  }

  function toDisplaySubLabel(raw) {
    const v = (raw || '').toString().toLowerCase().trim();

    // Map existing labels to a tighter, more verständliche Skala.
    if (['hervorragend', 'sehr hoch', 'hoch'].includes(v)) return 'Stark';
    if (['solide', 'fair'].includes(v)) return 'Solide';
    if (['moderat'].includes(v)) return 'Durchschnittlich';
    if (['schwach', 'sehr schwach'].includes(v)) return 'Schwach';

    // Bewertung: teilweise „anspruchsvoll“ etc.
    if (['sehr günstig', 'günstig'].includes(v)) return 'Günstig';
    if (['leicht erhöht'].includes(v)) return 'Leicht erhöht';
    if (['erhöht', 'anspruchsvoll', 'sehr anspruchsvoll'].includes(v)) return 'Anspruchsvoll';

    return raw || '—';
  }

  function setDotActive(light) {
    const dotG = document.getElementById('capitovo-dot-green');
    const dotY = document.getElementById('capitovo-dot-yellow');
    const dotR = document.getElementById('capitovo-dot-red');
    if (!dotG || !dotY || !dotR) return;

    // reset
    dotG.className = 'w-3 h-3 rounded-full bg-gray-200';
    dotY.className = 'w-3 h-3 rounded-full bg-gray-200';
    dotR.className = 'w-3 h-3 rounded-full bg-gray-200';

    if (light === 'green') dotG.className = 'w-3 h-3 rounded-full bg-green-500';
    if (light === 'yellow') dotY.className = 'w-3 h-3 rounded-full bg-yellow-400';
    if (light === 'red') dotR.className = 'w-3 h-3 rounded-full bg-red-500';
  }

  function fillScoreBox(payload) {
    if (!payload) return;

    const score = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;
    const light = payload.traffic_light;

    const elScore = document.getElementById('capitovo-score-value');
    const elRating = document.getElementById('capitovo-score-rating');
    const elTrafficLabel = document.getElementById('capitovo-traffic-label');
    const elTrafficExplain = document.getElementById('capitovo-traffic-explain');

    const elSectorLine = document.getElementById('capitovo-sector-line');
    const elSectorText = document.getElementById('capitovo-sector-text');

    const elQ = document.getElementById('capitovo-sub-quality');
    const elG = document.getElementById('capitovo-sub-growth');
    const elS = document.getElementById('capitovo-sub-stability');
    const elV = document.getElementById('capitovo-sub-valuation');

    const elSummary = document.getElementById('capitovo-model-summary');

    if (elScore) elScore.textContent = (score === null ? '— / 100' : `${score} / 100`);
    if (elRating) elRating.textContent = ratingTextFromScore(score);

    if (elTrafficLabel) {
      if (light === 'green') elTrafficLabel.textContent = 'Grün';
      else if (light === 'yellow') elTrafficLabel.textContent = 'Gelb';
      else if (light === 'red') elTrafficLabel.textContent = 'Rot';
      else elTrafficLabel.textContent = '—';
    }

    if (elTrafficExplain) elTrafficExplain.textContent = trafficExplain(score, sectorPct);
    setDotActive(light);

    if (elSectorLine) {
      if (sectorPct === null) {
        elSectorLine.textContent = '—';
      } else {
        elSectorLine.textContent = `Besser als ${sectorPct} % der Unternehmen im Sektor`;
      }
    }

    if (elSectorText) elSectorText.textContent = `Position: ${sectorPositionText(sectorPct)}`;

    if (elQ) elQ.textContent = toDisplaySubLabel(payload.score_quality);
    if (elG) elG.textContent = toDisplaySubLabel(payload.score_growth);
    if (elS) elS.textContent = toDisplaySubLabel(payload.score_stability);
    if (elV) elV.textContent = toDisplaySubLabel(payload.score_valuation);

    if (elSummary) elSummary.textContent = (payload.summary_text || '—');
  }

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
