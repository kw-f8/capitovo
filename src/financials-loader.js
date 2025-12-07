(function(){
  // External loader for financials — uses Alpha Vantage OVERVIEW and falls back to local JSON.
  var symbol = 'AAPL';
  var container = document.getElementById('financials-overview');
  if(!container) return;

  function writeStatus(msg, level){
    try{
      var el = document.createElement('div');
      el.className = 'fb-status';
      el.style.fontSize = '0.9rem';
      el.style.padding = '6px 0';
      el.style.color = (level==='error' ? '#b91c1c' : (level==='warn' ? '#92400e' : '#374151'));
      el.textContent = msg;
      container.insertBefore(el, container.firstChild);
    }catch(e){ /* ignore in weird environments */ }
  }

  // Caching: cache Alpha Vantage overview in localStorage to avoid frequent requests.
  var CACHE_TTL_HOURS = (window.FINANCIALS_CACHE_TTL_HOURS && Number(window.FINANCIALS_CACHE_TTL_HOURS)) || 36; // default 36h
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

  function createBox(title, value, sub){
    var box = document.createElement('div');
    box.className = 'financial-box p-3 bg-white rounded';
    var t = document.createElement('div'); t.className='fb-title'; t.textContent = title;
    var v = document.createElement('div'); v.className='fb-value'; v.textContent = value;
    box.appendChild(t); box.appendChild(v);
    if(sub){ var s = document.createElement('div'); s.className='fb-sub'; s.textContent = sub; box.appendChild(s); }
    return box;
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
    var url = '../data/fallback_financials_aapl.json';
    fetch(url).then(function(r){ if(!r.ok) throw new Error('no-local-fallback'); return r.json(); }).then(function(json){
      if(Array.isArray(json) && json.length>=9){ renderFallback(json); }
      else renderFallback();
    }).catch(function(){ renderFallback(); });
  }

  function fmtNumber(n){
    if(n===null||n===undefined||n==='') return '–';
    if(typeof n !== 'number') n = Number(n);
    if(!isFinite(n)) return '–';
    if(Math.abs(n) >= 1e9) return (Math.round((n/1e9)*10)/10) + ' Mrd';
    if(Math.abs(n) >= 1e6) return (Math.round((n/1e6)*10)/10) + ' Mio';
    return new Intl.NumberFormat('de-DE').format(Math.round(n));
  }

  function normalizeMarketCap(v){
    if(v===null||v===undefined||v==='') return null;
    var n = Number(v);
    if(!isFinite(n)) return null;
    // If value is absurdly large, attempt to reduce by factors of 1000 until reasonable
    while(n > 1e14){ n = n/1000; }
    if(n >= 1e12) return (Math.round((n/1e12)*10)/10) + ' Bio';
    if(n >= 1e9) return (Math.round((n/1e9)*10)/10) + ' Mrd';
    if(n >= 1e6) return (Math.round((n/1e6)*10)/10) + ' Mio';
    return new Intl.NumberFormat('de-DE').format(Math.round(n));
  }

  function formatMargin(x){
    if(x===null||x===undefined||x==='') return '–';
    var n = Number(x);
    if(!isFinite(n)) return '–';
    // If value looks like a fraction (0.28) -> percent
    if(Math.abs(n) <= 1) return (Math.round(n*1000)/10) + '%';
    // If value is reasonable percent (e.g. 28.3) -> show as-is
    if(Math.abs(n) > 1 && Math.abs(n) <= 100) return (Math.round(n*10)/10) + '%';
    // If value massively large (e.g. 3197) maybe it's scaled by 100 -> normalize
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
      // show visible debug info if something is off
      if(obj && obj.Note){
        writeStatus('Alpha Vantage: Notice/Limit — ' + String(obj.Note).slice(0,200), 'warn');
        throw new Error('alpha-limit');
      }
      if(obj && obj['Error Message']){
        writeStatus('Alpha Vantage: Error — ' + String(obj['Error Message']).slice(0,200), 'error');
        throw new Error('alpha-error-message');
      }
      if(!obj || Object.keys(obj).length===0){
        writeStatus('Alpha Vantage: Leere Antwort', 'warn');
        throw new Error('alpha-empty');
      }
      console.debug('ALPHA OVERVIEW raw:', obj);
      writeStatus('Alpha Vantage: Overview erhalten', 'ok');
      // Alpha Vantage OVERVIEW fields: MarketCapitalization, PERatio, EBITDA, RevenueTTM, EPS, DividendYield, ProfitMargin
      var data = [
        { title: 'Marktkapitalisierung', value: obj.MarketCapitalization ? normalizeMarketCap(obj.MarketCapitalization) : '–' },
        { title: 'KGV (PE)', value: obj.PERatio ? (Math.round(Number(obj.PERatio)*10)/10) : '–' },
        { title: 'Umsatz (letzte Periode)', value: obj.RevenueTTM ? fmtNumber(Number(obj.RevenueTTM)) : '–' },
        { title: 'EPS', value: obj.EPS ? (Math.round(Number(obj.EPS)*100)/100) : '–' },
        { title: 'Free Cash Flow', value: obj.FreeCashFlow ? fmtNumber(Number(obj.FreeCashFlow)) : '–' },
        { title: 'EBITDA', value: obj.EBITDA ? fmtNumber(Number(obj.EBITDA)) : '–' },
        { title: 'Nettoergebnis', value: obj.NetIncomeTTM ? fmtNumber(Number(obj.NetIncomeTTM)) : '–' },
        { title: 'Dividende (letzter)', value: obj.DividendYield ? (Math.round(Number(obj.DividendYield)*1000)/10)+'%' : '–' },
        { title: 'Operative Marge', value: obj.ProfitMargin ? formatMargin(Number(obj.ProfitMargin)) : '–' }
      ];
      // cache successful response
      try{ writeCache(symbol, data); }catch(e){}
      return data;
    });
  }

  // If fetchAlpha fails, but cache exists, return cached data to keep UI populated.
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
  fetchAlphaWithCacheFallback().then(function(ad){ renderFallback(ad); }).catch(function(aerr){
    console.warn('alpha failed', aerr);
    writeStatus('Alpha Vantage: Kein Live-Datensatz verfügbar — verwende lokalen Fallback', 'error');
    loadLocalFallback();
  });

})();
