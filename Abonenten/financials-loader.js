(function(){
  // External loader for financials — uses Alpha Vantage OVERVIEW and falls back to local JSON.
  var symbol = 'AAPL';
  var container = document.getElementById('financials-overview');
  if(!container) return;

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
    // from Abonenten/ the data path is ../data/
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
    return fetch(url).then(function(r){
      if(!r.ok) throw new Error('alpha-error');
      return r.json();
    }).then(function(obj){
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
      console.debug('ALPHA OVERVIEW raw:', obj);
      return data;
    });
  }

  // Use Alpha Vantage as the single primary source, fallback to local JSON.
  console.debug('Using Alpha Vantage as primary data source');
  fetchAlpha().then(function(ad){ renderFallback(ad); }).catch(function(aerr){
    console.warn('alpha failed', aerr);
    loadLocalFallback();
  });

})();
