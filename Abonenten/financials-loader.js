(function(){
  // External loader for financials — uses Finnhub and falls back to local JSON.
  var FINN_KEY = (window.FINNHUB_API_KEY && String(window.FINNHUB_API_KEY).trim()) || '';
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

  function fetchFinnhub(){
    if(!FINN_KEY) return Promise.reject(new Error('no-finn-key'));
    var profileUrl = 'https://finnhub.io/api/v1/stock/profile2?symbol=' + symbol + '&token=' + FINN_KEY;
    var metricUrl = 'https://finnhub.io/api/v1/stock/metric?symbol=' + symbol + '&metric=all&token=' + FINN_KEY;
    return Promise.all([fetch(profileUrl), fetch(metricUrl)]).then(function(res){
      if(!res[0].ok || !res[1].ok) throw new Error('finnhub-error');
      return Promise.all([res[0].json(), res[1].json()]);
    }).then(function(results){
      var profile = results[0] || {};
      var metricsObj = results[1] || {};
      var m = metricsObj.metric || {};
      var data = [
        { title: 'Marktkapitalisierung', value: profile.marketCapitalization ? (Math.round(profile.marketCapitalization/1e9*10)/10)+' Mrd' : (m.marketCapitalization ? (Math.round(m.marketCapitalization/1e9*10)/10)+' Mrd' : '–') },
        { title: 'KGV (PE)', value: (m.peNormalizedAnnual || m.peTTM || m.peBasicExclExtraTTM) ? (Math.round((m.peNormalizedAnnual||m.peTTM||m.peBasicExclExtraTTM)*10)/10) : '–' },
        { title: 'Umsatz (letzte Periode)', value: (m.revenueTTM || m.revenue) ? (Math.round((m.revenueTTM||m.revenue)/1e9*10)/10)+' Mrd' : '–' },
        { title: 'EPS', value: (m.epsTTM || m.eps) ? (Math.round((m.epsTTM||m.eps)*100)/100) : '–' },
        { title: 'Free Cash Flow', value: (m.freeCashFlowTTM || m.freeCashFlow) ? (Math.round((m.freeCashFlowTTM||m.freeCashFlow)/1e9*10)/10)+' Mrd' : '–' },
        { title: 'EBITDA', value: (m.ebitda || m.ebitdaTTM) ? (Math.round((m.ebitda||m.ebitdaTTM)/1e9*10)/10)+' Mrd' : '–' },
        { title: 'Nettoergebnis', value: (m.netIncomeTTM || m.netIncome) ? (Math.round((m.netIncomeTTM||m.netIncome)/1e9*10)/10)+' Mrd' : '–' },
        { title: 'Dividende (letzter)', value: profile.dividendYield ? (Math.round(profile.dividendYield*1000)/10)+'%' : (m.dividendYield ? (Math.round(m.dividendYield*1000)/10)+'%' : '–') },
        { title: 'Operative Marge', value: (m.operatingMarginTTM || m.operatingMargin) ? (Math.round((m.operatingMarginTTM||m.operatingMargin)*1000)/10)+'%' : '–' }
      ];
      return data;
    });
  }

  // Try Finnhub first. If it fails, load local fallback.
  fetchFinnhub().then(function(data){ renderFallback(data); }).catch(function(err){ console.warn('finnhub failed', err); loadLocalFallback(); });

})();
