/**
 * capitovo Score-Box – Frontend-Rendering
 * 
 * Rendert den großen Score-Kasten auf den Aktien-Monitor Detailseiten.
 * Verwendet ausschließlich relative Begriffe (Branchenvergleich), keine absoluten Urteile.
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
  // KOPFBEREICH: Rating & Kontext
  // ═══════════════════════════════════════════════════════════════════

  function ratingTextFromScore(score) {
    if (typeof score !== 'number') return '—';
    if (score >= 70) return 'Attraktives Gesamtprofil';
    if (score >= 50) return 'Ausgewogenes Gesamtprofil';
    return 'Schwaches Gesamtprofil';
  }

  function contextTextFromScore(score, sectorPct) {
    if (typeof score !== 'number') return '—';

    if (score >= 70) {
      return 'Überdurchschnittlich im Branchenvergleich';
    }
    if (score >= 50) {
      if (typeof sectorPct === 'number' && sectorPct >= 50) {
        return 'Im oberen Bereich des Branchendurchschnitts';
      }
      return 'Im Bereich des Branchendurchschnitts';
    }

    // Score < 50
    if (typeof sectorPct === 'number' && sectorPct < 30) {
      return 'Mehrere Bereiche liegen deutlich unter dem Branchendurchschnitt';
    }
    return 'Unterdurchschnittlich im Branchenvergleich';
  }

  // ═══════════════════════════════════════════════════════════════════
  // AMPEL: Ausführliche Erklärung (nicht nur Farbe)
  // ═══════════════════════════════════════════════════════════════════

  function trafficExplainFull(light) {
    if (light === 'green') {
      return 'Grün bedeutet, dass der Gesamt-Score über dem Branchendurchschnitt liegt und die meisten Teilbereiche solide bis stark ausgeprägt sind.';
    }
    if (light === 'yellow') {
      return 'Gelb bedeutet, dass der Gesamt-Score im mittleren Bereich liegt. Einige Teilbereiche sind solide, andere weisen Verbesserungspotenzial auf.';
    }
    if (light === 'red') {
      return 'Rot bedeutet, dass der Gesamt-Score unter dem Branchendurchschnitt liegt und mehrere Teilbereiche schwach ausgeprägt sind.';
    }
    return '—';
  }

  // ═══════════════════════════════════════════════════════════════════
  // BRANCHENVERGLEICH: Median-Kontext & Position
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
    return 'Die Mehrheit der Wettbewerber schneidet aktuell besser ab.';
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
  // TEIL-SCORES: Nur relative Begriffe (KEINE absoluten Urteile!)
  // ═══════════════════════════════════════════════════════════════════

  function toRelativeLabel(raw) {
    const v = (raw || '').toString().toLowerCase().trim();

    // Qualität / Wachstum / Stabilität → Relative zur Branche
    if (['hervorragend', 'sehr hoch'].includes(v)) return 'Deutlich über Branchenniveau';
    if (['hoch'].includes(v)) return 'Über Branchenniveau';
    if (['solide', 'fair'].includes(v)) return 'Im Branchendurchschnitt';
    if (['moderat'].includes(v)) return 'Leicht unter Branchenniveau';
    if (['schwach'].includes(v)) return 'Unter Branchendurchschnitt';
    if (['sehr schwach'].includes(v)) return 'Deutlich unter Branchenniveau';

    // Bewertung (umgekehrte Logik: niedrig bewertet = potenziell attraktiv)
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
    // 1. KOPFBEREICH
    // ─────────────────────────────────────────────────────────────────
    const elScore = document.getElementById('capitovo-score-value');
    const elRating = document.getElementById('capitovo-score-rating');
    const elContext = document.getElementById('capitovo-score-context');

    if (elScore) elScore.textContent = (score === null ? '—' : String(score));
    if (elRating) elRating.textContent = ratingTextFromScore(score);
    if (elContext) elContext.textContent = contextTextFromScore(score, sectorPct);

    // ─────────────────────────────────────────────────────────────────
    // 2. AMPEL
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
    // 3. BRANCHENVERGLEICH
    // ─────────────────────────────────────────────────────────────────
    const elSectorLine = document.getElementById('capitovo-sector-line');
    const elSectorContext = document.getElementById('capitovo-sector-context');
    const elSectorPosition = document.getElementById('capitovo-sector-position');

    if (elSectorLine) {
      if (sectorPct === null) {
        elSectorLine.textContent = '—';
      } else {
        elSectorLine.textContent = `Besser als ${sectorPct} % der Unternehmen im Sektor`;
      }
    }

    if (elSectorContext) elSectorContext.textContent = sectorContextText(sectorPct);
    if (elSectorPosition) elSectorPosition.textContent = sectorPositionText(sectorPct);

    // ─────────────────────────────────────────────────────────────────
    // 4. TEIL-SCORES (relative Begriffe!)
    // ─────────────────────────────────────────────────────────────────
    const elQ = document.getElementById('capitovo-sub-quality');
    const elG = document.getElementById('capitovo-sub-growth');
    const elS = document.getElementById('capitovo-sub-stability');
    const elV = document.getElementById('capitovo-sub-valuation');

    if (elQ) elQ.textContent = toRelativeLabel(payload.score_quality);
    if (elG) elG.textContent = toRelativeLabel(payload.score_growth);
    if (elS) elS.textContent = toRelativeLabel(payload.score_stability);
    if (elV) elV.textContent = toRelativeLabel(payload.score_valuation);

    // ─────────────────────────────────────────────────────────────────
    // 5. EINORDNUNG DES MODELLS (summary_text)
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
