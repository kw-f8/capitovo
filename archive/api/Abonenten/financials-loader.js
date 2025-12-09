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
    console.debug('renderFallback done, content appended for symbol=', symbol);
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
