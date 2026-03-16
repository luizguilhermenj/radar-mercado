const { num } = require('../../utils/number');
const { MARKET_REQUEST_TIMEOUT_MS } = require('../../config/env');

function formatAsset(price = null, change = null, extra = {}) {
  return { price, change, ...extra };
}

function buildAssetFromRow(item) {
  const close = item.d?.[0] ?? null;
  const change = item.d?.[1] ?? null;
  const low = item.d?.[2] ?? null;
  const high = item.d?.[3] ?? null;

  let rangePosition = null;
  if (close != null && low != null && high != null && Number(high) !== Number(low)) {
    rangePosition = Number((((Number(close) - Number(low)) / (Number(high) - Number(low))) * 100).toFixed(2));
  }

  return formatAsset(close, change, { low, high, rangePosition });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = MARKET_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function postScanner(url, tickers) {
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbols: { tickers },
      columns: ['close', 'change', 'low', 'high']
    })
  });

  if (!response.ok) {
    throw new Error(`Scanner HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchBrazilQuotes() {
  const json = await postScanner('https://scanner.tradingview.com/brazil/scan', [
    'BMFBOVESPA:PETR4',
    'BMFBOVESPA:VALE3',
    'BMFBOVESPA:IFNC',
    'BMFBOVESPA:ICON',
    'BMFBOVESPA:DI1FUT'
  ]);

  const result = {};
  for (const item of json.data || []) {
    const symbol = item.s?.split(':')[1];
    if (symbol) {
      result[symbol] = buildAssetFromRow(item);
    }
  }

  return result;
}

async function fetchGlobalQuotes() {
  const json = await postScanner('https://scanner.tradingview.com/global/scan', [
    'AMEX:EWZ',
    'TVC:VIX',
    'TVC:DXY'
  ]);

  const result = {};
  for (const item of json.data || []) {
    const symbol = item.s?.split(':')[1];
    if (symbol) {
      result[symbol] = buildAssetFromRow(item);
    }
  }

  return result;
}

async function enrichEwzExtended(ewz) {
  if (!ewz) return null;

  try {
    const response = await fetchWithTimeout('https://query1.finance.yahoo.com/v8/finance/chart/EWZ?region=US&lang=en-US&includePrePost=true&interval=1m&range=1d');
    if (!response.ok) return ewz;

    const meta = (await response.json())?.chart?.result?.[0]?.meta;
    if (!meta) return ewz;

    const regular = num(meta.regularMarketPrice, null);
    const prePrice = meta.preMarketPrice != null ? Number(meta.preMarketPrice) : null;
    const postPrice = meta.postMarketPrice != null ? Number(meta.postMarketPrice) : null;
    const preChange = prePrice != null && regular ? ((prePrice - regular) / regular) * 100 : null;
    const postChange = postPrice != null && regular ? ((postPrice - regular) / regular) * 100 : null;

    return {
      ...ewz,
      pre_price: prePrice,
      pre_change: preChange,
      post_price: postPrice,
      post_change: postChange
    };
  } catch {
    return ewz;
  }
}

module.exports = {
  formatAsset,
  fetchBrazilQuotes,
  fetchGlobalQuotes,
  enrichEwzExtended
};
