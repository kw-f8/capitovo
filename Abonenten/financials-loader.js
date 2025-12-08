(function(){
  // External loader for financials — uses Alpha Vantage OVERVIEW and falls back to local JSON.
  var symbol = 'AAPL';
  var container = document.getElementById('financials-overview');
  if(!container) return;
  // Insert loading UI and styles
  function insertLoadingStyles(){
    if(document.getElementById('capitovo-fb-loading-style')) return;
    var s = document.createElement('style'); s.id = 'capitovo-fb-loading-style';
    s.textContent = '\n#fb-loading { display:flex; align-items:center; gap:10px; font-size:0.95rem; color:#374151; padding:8px 0; }\n#fb-loading .spinner { width:18px; height:18px; border-radius:50%; border:2px solid rgba(0,0,0,0.08); border-top-color:#2563eb; animation:capspin 1s linear infinite; }\n@keyframes capspin { to { transform:rotate(360deg); } }\n';
    document.head.appendChild(s);
  }
  function showLoading(msg){
    try{
      insertLoadingStyles();
      var ex = container.querySelector('#fb-loading');
      if(ex) ex.remove();
      var el = document.createElement('div'); el.id = 'fb-loading';
      var spin = document.createElement('div'); spin.className = 'spinner';
      var txt = document.createElement('div'); txt.className = 'fb-loading-text'; txt.textContent = msg || 'Daten werden geladen…';
      el.appendChild(spin); el.appendChild(txt);
      container.insertBefore(el, container.firstChild);
    }catch(e){}
  }
  function hideLoading(){ try{ var el = container.querySelector('#fb-loading'); if(el) el.remove(); }catch(e){} }
  var detectedCurrency = null;
  // show loading right away
  try{ showLoading(); }catch(e){}

  function currencySymbol(code){
    if(!code) return null;
    var c = String(code).toUpperCase();
    var map = { 'USD':'$', 'EUR':'€', 'GBP':'£', 'JPY':'¥', 'CHF':'CHF', 'CNY':'¥' };
    return map[c] || c;
  }

  function createBox(title, value, sub){
    var box = document.createElement('div');
    box.className = 'financial-box p-3 bg-white rounded';
    var t = document.createElement('div'); t.className='fb-title'; t.textContent = title;
    var v = document.createElement('div'); v.className='fb-value'; v.textContent = value;
    box.appendChild(t); box.appendChild(v);
    if(sub){ var s = document.createElement('div'); s.className='fb-sub'; s.textContent = sub; box.appendChild(s); }
    return box;
  }

  function writeStatus(msg, level){
    try{
      var el = document.createElement('div');
      el.className = 'fb-status';
      el.style.fontSize = '0.9rem';
      el.style.padding = '6px 0';
      el.style.color = (level==='error' ? '#b91c1c' : (level==='warn' ? '#92400e' : '#374151'));
      el.textContent = msg;
      container.insertBefore(el, container.firstChild);
    }catch(e){}
  }

  // Caching: cache Alpha Vantage overview in localStorage to avoid frequent requests.
  var CACHE_TTL_HOURS = (window.FINANCIALS_CACHE_TTL_HOURS && Number(window.FINANCIALS_CACHE_TTL_HOURS)) || 24; // default 24h to respect API limits
  function cacheKey(sym){ return 'capitovo_fin_overview_v1_' + String(sym).toUpperCase(); }
  function readCache(sym){
    try{
      var k = cacheKey(sym); var raw = localStorage.getItem(k); if(!raw) return null;
      var obj = JSON.parse(raw); if(!obj || !obj.ts || !obj.data) return null;
      var ageMs = Date.now() - Number(obj.ts || 0);
      var ageH = ageMs/36e5;
      return { ageHours: ageH, data: obj.data };
    }catch(e){ return null; }
  }
  function writeCache(sym, data){
    try{ var k = cacheKey(sym); localStorage.setItem(k, JSON.stringify({ ts: Date.now(), data: data })); }catch(e){}
  }

  function renderFallback(data){
    try{ hideLoading(); }catch(e){}
    // Render a single large overview box with many metrics (two-column layout inside)
    Array.from(container.querySelectorAll('script,noscript')).forEach(function(n){ n.remove(); });
    var ifr = container.querySelector('iframe'); if(ifr) ifr.style.display='none';
    container.classList.remove('three-by-three');
    Array.from(container.children).forEach(function(ch){ ch.remove(); });

    var metrics = Array.isArray(data) ? data : [];
    // Fallback metric titles/values if not provided
    var defaults = [
      { title: 'Marktkapitalisierung', value: '–' },
      { title: 'Aktueller Kurs', value: '–' },
      { title: 'KGV (PE)', value: '–' },
      { title: 'PEG Ratio', value: '–' },
      { title: 'Umsatz (TTM)', value: '–' },
      { title: 'EPS', value: '–' },
      { title: 'EBITDA', value: '–' },
      { title: 'Nettoergebnis (TTM)', value: '–' },
      { title: 'Operative Marge', value: '–' },
      { title: 'Dividendenrendite', value: '–' },
      { title: 'Free Cash Flow', value: '–' },
      { title: 'Beta', value: '–' },
      { title: 'EV/EBITDA', value: '–' },
      { title: 'Kursziel Analysten', value: '–' },
      { title: '52W‑Hoch', value: '–' },
      { title: '52W‑Tief', value: '–' },
      { title: 'Ausstehende Aktien', value: '–' },
      { title: 'KBV', value: '–' },
      { title: 'KUV (TTM)', value: '–' },
      { title: 'ROE (TTM)', value: '–' }
    ];

    // Merge provided metrics (by title) into a lookup for easy access
    var map = {};
    metrics.forEach(function(m){ if(m && m.title) map[m.title] = m; });

    // build large box
    var box = document.createElement('div');
    box.className = 'financial-large-box p-3 bg-white rounded';
    box.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
    box.style.border = '1px solid rgba(0,0,0,0.04)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '12px';

    var header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    var htitle = document.createElement('div'); htitle.textContent = (symbol||'') + ' — Kennzahlen'; htitle.style.fontWeight = '600'; htitle.style.fontSize = '1.05rem';
    var hsub = document.createElement('div'); hsub.textContent = 'Quelle: Alpha Vantage / Cache'; hsub.style.fontSize = '0.85rem'; hsub.style.color = '#6b7280';
    header.appendChild(htitle); header.appendChild(hsub);
    box.appendChild(header);

    var grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px 18px';

    defaults.forEach(function(def){
      var m = map[def.title] || def;
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'baseline';
      var t = document.createElement('div'); t.textContent = m.title; t.style.color='#374151'; t.style.fontSize='0.95rem';
      var v = document.createElement('div'); v.textContent = (m.value||m.value===0) ? m.value : '–'; v.style.fontWeight='600'; v.style.fontSize='0.95rem';
      row.appendChild(t); row.appendChild(v);
      grid.appendChild(row);
    });

    box.appendChild(grid);
    container.appendChild(box);
  }

  function loadLocalFallback(){
    // from Abonenten/ the data path is ../data/
    var url = '../data/fallback_financials_aapl.json';
    fetch(url).then(function(r){ if(!r.ok) throw new Error('no-local-fallback'); return r.json(); }).then(function(json){
      if(Array.isArray(json) && json.length>=9){ renderFallback(json); }
      else renderFallback();
    }).catch(function(){ renderFallback(); });
  }

  function fmtNumber(n, currency){
    if(n===null||n===undefined||n==='') return '–';
    if(typeof n !== 'number') n = Number(n);
    if(!isFinite(n)) return '–';
    if(Math.abs(n) >= 1e9){
      var v = Math.round((n/1e9)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v) + ' Mrd.' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(Math.abs(n) >= 1e6){
      var v2 = Math.round((n/1e6)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v2) + ' Mio.' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    return new Intl.NumberFormat('de-DE').format(Math.round(n)) + (currency ? ' ' + currencySymbol(currency) : '');
  }

  function normalizeMarketCap(v, currency){
    if(v===null||v===undefined||v==='') return null;
    var n = Number(v);
    if(!isFinite(n)) return null;
    while(n > 1e14){ n = n/1000; }
    if(n >= 1e12) {
      var b = Math.round((n/1e12)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(b) + ' Bio.' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(n >= 1e9) {
      var m = Math.round((n/1e9)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(m) + ' Mrd.' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(n >= 1e6) {
      var mi = Math.round((n/1e6)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(mi) + ' Mio.' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    return new Intl.NumberFormat('de-DE').format(Math.round(n)) + (currency ? ' ' + currencySymbol(currency) : '');
  }

  function formatMargin(x){
    if(x===null||x===undefined||x==='') return '–';
    var n = Number(x);
    if(!isFinite(n)) return '–';
    // Use German number formatting (comma as decimal separator)
    try{
      if(Math.abs(n) <= 1){
        var pct = Math.round(n*1000)/10; // e.g. 0.123 -> 12.3%
        return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pct) + '%';
      }
      if(Math.abs(n) > 1 && Math.abs(n) <= 100){
        var pct2 = Math.round(n*10)/10; // already a percent-like number
        return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pct2) + '%';
      }
      if(Math.abs(n) > 100){
        var pct3 = Math.round((n/100)*10)/10;
        return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pct3) + '%';
      }
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(Math.round(n*10)/10) + '%';
    }catch(e){ return (Math.round(n*10)/10) + '%'; }
  }

  // Robust number parser usable across the module (accepts German and English formats,
  // removes currency signs and thousand separators, returns Number or null)
  function toNumber(x){
    if(x===null||x===undefined||x==='') return null;
    var s = String(x).trim();
    s = s.replace(/[€$£¥]/g,'').trim();
    // If both dot and comma present, assume dot is thousands and comma is decimal
    if(s.indexOf('.') !== -1 && s.indexOf(',') !== -1){
      s = s.replace(/\./g,'').replace(/,/g,'.');
    } else if(s.indexOf(',') !== -1){
      // If only comma present, assume comma is decimal separator
      s = s.replace(/\./g,'').replace(/,/g,'.');
    } else {
      // Remove any non-numeric characters except dot, minus and exponent
      s = s.replace(/[^0-9\.\-eE]/g,'');
    }
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  // Parse a possibly scaled string like "4,1 Bio" or "416,2 Mrd" into a raw Number.
  // Returns Number or null. Recognizes German and English scale words/suffixes.
  function parseScaledNumber(input){
    if(input===null||input===undefined||input==='') return null;
    var s = String(input).trim();
    // remove currency symbols early for easier matching
    s = s.replace(/[€$£¥]/g,'').trim();
    // find numeric token
    var m = s.match(/[-+]?[0-9\.,]+/);
    if(!m) return null;
    var base = toNumber(m[0]);
    if(base===null) return null;
    // detect scale suffix (after the number)
    var rest = s.slice(m.index + m[0].length).toLowerCase();
    var multiplier = 1;
    if(/\b(bio|billion|t|trillion)\b/.test(rest)) multiplier = 1e12;
    else if(/\b(mrd|milliard|bn|b)\b/.test(rest)) multiplier = 1e9;
    else if(/\b(mio|million|m)\b/.test(rest)) multiplier = 1e6;
    else if(/\b(tsd|k)\b/.test(rest)) multiplier = 1e3;
    return base * multiplier;
  }

  // Try to detect currency code from a string token (currency symbol or code)
  function detectCurrencyFromString(s){
    if(!s) return null;
    var str = String(s);
    if(/\bCHF\b/i.test(str) || /CHF/.test(str)) return 'CHF';
    if(/\u20AC/.test(str) || /\bEUR\b/i.test(str)) return 'EUR';
    if(/\$/.test(str) || /\bUSD\b/i.test(str)) return 'USD';
    if(/\u00A3/.test(str) || /\bGBP\b/i.test(str)) return 'GBP';
    if(/\u00A5/.test(str) || /\bJPY\b/i.test(str)) return 'JPY';
    if(/\bCNY\b/i.test(str)) return 'CNY';
    return null;
  }

  // Fetch current price using Alpha Vantage GLOBAL_QUOTE when possible
  function fetchCurrentPrice(){
    // Try proxy first (if configured), then fall back to client Alpha Vantage key
    return new Promise(function(resolve){
      var proxyBase = (window.FINANCIALS_PROXY_URL && String(window.FINANCIALS_PROXY_URL).trim()) || '/api';
      var purl = proxyBase.replace(/\/$/, '') + '/quote/' + encodeURIComponent(symbol);
      fetch(purl).then(function(r){ if(!r.ok) throw new Error('no-proxy'); return r.json(); }).then(function(j){
        if(j && j.data && (j.data.price || j.data.price===0)){
          var n = toNumber(j.data.price);
          return resolve(n);
        }
        // proxy returned no price
        return resolve(null);
      }).catch(function(){
        var key = (window.ALPHA_VANTAGE_KEY && String(window.ALPHA_VANTAGE_KEY).trim()) || '';
        if(!key){ return resolve(null); }
        var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + encodeURIComponent(symbol) + '&apikey=' + key;
        fetch(url).then(function(r){ if(!r.ok) return resolve(null); return r.json(); }).then(function(j){
          try{
            var q = j && (j['Global Quote'] || j['Global quote'] || j['globalQuote']);
            if(q){
              var p = q['05. price'] || q['05 price'] || q.price || null;
              if(p){ var n = toNumber(p); return resolve(n); }
            }
          }catch(e){}
          return resolve(null);
        }).catch(function(){ return resolve(null); });
      });
    });
  }

  // Fetch quarterly income statement / earnings to derive last-quarter metrics.
  // Tries proxy first (if configured) then Alpha Vantage INCOME_STATEMENT (requires key).
  function fetchQuarterlyReports(){
    return new Promise(function(resolve){
      var proxyBase = (window.FINANCIALS_PROXY_URL && String(window.FINANCIALS_PROXY_URL).trim()) || '/api';
      var proxyUrl = proxyBase.replace(/\/$/, '') + '/financials/quarterly/' + encodeURIComponent(symbol);
      // Try proxy
      fetch(proxyUrl).then(function(r){ if(!r.ok) throw new Error('proxy-quarterly-error'); return r.json(); }).then(function(obj){
        // Expecting obj.quarterlyReports or similar shape
        var reports = obj && (obj.quarterlyReports || obj.quarters || obj.data || null);
        if(Array.isArray(reports) && reports.length>0){ return resolve(reports); }
        return resolve(null);
      }).catch(function(){
        // Fallback to Alpha Vantage INCOME_STATEMENT if client key available
        var key = (window.ALPHA_VANTAGE_KEY && String(window.ALPHA_VANTAGE_KEY).trim()) || '';
        if(!key) return resolve(null);
        var url = 'https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=' + encodeURIComponent(symbol) + '&apikey=' + key;
        fetch(url).then(function(r){ if(!r.ok) return resolve(null); return r.json(); }).then(function(j){
          try{
            if(j && Array.isArray(j.quarterlyReports) && j.quarterlyReports.length>0) return resolve(j.quarterlyReports);
          }catch(e){}
          return resolve(null);
        }).catch(function(){ return resolve(null); });
      });
    });
  }

  // Replace the 'Free Cash Flow' entry in the data array with the current price (Aktueller Kurs)
  function enrichWithPrice(arr, currency){
    if(!Array.isArray(arr)) return Promise.resolve(arr);
    return fetchCurrentPrice().then(function(priceNum){
      var out = arr.slice();
      var priceLabel = 'Aktueller Kurs';
      if(priceNum === null){
        // no live price available — keep Free Cash Flow if present
        for(var i=0;i<out.length;i++){ if(out[i] && out[i].title && out[i].title.indexOf('Free Cash')!==-1){ out[i].title = priceLabel; out[i].value = '–'; break; } }
        return out;
      }
      var formatted = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Math.round(priceNum*100)/100) + (currency ? ' ' + currencySymbol(currency) : '');
      // Replace first matching Free Cash Flow slot, otherwise append
      var replaced = false;
      for(var j=0;j<out.length;j++){
        if(out[j] && out[j].title && out[j].title.indexOf('Free Cash')!==-1){ out[j].title = priceLabel; out[j].value = formatted; replaced = true; break; }
      }
      if(!replaced){
        // try to find a sensible position (index 4) and replace
        if(out.length >= 5){ out[4] = { title: priceLabel, value: formatted }; }
        else { out.push({ title: priceLabel, value: formatted }); }
      }
      return out;
    });
  }

  // Finnhub integration removed — Alpha Vantage is used as the single live source.

  // Alpha Vantage fallback: use OVERVIEW endpoint to map key fields
  function fetchAlpha(){
    var key = (window.ALPHA_VANTAGE_KEY && String(window.ALPHA_VANTAGE_KEY).trim()) || '';
    if(!key) return Promise.reject(new Error('no-alpha-key'));
    var url = 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=' + symbol + '&apikey=' + key;
    // Check cache first
    try{
      var cached = readCache(symbol);
      if(cached && cached.data && cached.ageHours <= CACHE_TTL_HOURS){
        writeStatus('Alpha Vantage: Verwende gecachte Daten (Alter ' + Math.round(cached.ageHours) + 'h)', 'info');
        try{
          var f = ensureFormatted(cached.data, detectedCurrency);
          // ensure cached result is enriched with a live price slot as well
          return enrichWithPrice(f, detectedCurrency).then(function(enriched){ return Promise.resolve(enriched); }).catch(function(){ return Promise.resolve(f); });
        }catch(e){ return Promise.resolve(cached.data); }
      }
      if(cached){ writeStatus('Alpha Vantage: Gecachte Daten vorhanden (Alter ' + Math.round(cached.ageHours) + 'h) — versuche Aktualisierung', 'info'); }
    }catch(e){}

    writeStatus('Alpha Vantage: Anfrage gestartet', 'info');
    return fetch(url).then(function(r){
      if(!r.ok) { writeStatus('Alpha Vantage: HTTP ' + r.status, 'warn'); throw new Error('alpha-error'); }
      return r.json();
    }).then(function(obj){
      if(obj && obj.Note){ writeStatus('Alpha Vantage: Notice/Limit — ' + String(obj.Note).slice(0,200), 'warn'); throw new Error('alpha-limit'); }
      if(obj && obj['Error Message']){ writeStatus('Alpha Vantage: Error — ' + String(obj['Error Message']).slice(0,200), 'error'); throw new Error('alpha-error-message'); }
      if(!obj || Object.keys(obj).length===0){ writeStatus('Alpha Vantage: Leere Antwort', 'warn'); throw new Error('alpha-empty'); }
      console.debug('ALPHA OVERVIEW raw:', obj);
      detectedCurrency = obj.Currency || null;
      writeStatus('Alpha Vantage: Overview erhalten' + (detectedCurrency ? ' ('+detectedCurrency+')' : ''), 'ok');
      var data = [
        { title: 'Marktkapitalisierung', value: obj.MarketCapitalization ? normalizeMarketCap(obj.MarketCapitalization, detectedCurrency) : '–' },
        // Free Cash Flow kept so enrichWithPrice can replace it with 'Aktueller Kurs'
        { title: 'Free Cash Flow', value: obj.FreeCashFlow ? fmtNumber(Number(obj.FreeCashFlow), detectedCurrency) : '–' },
        { title: 'KGV (PE)', value: obj.PERatio ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(Math.round(Number(obj.PERatio)*10)/10) : '–' },
        { title: 'PEG Ratio', value: obj.PEGRatio ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.PEGRatio)) : '–' },
        { title: 'Umsatz (TTM)', value: obj.RevenueTTM ? fmtNumber(Number(obj.RevenueTTM), detectedCurrency) : '–' },
        { title: 'EPS', value: obj.EPS ? (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Math.round(Number(obj.EPS)*100)/100) + (detectedCurrency ? ' ' + currencySymbol(detectedCurrency) : '')) : '–' },
        { title: 'EBITDA', value: obj.EBITDA ? fmtNumber(Number(obj.EBITDA), detectedCurrency) : '–' },
        { title: 'Nettoergebnis (TTM)', value: obj.NetIncomeTTM ? fmtNumber(Number(obj.NetIncomeTTM), detectedCurrency) : '–' },
        { title: 'Operative Marge', value: (obj.OperatingMarginTTM || obj.ProfitMargin) ? formatMargin(Number(obj.OperatingMarginTTM || obj.ProfitMargin)) : '–' },
        { title: 'Dividendenrendite', value: (function(){ try{ var dy = Number(obj.DividendYield); if(!isFinite(dy)) return '–'; var pct = (Math.abs(dy) <= 1) ? (Math.round(dy*1000)/10) : (Math.round(dy*10)/10); return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pct) + '%'; }catch(e){ return '–'; } })() },
        { title: 'Beta', value: obj.Beta ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.Beta)) : '–' },
        { title: 'EV/EBITDA', value: (obj.EVToEBITDA || obj['EVToEBITDA']) ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.EVToEBITDA || obj['EVToEBITDA'])) : '–' },
        { title: 'Kursziel Analysten', value: obj.AnalystTargetPrice ? (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.AnalystTargetPrice)) + (detectedCurrency ? ' ' + currencySymbol(detectedCurrency) : '')) : '–' },
        { title: '52W‑Hoch', value: (obj['52WeekHigh'] || obj.WeekHigh52) ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj['52WeekHigh'] || obj.WeekHigh52)) : '–' },
        { title: '52W‑Tief', value: (obj['52WeekLow'] || obj.WeekLow52) ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj['52WeekLow'] || obj.WeekLow52)) : '–' },
        { title: 'Ausstehende Aktien', value: obj.SharesOutstanding ? new Intl.NumberFormat('de-DE').format(Math.round(Number(obj.SharesOutstanding))) : '–' },
        { title: 'KBV', value: obj.PriceToBookRatio ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.PriceToBookRatio)) : '–' },
        { title: 'KUV (TTM)', value: obj.PriceToSalesRatioTTM ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(obj.PriceToSalesRatioTTM)) : '–' },
        { title: 'ROE (TTM)', value: obj.ReturnOnEquityTTM ? formatMargin(Number(obj.ReturnOnEquityTTM)) : '–' }
      ];
      // fetch quarterly reports and insert last-quarter metrics if available
      return fetchQuarterlyReports().then(function(reports){
        try{
          if(Array.isArray(reports) && reports.length>0){
            var latest = reports[0];
            var prev = reports[1] || null;
            // totalRevenue, netIncome, reportedEPS, fiscalDateEnding
            var revLatest = latest.totalRevenue ? toNumber(latest.totalRevenue) : (latest.totalRevenue ? toNumber(latest.totalRevenue) : null);
            var revPrev = prev && prev.totalRevenue ? toNumber(prev.totalRevenue) : null;
            var epsLatest = latest.reportedEPS ? toNumber(latest.reportedEPS) : null;
            var epsPrev = prev && prev.reportedEPS ? toNumber(prev.reportedEPS) : null;
            if(revLatest !== null){ data.unshift({ title: 'Umsatz (letztes Q)', value: fmtNumber(revLatest, detectedCurrency) });
              if(revPrev !== null){ var change = ((revLatest - revPrev) / Math.abs(revPrev)) * 100; data.splice(1,0,{ title: 'Umsatz q/q', value: (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(Math.round(change*10)/10) + '%') }); }
            }
            if(epsLatest !== null){ data.splice(2,0,{ title: 'EPS (letztes Q)', value: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Math.round(epsLatest*100)/100) + (detectedCurrency ? ' ' + currencySymbol(detectedCurrency) : '') });
              if(epsPrev !== null){ var epsChange = ((epsLatest - epsPrev)/Math.abs(epsPrev))*100; data.splice(3,0,{ title: 'EPS q/q', value: (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(Math.round(epsChange*10)/10) + '%') }); }
            }
          }
        }catch(e){ }
        // enrich with live price (replaces Free Cash Flow slot) before caching
        return enrichWithPrice(data, detectedCurrency).then(function(enriched){
          try{ writeCache(symbol, enriched); }catch(e){}
          return enriched;
        });
      }).catch(function(){
        return enrichWithPrice(data, detectedCurrency).then(function(enriched){ try{ writeCache(symbol, enriched); }catch(e){}; return enriched; });
      });
    });
  }

  function fetchAlphaWithCacheFallback(){
    var cached = readCache(symbol);
    return fetchAlpha().catch(function(err){
      if(cached && cached.data){
        writeStatus('Alpha Vantage: Fehler — verwende ältere gecachte Daten (Alter ' + Math.round(cached.ageHours) + 'h)', 'warn');
        try{ return ensureFormatted(cached.data, detectedCurrency); }catch(e){ return cached.data; }
      }
      throw err;
    });
  }

  // Use Alpha Vantage as the single primary source, fallback to local JSON.
  console.debug('Using Alpha Vantage as primary data source');
  // Helper: try server proxy if configured or default
  function fetchProxy(){
    var proxyBase = (window.FINANCIALS_PROXY_URL && String(window.FINANCIALS_PROXY_URL).trim()) || '/api';
    var url = proxyBase.replace(/\/$/, '') + '/financials/' + encodeURIComponent(symbol);
    writeStatus('Proxy: Anfrage an ' + url, 'info');
    return fetch(url).then(function(r){
      if(!r.ok) throw new Error('proxy-error-'+r.status);
      return r.json();
    }).then(function(obj){
      // Proxy may return two shapes: array or wrapped object with currency
      if(obj && obj.data){
        if(obj.data.data && Array.isArray(obj.data.data)){
          detectedCurrency = obj.data.currency || null;
          writeStatus('Proxy: Rohdaten erhalten (Quelle: ' + (obj.source||'proxy') + ') — Währung: ' + (detectedCurrency||'unbekannt'), 'info');
          // Use module-level helpers `toNumber` and `parseScaledNumber` for robust parsing
          var raw = obj.data.data;
          var formatted = raw.map(function(it){
            var t = it.title || '';
            var v = it.value;
            var n = (typeof v === 'string') ? parseScaledNumber(v) : toNumber(v);
            try{
              if(t.indexOf('Marktkapital')!==-1) return { title: t, value: n!==null ? normalizeMarketCap(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('KGV')!==-1) return { title: t, value: n!==null ? (Math.round(n*10)/10) : '–', sub: it.sub };
              if(t.indexOf('Umsatz')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t === 'EPS') return { title: t, value: n!==null ? (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Math.round(n*100)/100) + (detectedCurrency ? ' ' + currencySymbol(detectedCurrency) : '')) : '–', sub: it.sub };
              if(t.indexOf('Free Cash')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t === 'EBITDA') return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('Netto')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('Dividende')!==-1){
                if(n===null) return { title: t, value: (v||'–'), sub: it.sub };
                try{
                  var pctVal = (Math.abs(n) <= 1) ? (Math.round(n*1000)/10) : (Math.round(n*10)/10);
                  return { title: t, value: (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pctVal) + '%'), sub: it.sub };
                }catch(e){
                  if(Math.abs(n) <= 1) return { title: t, value: (Math.round(n*1000)/10) + '%', sub: it.sub };
                  return { title: t, value: (Math.round(n*10)/10) + '%', sub: it.sub };
                }
              }
              if(t.indexOf('Marge')!==-1) return { title: t, value: n!==null ? formatMargin(n) : '–', sub: it.sub };
            }catch(e){ }
            return { title: t, value: (v||'–'), sub: it.sub };
          });
          // enrich with live price (if available) before caching/returning
          return enrichWithPrice(formatted, detectedCurrency).then(function(enriched){
            try{ writeCache(symbol, enriched); }catch(e){}
            writeStatus('Proxy: Rohdaten formatiert und zwischengespeichert', 'ok');
            return enriched;
          });
        }
        if(Array.isArray(obj.data)){
          writeStatus('Proxy: Daten erhalten (Quelle: ' + (obj.source||'proxy') + ')', 'info');
          // ensure array responses are formatted consistently
          var fmt = ensureFormatted(obj.data, obj.currency || detectedCurrency);
          return enrichWithPrice(fmt, obj.currency || detectedCurrency).then(function(enriched){
            try{ writeCache(symbol, enriched); }catch(e){}
            return enriched;
          });
        }
      }
      throw new Error('proxy-empty');
    });
  }
  
  function ensureFormatted(arr, currency){
    if(!Array.isArray(arr)) return arr;
    return arr.map(function(it){
      var t = it.title || '';
      var v = it.value;
      if(v === null || v === undefined) return { title: t, value: '–', sub: it.sub };
      var s = String(v);
      // determine currency: passed-in currency, or try to detect from value text, or fallback to module detectedCurrency
      var localCurrency = currency || detectCurrencyFromString(s) || detectedCurrency || (/^[A-Z]{1,5}$/.test(symbol) ? 'USD' : null);
      var n = parseScaledNumber(s);
      if(n === null) return { title: t, value: s, sub: it.sub };
      try{
        if(t.indexOf('Marktkapital')!==-1) return { title: t, value: normalizeMarketCap(n, localCurrency), sub: it.sub };
        if(t.indexOf('KGV')!==-1) return { title: t, value: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(Math.round(n*10)/10), sub: it.sub };
        if(t.indexOf('Umsatz')!==-1) return { title: t, value: fmtNumber(n, localCurrency), sub: it.sub };
        if(t === 'EPS') return { title: t, value: (new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Math.round(n*100)/100) + (localCurrency ? ' ' + currencySymbol(localCurrency) : '')), sub: it.sub };
        if(t.indexOf('Free Cash')!==-1) return { title: t, value: fmtNumber(n, localCurrency), sub: it.sub };
        if(t === 'EBITDA') return { title: t, value: fmtNumber(n, localCurrency), sub: it.sub };
        if(t.indexOf('Netto')!==-1) return { title: t, value: fmtNumber(n, localCurrency), sub: it.sub };
        if(t.indexOf('Dividende')!==-1){
          try{
            if(Math.abs(n) <= 1) {
              var pctA = Math.round(n*1000)/10;
              return { title: t, value: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pctA) + '%', sub: it.sub };
            }
            var pctB = Math.round(n*10)/10;
            return { title: t, value: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(pctB) + '%', sub: it.sub };
          }catch(e){
            if(Math.abs(n) <= 1) return { title: t, value: (Math.round(n*1000)/10) + '%', sub: it.sub };
            return { title: t, value: (Math.round(n*10)/10) + '%', sub: it.sub };
          }
        }
        if(t.indexOf('Marge')!==-1) return { title: t, value: formatMargin(n), sub: it.sub };
      }catch(e){ }
      return { title: t, value: s, sub: it.sub };
    });
  }

  // Schedule refresh logic: attempt to update once per TTL (default 24h)
  var __cap_refresh_timer = null;
  function scheduleRefresh(){
    try{
      if(__cap_refresh_timer) { clearTimeout(__cap_refresh_timer); __cap_refresh_timer = null; }
      var cached = readCache(symbol);
      var nextMs = CACHE_TTL_HOURS * 3600000; // default
      if(cached && typeof cached.ageHours === 'number'){
        var remainingH = CACHE_TTL_HOURS - cached.ageHours;
        nextMs = Math.max(0, remainingH * 3600000);
      }
      var delay = nextMs <= 0 ? 1000 : nextMs;
      __cap_refresh_timer = setTimeout(function(){
        fetchAlphaWithCacheFallback().then(function(newData){
          try{ renderFallback(newData); }catch(e){}
        }).catch(function(err){
          console.warn('scheduled alpha refresh failed', err);
        }).finally(function(){
          scheduleRefresh();
        });
      }, delay);
    }catch(e){ }
  }

  // Encapsulate the data-loading decision so we can re-use it when the user selects another stock.
  function loadData(){
    try{ showLoading('Daten für ' + (symbol||'') + ' werden geladen…'); }catch(e){}
    // clear previous status messages
    try{ Array.from(container.querySelectorAll('.fb-status')).forEach(function(n){ n.remove(); }); }catch(e){}

    // If we have recent cached data (<= TTL), render it immediately and avoid hitting the API.
    try{
      var cached = readCache(symbol);
      if(cached && cached.data && typeof cached.ageHours === 'number' && cached.ageHours <= CACHE_TTL_HOURS){
        writeStatus('Verwende gecachte Daten (Alter ' + Math.round(cached.ageHours) + 'h)', 'info');
        try{
          var f = ensureFormatted(cached.data, detectedCurrency);
          renderFallback(f);
        }catch(e){ renderFallback(cached.data); }
        // schedule a background refresh for when the cache becomes stale
        try{ scheduleRefresh(); }catch(e){}
        return;
      }
    }catch(e){}

    // No recent cache -> perform live fetch (proxy preferred)
    var alphaKey = (window.ALPHA_VANTAGE_KEY && String(window.ALPHA_VANTAGE_KEY).trim()) || '';
    if(!alphaKey){
      // No client key: try proxy first, then cache/local fallback
      fetchProxy().then(function(d){ renderFallback(d); scheduleRefresh(); }).catch(function(){
        fetchAlphaWithCacheFallback().then(function(ad){ renderFallback(ad); scheduleRefresh(); }).catch(function(aerr){
          console.warn('alpha failed', aerr);
          writeStatus('Keine Live-Daten verfügbar — verwende lokalen Fallback', 'error');
          loadLocalFallback();
          scheduleRefresh();
        });
      });
    } else {
      // client has key: use alpha directly (with cache) and schedule
      fetchAlphaWithCacheFallback().then(function(ad){ renderFallback(ad); scheduleRefresh(); }).catch(function(aerr){
        console.warn('alpha failed', aerr);
        writeStatus('Alpha Vantage: Kein Live-Datensatz verfügbar — versuche Proxy oder lokalen Fallback', 'warn');
        fetchProxy().then(function(d){ renderFallback(d); scheduleRefresh(); }).catch(function(){ loadLocalFallback(); scheduleRefresh(); });
      });
    }
  }

  // Public helper: allow external pages (z.B. aktien-monitor) to request a reload for a given symbol.
  // Usage: window.capitovoLoadFinancials('AAPL') — shows loading UI and loads data (cached within 24h)
  window.capitovoLoadFinancials = function(newSymbol){
    try{
      if(!newSymbol) return;
      symbol = String(newSymbol).toUpperCase();
      // Always show loading when user selects a new stock
      try{ showLoading('Daten für ' + symbol + ' werden geladen…'); }catch(e){}
      // trigger the same load flow (which respects the 24h TTL)
      loadData();
    }catch(e){ console.warn('capitovoLoadFinancials error', e); }
  };

  // initial load
  loadData();

})();
