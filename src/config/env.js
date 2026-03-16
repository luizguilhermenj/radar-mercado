const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  ROOT_DIR,
  PORT: toNumber(process.env.PORT, 3000),
  SESSION_SECRET: process.env.SESSION_SECRET || 'troque-esta-chave-em-producao',
  MASTER_USERNAME: process.env.MASTER_USERNAME || 'luizaotrader',
  MASTER_PASSWORD: process.env.MASTER_PASSWORD || '010918@Gui',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  MARKET_CACHE_TTL_MS: toNumber(process.env.MARKET_CACHE_TTL_MS, 4000),
  MARKET_REQUEST_TIMEOUT_MS: toNumber(process.env.MARKET_REQUEST_TIMEOUT_MS, 8000)
};
