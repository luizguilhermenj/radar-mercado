const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const TICKERS = {
  PETR4: 'PETR4.SA',
  VALE3: 'VALE3.SA',
  EWZ: 'EWZ',
  BRENT: 'BZ=F',
  VIX: '^VIX',
};

const REFRESH_INTERVAL_MS = 2000;

let quotesCache = {};
let lastUpdated = null;

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  return value === null ? null : Number(value.toFixed(2));
}

async function fetchQuote(symbol) {
  const quote = await yahooFinance.quote(symbol);

  const price =
    toNumber(quote.regularMarketPrice) ??
    toNumber(quote.postMarketPrice) ??
    toNumber(quote.preMarketPrice);

  const changePercent =
    toNumber(quote.regularMarketChangePercent) ??
    toNumber(quote.postMarketChangePercent) ??
    toNumber(quote.preMarketChangePercent);

  return {
    price: formatNumber(price),
    change: formatNumber(changePercent),
    currency: quote.currency || null,
    marketState: quote.marketState || null,
    sourceSymbol: symbol,
  };
}

async function refreshQuotes() {
  try {
    const entries = await Promise.all(
      Object.entries(TICKERS).map(async ([name, symbol]) => {
        const data = await fetchQuote(symbol);
        return [name, data];
      })
    );

    quotesCache = Object.fromEntries(entries);
    lastUpdated = new Date().toISOString();

    console.log(`[quotes] atualizadas em ${lastUpdated}`);
  } catch (error) {
    console.error('[quotes] erro ao atualizar cotações:', error.message);
  }
}

app.get('/api/quotes', async (req, res) => {
  if (!lastUpdated) {
    await refreshQuotes();
  }

  res.json({
    updatedAt: lastUpdated,
    assets: quotesCache,
  });
});

app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await refreshQuotes();
  setInterval(refreshQuotes, REFRESH_INTERVAL_MS);
});
