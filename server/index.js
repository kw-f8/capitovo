#!/usr/bin/env node
/*
  Simple Alpha Vantage proxy with in-memory cache.
  Requirements: Node >= 18 (global fetch available). Uses dotenv for .env convenience.
  Start: `npm install` then `npm start` from /server
*/

const fs = require('fs');
const path = require('path');
const http = require('http');

// Load .env if present
try{ require('dotenv').config(); }catch(e){}

const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY || null;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const CACHE_TTL_HOURS = process.env.CACHE_TTL_HOURS ? Number(process.env.CACHE_TTL_HOURS) : 24;

if(!ALPHA_KEY){
  console.warn('Warning: ALPHA_VANTAGE_KEY not set. Proxy will return 502 for live requests. See .env.example');
}

const cache = new Map(); // symbol -> { ts: number, data: any }

function now(){ return Date.now(); }
function cacheKey(sym){ return String(sym).toUpperCase(); }

async function fetchOverview(symbol){
  if(!ALPHA_KEY) throw { code: 502, message: 'Alpha Vantage API key not configured on server.' };
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_KEY}`;
  const res = await fetch(url);
  if(res.status === 403) throw { code: 403, message: 'Alpha Vantage: 403 Forbidden (possible legacy/permission issue)' };
  if(!res.ok) throw { code: 502, message: 'Alpha Vantage: HTTP ' + res.status };
  const obj = await res.json();
  if(obj && obj.Note) throw { code: 429, message: 'Alpha Vantage: API limit or notice: ' + obj.Note };
  if(obj && obj['Error Message']) throw { code: 502, message: 'Alpha Vantage: ' + obj['Error Message'] };
  if(!obj || Object.keys(obj).length === 0) throw { code: 502, message: 'Alpha Vantage: empty response' };
  // Map to the expected client structure (array of 9 boxes)
  const data = [
    { title: 'Marktkapitalisierung', value: obj.MarketCapitalization || null },
    { title: 'KGV (PE)', value: obj.PERatio || null },
    { title: 'Umsatz (letzte Periode)', value: obj.RevenueTTM || null },
    { title: 'EPS', value: obj.EPS || null },
    { title: 'Free Cash Flow', value: obj.FreeCashFlow || null },
    { title: 'EBITDA', value: obj.EBITDA || null },
    { title: 'Nettoergebnis', value: obj.NetIncomeTTM || null },
    { title: 'Dividende (letzter)', value: obj.DividendYield || null },
    { title: 'Operative Marge', value: obj.ProfitMargin || null }
  ];
  // Provide currency if available
  const currency = obj.Currency || null;
  return { data, currency };
}

function getCached(symbol){
  const k = cacheKey(symbol);
  const entry = cache.get(k);
  if(!entry) return null;
  const ageMs = now() - entry.ts;
  const ageH = ageMs / 36e5;
  if(ageH > CACHE_TTL_HOURS) return null;
  return { ageHours: ageH, data: entry.data };
}

function setCache(symbol, data){
  const k = cacheKey(symbol);
  cache.set(k, { ts: now(), data });
}

function sendJson(res, code, obj){
  const payload = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*'
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  try{
    const url = new URL(req.url, `http://${req.headers.host}`);
    if(url.pathname === '/api/health'){
      return sendJson(res, 200, { ok: true });
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if(parts.length === 2 && parts[0] === 'api' && parts[1].startsWith('financials')){
      // support /api/financials: symbol as query ?symbol= or route /api/financials/AAPL
    }
    if(parts[0] === 'api' && parts[1] === 'financials'){
      const symbol = parts[2] || url.searchParams.get('symbol');
      if(!symbol){ return sendJson(res, 400, { error: 'symbol missing' }); }
      // Try cache first
      const cached = getCached(symbol);
      if(cached){
        return sendJson(res, 200, { source: 'cache', ageHours: cached.ageHours, data: cached.data });
      }
      // Fetch from Alpha Vantage
      try{
        const data = await fetchOverview(symbol);
        setCache(symbol, data);
        return sendJson(res, 200, { source: 'alpha', data });
      }catch(err){
        if(err && err.code){
          return sendJson(res, err.code === 429 ? 429 : 502, { error: err.message });
        }
        return sendJson(res, 502, { error: 'Unknown error fetching data' });
      }
    }
    // fallback
    sendJson(res, 404, { error: 'Not found' });
  }catch(e){
    sendJson(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Capitovo proxy listening on http://localhost:${PORT}`);
});
