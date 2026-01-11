(function () {
  'use strict';

  function isStockMonitorPage() {
    try {
      return (location && location.pathname || '').toLowerCase().includes('/abonenten/aktien-monitor/');
    } catch (e) {
      return false;
    }
  }

  if (!isStockMonitorPage()) return;

  const SCORE_URL_CANDIDATES = [
    '../../data/scoring_public.json',
    '../data/scoring_public.json',
    '/capitovo/data/scoring_public.json'
  ];

  function normalizeSymbol(sym) {
    return (sym || '').toString().trim().toUpperCase();
  }

  function trafficLightLabel(light) {
    if (light === 'green') return 'Grün';
    if (light === 'yellow') return 'Gelb';
    if (light === 'red') return 'Rot';
    return '—';
  }

  function badgeClasses(light) {
    // Only Tailwind base colors + neutral border.
    if (light === 'green') return 'border-green-200 text-green-700 bg-green-50';
    if (light === 'yellow') return 'border-yellow-200 text-yellow-700 bg-yellow-50';
    if (light === 'red') return 'border-red-200 text-red-700 bg-red-50';
    return 'border-gray-200 text-gray-700 bg-gray-50';
  }

  async function fetchScores() {
    for (const url of SCORE_URL_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && typeof data === 'object') return data;
      } catch (e) {
        // ignore and try next
      }
    }
    return null;
  }

  function ensureTitleLayout(titleEl) {
    if (!titleEl) return;
    // Make sure badge sits next to the text without breaking existing styles.
    if (titleEl.classList && !titleEl.classList.contains('flex')) {
      titleEl.classList.add('flex', 'items-center', 'gap-3');
    }

    // Wrap existing text node(s) into a span once.
    if (!titleEl.querySelector('.capitovo-title-text')) {
      const span = document.createElement('span');
      span.className = 'capitovo-title-text';

      // Move only direct text nodes into the span.
      const nodes = Array.from(titleEl.childNodes);
      for (const n of nodes) {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim()) {
          span.appendChild(n);
        }
      }

      // If nothing moved (e.g. title already has elements), don't force.
      if (span.childNodes.length) {
        titleEl.insertBefore(span, titleEl.firstChild);
      }
    }
  }

  function upsertBadge(titleEl, payload) {
    if (!titleEl || !payload) return;

    const existing = titleEl.querySelector('.capitovo-score-badge');
    if (existing) return;

    const scoreTotal = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;
    const light = payload.traffic_light;

    const badge = document.createElement('span');
    badge.className = `capitovo-score-badge inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses(light)}`;

    const lightText = trafficLightLabel(light);

    // Only show the allowed, non-raw values.
    const parts = [];
    if (scoreTotal !== null) parts.push(`Score ${scoreTotal}`);
    if (sectorPct !== null) parts.push(`${sectorPct} Perzentil`);
    if (lightText !== '—') parts.push(lightText);

    badge.textContent = parts.join(' • ');
    badge.title = 'Modellbasierte Bewertung (keine Anlageberatung).';

    titleEl.appendChild(badge);
  }

  function extractTickerFromRow(rowEl) {
    if (!rowEl) return null;
    const ds = rowEl.dataset && (rowEl.dataset.ticker || rowEl.dataset.symbol);
    if (ds) return normalizeSymbol(ds);

    // Fallback: try to parse from .stock-meta "AAPL • ..."
    const meta = rowEl.querySelector && rowEl.querySelector('.stock-meta');
    if (meta && meta.textContent) {
      const m = meta.textContent.trim().match(/^([A-Z.]{1,10})\b/);
      if (m && m[1]) return normalizeSymbol(m[1]);
    }
    return null;
  }

  function applyBadgesToMonitorList(scoresBySymbol) {
    const listEl = document.getElementById('stock-list');
    if (!listEl) return;

    function applyOnce() {
      const rows = Array.from(listEl.querySelectorAll('a.stock-row'));
      for (const row of rows) {
        const ticker = extractTickerFromRow(row);
        if (!ticker) continue;

        const payload = scoresBySymbol[ticker];
        if (!payload) continue;

        const title = row.querySelector('.stock-name');
        if (!title) continue;

        ensureTitleLayout(title);
        upsertBadge(title, payload);
      }
    }

    applyOnce();

    const mo = new MutationObserver(function () {
      applyOnce();
    });

    mo.observe(listEl, { childList: true, subtree: true });
  }

  function applyBadgeToDetailTitle(scoresBySymbol) {
    const titleEl = document.querySelector('[data-ticker], [data-symbol]');
    if (!titleEl) return;

    const ticker = normalizeSymbol(titleEl.getAttribute('data-ticker') || titleEl.getAttribute('data-symbol'));
    if (!ticker) return;

    const payload = scoresBySymbol[ticker];
    if (!payload) return;

    ensureTitleLayout(titleEl);
    upsertBadge(titleEl, payload);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const scores = await fetchScores();
    if (!scores) return;

    applyBadgesToMonitorList(scores);
    applyBadgeToDetailTitle(scores);
  });
})();
