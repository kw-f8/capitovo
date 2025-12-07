(function(){
  // External loader for financials — uses Alpha Vantage OVERVIEW and falls back to local JSON.
  var symbol = 'AAPL';
  var container = document.getElementById('financials-overview');
  if(!container) return;
  var detectedCurrency = null;

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
  var CACHE_TTL_HOURS = (window.FINANCIALS_CACHE_TTL_HOURS && Number(window.FINANCIALS_CACHE_TTL_HOURS)) || 36; // default 36h
  function cacheKey(sym){ return 'capitovo_fin_overview_v2_' + String(sym).toUpperCase(); }
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
    Array.from(container.querySelectorAll('script,noscript')).forEach(function(n){ n.remove(); });
    var ifr = container.querySelector('iframe'); if(ifr) ifr.style.display='none';
    container.classList.add('three-by-three');
    Array.from(container.children).forEach(function(ch){ ch.remove(); });
    for(var i=0;i<9;i++){
      var defaults = ['Market Cap','KGV','Umsatz','EPS','Free Cash Flow','EBITDA','Net Income','Dividende','Operative Marge'];
      var d = data && data[i] ? data[i] : { title: defaults[i], value: '–', sub: '' };
      container.appendChild(createBox(d.title, d.value, d.sub));
    }
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
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v) + ' Mrd' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(Math.abs(n) >= 1e6){
      var v2 = Math.round((n/1e6)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v2) + ' Mio' + (currency ? ' ' + currencySymbol(currency) : '');
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
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(b) + ' Bio' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(n >= 1e9) {
      var m = Math.round((n/1e9)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(m) + ' Mrd' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    if(n >= 1e6) {
      var mi = Math.round((n/1e6)*10)/10;
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(mi) + ' Mio' + (currency ? ' ' + currencySymbol(currency) : '');
    }
    return new Intl.NumberFormat('de-DE').format(Math.round(n)) + (currency ? ' ' + currencySymbol(currency) : '');
  }

  function formatMargin(x){
    if(x===null||x===undefined||x==='') return '–';
    var n = Number(x);
    if(!isFinite(n)) return '–';
    if(Math.abs(n) <= 1) return (Math.round(n*1000)/10) + '%';
    if(Math.abs(n) > 1 && Math.abs(n) <= 100) return (Math.round(n*10)/10) + '%';
    if(Math.abs(n) > 100) return (Math.round((n/100)*10)/10) + '%';
    return (Math.round(n*10)/10) + '%';
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
        return Promise.resolve(cached.data);
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
        { title: 'KGV (PE)', value: obj.PERatio ? (Math.round(Number(obj.PERatio)*10)/10) : '–' },
        { title: 'Umsatz (letzte Periode)', value: obj.RevenueTTM ? fmtNumber(Number(obj.RevenueTTM), detectedCurrency) : '–' },
        { title: 'EPS', value: obj.EPS ? (Math.round(Number(obj.EPS)*100)/100) : '–' },
        { title: 'Free Cash Flow', value: obj.FreeCashFlow ? fmtNumber(Number(obj.FreeCashFlow), detectedCurrency) : '–' },
        { title: 'EBITDA', value: obj.EBITDA ? fmtNumber(Number(obj.EBITDA), detectedCurrency) : '–' },
        { title: 'Nettoergebnis', value: obj.NetIncomeTTM ? fmtNumber(Number(obj.NetIncomeTTM), detectedCurrency) : '–' },
        { title: 'Dividende (letzter)', value: obj.DividendYield ? (Math.round(Number(obj.DividendYield)*1000)/10)+'%' : '–' },
        { title: 'Operative Marge', value: obj.ProfitMargin ? formatMargin(Number(obj.ProfitMargin)) : '–' }
      ];
      // cache successful response
      try{ writeCache(symbol, data); }catch(e){}
      return data;
    });
  }

  function fetchAlphaWithCacheFallback(){
    var cached = readCache(symbol);
    return fetchAlpha().catch(function(err){
      if(cached && cached.data){
        writeStatus('Alpha Vantage: Fehler — verwende ältere gecachte Daten (Alter ' + Math.round(cached.ageHours) + 'h)', 'warn');
        return cached.data;
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
          function toNumber(x){ if(x===null||x===undefined||x==='') return null; var s = String(x).replace(/[\s\.,€$£¥]/g,''); var n = Number(s); return isFinite(n)? n : null; }
          var raw = obj.data.data;
          var formatted = raw.map(function(it){
            var t = it.title || '';
            var v = it.value;
            var n = toNumber(v);
            try{
              if(t.indexOf('Marktkapital')!==-1) return { title: t, value: n!==null ? normalizeMarketCap(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('KGV')!==-1) return { title: t, value: n!==null ? (Math.round(n*10)/10) : '–', sub: it.sub };
              if(t.indexOf('Umsatz')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t === 'EPS') return { title: t, value: n!==null ? (Math.round(n*100)/100) : '–', sub: it.sub };
              if(t.indexOf('Free Cash')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t === 'EBITDA') return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('Netto')!==-1) return { title: t, value: n!==null ? fmtNumber(n, detectedCurrency) : '–', sub: it.sub };
              if(t.indexOf('Dividende')!==-1){
                if(n===null) return { title: t, value: (v||'–'), sub: it.sub };
                if(Math.abs(n) <= 1) return { title: t, value: (Math.round(n*1000)/10) + '%', sub: it.sub };
                return { title: t, value: (Math.round(n*10)/10) + '%', sub: it.sub };
              }
              if(t.indexOf('Marge')!==-1) return { title: t, value: n!==null ? formatMargin(n) : '–', sub: it.sub };
            }catch(e){ }
            return { title: t, value: (v||'–'), sub: it.sub };
          });
          try{ writeCache(symbol, formatted); }catch(e){}
          writeStatus('Proxy: Rohdaten formatiert und zwischengespeichert', 'ok');
          return formatted;
        }
        if(Array.isArray(obj.data)){
          writeStatus('Proxy: Daten erhalten (Quelle: ' + (obj.source||'proxy') + ')', 'ok');
          try{ writeCache(symbol, obj.data); }catch(e){}
          return obj.data;
        }
      }
      throw new Error('proxy-empty');
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

})();
