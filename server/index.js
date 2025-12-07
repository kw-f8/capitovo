const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Use global fetch available in Node 18+. If not available, developer should
// install node-fetch or run Node >=18.
if (typeof fetch === 'undefined') {
  console.warn('Global fetch is not available in this Node runtime. Please use Node 18+ or install node-fetch.');
}

const app = express();
const PORT = process.env.PORT || 3000;
const FMP_KEY = process.env.FMP_KEY;

if(!FMP_KEY){
  console.warn('Warning: FMP_KEY is not set. The proxy will return 502 for financial requests.');
}

app.use(cors());
app.use(express.json());

// Simple proxy endpoint that aggregates useful endpoints for the frontend
app.get('/api/financials/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if(!FMP_KEY) return res.status(502).json({ error: 'FMP API key not configured on server.' });

  try{
    const base = 'https://financialmodelingprep.com/api/v3';
    const urls = {
      profile: `${base}/profile/${symbol}?apikey=${FMP_KEY}`,
      income: `${base}/income-statement/${symbol}?limit=1&apikey=${FMP_KEY}`,
      cash: `${base}/cash-flow-statement/${symbol}?limit=1&apikey=${FMP_KEY}`,
      ratios: `${base}/ratios-ttm/${symbol}?limit=1&apikey=${FMP_KEY}`
    };

    const [profileR, incomeR, cashR, ratiosR] = await Promise.all([
      fetch(urls.profile),
      fetch(urls.income),
      fetch(urls.cash),
      fetch(urls.ratios)
    ]);

    const [profile, income, cash, ratios] = await Promise.all([
      profileR.ok ? profileR.json() : null,
      incomeR.ok ? incomeR.json() : null,
      cashR.ok ? cashR.json() : null,
      ratiosR.ok ? ratiosR.json() : null
    ]);

    res.json({
      profile: profile || null,
      income: income || null,
      cash: cash || null,
      ratios: ratios || null
    });
  }catch(err){
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy fetch failed', detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`FMP proxy listening on http://localhost:${PORT}`);
});
