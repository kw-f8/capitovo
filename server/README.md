# Capitovo Alpha Vantage Proxy

This is a small proxy to keep your Alpha Vantage API key server‑side and provide cached responses to clients.

Requirements
- Node.js >= 18 (recommended because global `fetch` is used)

Quick start

1. Copy `.env.example` to `.env` and set your `ALPHA_VANTAGE_KEY`:

```bash
cp .env.example .env
# edit .env and set ALPHA_VANTAGE_KEY
```

2. Install dependencies and start:

```bash
cd server
npm install
npm start
```

3. The server listens on `http://localhost:3000` by default. Example request:

```
GET http://localhost:3000/api/financials/AAPL
```

Behavior
- The proxy caches responses in memory for `CACHE_TTL_HOURS` (default 24h).
- If the Alpha Vantage API returns an error or rate limit, the proxy returns 429/502 accordingly.
- The proxy sets `Access-Control-Allow-Origin: *` so your static site can call it.

Notes
- For production, run behind a process manager and consider a persistent cache (Redis) to share cache between instances.
