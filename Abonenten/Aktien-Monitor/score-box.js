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

  const COLOR_RED = '#DC2626';
  const COLOR_ORANGE = '#F59E0B';
  const COLOR_GREEN = '#16A34A';

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function clampScore(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  function hexToRgb(hex) {
    const h = (hex || '').toString().replace('#', '').trim();
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const to = (v) => {
      const n = Math.max(0, Math.min(255, Math.round(v)));
      return n.toString(16).padStart(2, '0');
    };
    return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
  }

  // sRGB <-> Linear
  function srgbToLinear(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function linearToSrgb(v) {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, c * 255));
  }

  // RGB -> XYZ (D65)
  function rgbToXyz(rgb) {
    const r = srgbToLinear(rgb.r);
    const g = srgbToLinear(rgb.g);
    const b = srgbToLinear(rgb.b);
    return {
      x: (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
      y: (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
      z: (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100
    };
  }

  function xyzToRgb(xyz) {
    const x = xyz.x / 100;
    const y = xyz.y / 100;
    const z = xyz.z / 100;

    const rLin = (x * 3.2404542 + y * -1.5371385 + z * -0.4985314);
    const gLin = (x * -0.9692660 + y * 1.8760108 + z * 0.0415560);
    const bLin = (x * 0.0556434 + y * -0.2040259 + z * 1.0572252);

    return {
      r: linearToSrgb(rLin),
      g: linearToSrgb(gLin),
      b: linearToSrgb(bLin)
    };
  }

  // XYZ <-> Lab (D65)
  const REF_X = 95.047;
  const REF_Y = 100.0;
  const REF_Z = 108.883;

  function fLab(t) {
    return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  }

  function fInvLab(t) {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  }

  function xyzToLab(xyz) {
    const x = fLab(xyz.x / REF_X);
    const y = fLab(xyz.y / REF_Y);
    const z = fLab(xyz.z / REF_Z);
    return {
      l: (116 * y) - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  function labToXyz(lab) {
    const y = (lab.l + 16) / 116;
    const x = lab.a / 500 + y;
    const z = y - lab.b / 200;
    return {
      x: REF_X * fInvLab(x),
      y: REF_Y * fInvLab(y),
      z: REF_Z * fInvLab(z)
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mixLab(hexA, hexB, t) {
    const a = xyzToLab(rgbToXyz(hexToRgb(hexA)));
    const b = xyzToLab(rgbToXyz(hexToRgb(hexB)));
    const lab = {
      l: lerp(a.l, b.l, t),
      a: lerp(a.a, b.a, t),
      b: lerp(a.b, b.b, t)
    };
    const rgb = xyzToRgb(labToXyz(lab));
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // leichte Entsättigung (ca. 85–90%) gegen Neon-/Trading-Look
  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case rn:
          h = ((gn - bn) / d) % 6;
          break;
        case gn:
          h = (bn - rn) / d + 2;
          break;
        default:
          h = (rn - gn) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = (h % 360) / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;

    if (hh >= 0 && hh < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (hh < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hh < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hh < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hh < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    const m = l - c / 2;
    return {
      r: (r1 + m) * 255,
      g: (g1 + m) * 255,
      b: (b1 + m) * 255
    };
  }

  function desaturateHex(hex, factor) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const s = clamp01(hsl.s * factor);
    const out = hslToRgb(hsl.h, s, hsl.l);
    return rgbToHex(out.r, out.g, out.b);
  }

  // Kontinuierliche Farblogik (0–100) nach Vorgabe:
  // 0–30: Rot, 30–70: Rot->Orange->Gelb (Gelb entsteht als Zwischenfarbe Richtung Grün), 70–100: Gelb->Grün
  function getScoreColor(score) {
    const s = clampScore(score);

    // Gelb-Anker entsteht aus Orange->Grün (kein zusätzlicher Basisfarbwert)
    const yellowish = mixLab(COLOR_ORANGE, COLOR_GREEN, 0.35);

    let hex;
    if (s <= 30) {
      hex = COLOR_RED;
    } else if (s <= 70) {
      const u = (s - 30) / 40; // 0..1
      if (u <= 0.5) {
        hex = mixLab(COLOR_RED, COLOR_ORANGE, u / 0.5);
      } else {
        hex = mixLab(COLOR_ORANGE, yellowish, (u - 0.5) / 0.5);
      }
    } else {
      const u = (s - 70) / 30; // 0..1
      hex = mixLab(yellowish, COLOR_GREEN, u);
    }

    // leichte Entsättigung für „ruhig, hochwertig“
    return desaturateHex(hex, 0.88);
  }

  function mixWithWhite(hex, amount) {
    const a = clamp01(amount);
    const rgb = hexToRgb(hex);
    return rgbToHex(
      lerp(rgb.r, 255, a),
      lerp(rgb.g, 255, a),
      lerp(rgb.b, 255, a)
    );
  }

  function getScoreFillGradient(score) {
    const end = getScoreColor(score);
    const start = mixWithWhite(end, 0.55);
    return `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
  }

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
  // TACHO (FARBE AUS SCORE – gleiche Logik wie Balken)
  // ═══════════════════════════════════════════════════════════════════

  function renderGauge(score) {
    score = clampScore(score);

    const centerX = 130;
    const centerY = 130;
    const radius = 90;
    const startAngle = -180;
    const endAngle = 0;

    // Hintergrund-Arc
    const bgPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
    document.getElementById('gauge-bg').setAttribute('d', bgPath);

    // Progress-Arc
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const progressPath = describeArc(centerX, centerY, radius, startAngle, scoreAngle);
    const progressEl = document.getElementById('gauge-progress');
    if (progressEl) {
      progressEl.setAttribute('d', progressPath);
    }

    // Farbe wie Balken: Gradient (hell -> Endfarbe) anhand Score
    const endColor = getScoreColor(score);
    const startColor = mixWithWhite(endColor, 0.55);
    const stopStart = document.getElementById('gauge-grad-start');
    const stopEnd = document.getElementById('gauge-grad-end');
    if (stopStart) stopStart.setAttribute('stop-color', startColor);
    if (stopEnd) stopEnd.setAttribute('stop-color', endColor);
    if (progressEl && (!stopStart || !stopEnd)) {
      progressEl.setAttribute('stroke', endColor);
    }

    // Marker Position
    const markerPos = polarToCartesian(centerX, centerY, radius, scoreAngle);
    const marker = document.getElementById('gauge-marker');
    if (marker) {
      marker.setAttribute('cx', markerPos.x);
      marker.setAttribute('cy', markerPos.y);
      marker.setAttribute('fill', endColor);
    }

    // Score-Text
    const scoreText = document.getElementById('gauge-score-text');
    if (scoreText) scoreText.textContent = String(score);
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
  // TEXTLICHE EINORDNUNG (EINE KLARE AUSSAGE)
  // ═══════════════════════════════════════════════════════════════════

  function getCoreMessage(score, sectorPct, sector) {
    if (typeof score !== 'number') return '—';
    const sectorName = sector || 'vergleichbarer Technologieunternehmen';
    const pct = typeof sectorPct === 'number' ? sectorPct : 50;
    
    // Eine einzige, widerspruchsfreie Aussage
    if (score >= 70) {
      return `Überdurchschnittlich positioniert – der Score liegt über dem Median ${sectorName}.`;
    }
    if (score >= 50) {
      return `Im Branchendurchschnitt positioniert – der Score entspricht dem Median ${sectorName}.`;
    }
    if (pct >= 30) {
      return `Leicht unter dem Branchendurchschnitt – der Score liegt unter dem Median ${sectorName}.`;
    }
    return `Unter dem Branchendurchschnitt – der Score liegt deutlich unter dem Median ${sectorName}.`;
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

  function getBarScoreForColor(rawValue, isValuation) {
    const widthScore = labelToBarWidth(rawValue);
    return isValuation ? (100 - widthScore) : widthScore;
  }

  // ═══════════════════════════════════════════════════════════════════
  // HAUPTLOGIK
  // ═══════════════════════════════════════════════════════════════════

  function fillScoreBox(payload) {
    if (!payload) return;

    const score = typeof payload.score_total === 'number' ? payload.score_total : null;
    const sectorPct = typeof payload.sector_percentile === 'number' ? payload.sector_percentile : null;
    const sector = payload.sector || 'vergleichbarer Technologieunternehmen';

    // 1. Gauge rendern (einfarbig)
    renderGauge(score);

    // 2. Entfernt: Einordnungssatz unter dem Gauge
    const elRating = document.getElementById('capitovo-score-rating');
    if (elRating) elRating.textContent = '';

    // 3. Teilbereiche (Balken + Label)
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
        const width = labelToBarWidth(rawValue);
        const scoreForColor = getBarScoreForColor(rawValue, area.isValuation);
        bar.style.width = `${width}%`;
        bar.style.backgroundImage = getScoreFillGradient(scoreForColor);
      }
      if (label) {
        label.textContent = labelToText(rawValue, area.isValuation);
      }
    });

    // 4. Einordnung des Modells
    const elSummary = document.getElementById('capitovo-model-summary');
    if (elSummary) elSummary.textContent = (payload.summary_text || '—');
  }

  // ═══════════════════════════════════════════════════════════════════
  // INITIALISIERUNG
  // ═══════════════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', async function () {
    const box = document.getElementById('capitovo-score');
    if (!box) return;

    // Info-Popover (optional)
    (function initInfoPopover() {
      const btn = document.getElementById('capitovo-score-info-btn');
      const pop = document.getElementById('capitovo-score-info-popover');
      const closeBtn = document.getElementById('capitovo-score-info-close');
      const section = document.getElementById('capitovo-score');
      if (!btn || !pop) return;

      function setOpen(open) {
        if (open) {
          pop.classList.remove('hidden');
          btn.setAttribute('aria-expanded', 'true');
          if (section) section.classList.add('capitovo-score--blurred');
        } else {
          pop.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
          if (section) section.classList.remove('capitovo-score--blurred');
        }
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(pop.classList.contains('hidden'));
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        });
      }

      document.addEventListener('click', function (e) {
        if (pop.classList.contains('hidden')) return;
        const target = e.target;
        if (btn.contains(target) || pop.contains(target)) return;
        setOpen(false);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
      });
    })();

    const title = document.querySelector('[data-ticker]');
    const ticker = normalizeSymbol(title && title.getAttribute('data-ticker'));
    if (!ticker) return;

    const scores = await fetchScores();
    if (!scores || !scores[ticker]) return;

    fillScoreBox(scores[ticker]);
  });
})();
