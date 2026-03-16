const { formatAsset, fetchBrazilQuotes, fetchGlobalQuotes, enrichEwzExtended } = require('./providers');
const { computeIndiceRadar } = require('./radar');
const { getEventsSnapshot } = require('./events');
const { MARKET_CACHE_TTL_MS } = require('../../config/env');

const quoteCache = {
  value: null,
  lastSuccess: null,
  expiresAt: 0,
  inflight: null
};

async function buildMarketSnapshot() {
  const [brazil, global] = await Promise.all([
    fetchBrazilQuotes(),
    fetchGlobalQuotes()
  ]);

  const ewz = await enrichEwzExtended(global.EWZ ?? null);

  const payload = {
    PETR4: brazil.PETR4 ?? formatAsset(),
    VALE3: brazil.VALE3 ?? formatAsset(),
    IFNC: brazil.IFNC ?? formatAsset(),
    ICON: brazil.ICON ?? formatAsset(),
    DI1FUT: brazil.DI1FUT ?? formatAsset(),
    EWZ: ewz ?? formatAsset(),
    VIX: global.VIX ?? formatAsset(),
    DXY: global.DXY ?? formatAsset()
  };

  payload.indiceRadar = computeIndiceRadar(payload);
  payload.meta = {
    generatedAt: new Date().toISOString(),
    cacheTtlMs: MARKET_CACHE_TTL_MS,
    sourceMode: 'live'
  };

  return payload;
}

async function getMarketSnapshot() {
  const now = Date.now();

  if (quoteCache.value && quoteCache.expiresAt > now) {
    return quoteCache.value;
  }

  if (quoteCache.inflight) {
    return quoteCache.inflight;
  }

  quoteCache.inflight = buildMarketSnapshot()
    .then((snapshot) => {
      quoteCache.value = snapshot;
      quoteCache.lastSuccess = snapshot;
      quoteCache.expiresAt = Date.now() + MARKET_CACHE_TTL_MS;
      return snapshot;
    })
    .catch((error) => {
      if (quoteCache.lastSuccess) {
        return {
          ...quoteCache.lastSuccess,
          meta: {
            ...(quoteCache.lastSuccess.meta || {}),
            generatedAt: new Date().toISOString(),
            sourceMode: 'cached-fallback',
            stale: true,
            error: error.message
          }
        };
      }
      throw error;
    })
    .finally(() => {
      quoteCache.inflight = null;
    });

  return quoteCache.inflight;
}

module.exports = {
  getMarketSnapshot,
  getEventsSnapshot
};
