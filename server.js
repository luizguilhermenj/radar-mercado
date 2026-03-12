const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname));

function num(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

async function postScanner(url, tickers) {
  const body = {
    symbols: { tickers },
    columns: ['close', 'change', 'low', 'high']
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Scanner HTTP ${response.status}`);
  return response.json();
}

async function fetchBrazil() {
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
    if (symbol) result[symbol] = buildAssetFromRow(item);
  }
  return result;
}

async function fetchGlobal() {
  const json = await postScanner('https://scanner.tradingview.com/global/scan', [
    'AMEX:EWZ',
    'TVC:VIX',
    'TVC:DXY'
  ]);
  const result = {};
  for (const item of json.data || []) {
    const symbol = item.s?.split(':')[1];
    if (symbol) result[symbol] = buildAssetFromRow(item);
  }
  return result;
}

async function enrichEwzExtended(ewz) {
  if (!ewz) return null;
  try {
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/EWZ?region=US&lang=en-US&includePrePost=true&interval=1m&range=1d');
    if (!response.ok) return ewz;
    const meta = (await response.json())?.chart?.result?.[0]?.meta;
    if (!meta) return ewz;
    const regular = num(meta.regularMarketPrice, null);
    const prePrice = meta.preMarketPrice != null ? Number(meta.preMarketPrice) : null;
    const postPrice = meta.postMarketPrice != null ? Number(meta.postMarketPrice) : null;
    const preChange = prePrice != null && regular ? ((prePrice - regular) / regular) * 100 : null;
    const postChange = postPrice != null && regular ? ((postPrice - regular) / regular) * 100 : null;
    return { ...ewz, pre_price: prePrice, pre_change: preChange, post_price: postPrice, post_change: postChange };
  } catch {
    return ewz;
  }
}

function calcDirectionalScore(change, up = 1, down = 1) {
  const v = num(change, 0);
  if (v > 1.5) return 2 * up;
  if (v > 0.5) return 1 * up;
  if (v > 0.1) return 0.5 * up;
  if (v < -1.5) return -2 * down;
  if (v < -0.5) return -1 * down;
  if (v < -0.1) return -0.5 * down;
  return 0;
}
function scoreVix(price, change) {
  let score = 0;
  price = num(price, 0); change = num(change, 0);
  if (price >= 30) score -= 4; else if (price >= 25) score -= 3; else if (price >= 22) score -= 2; else if (price >= 19) score -= 1; else if (price <= 15) score += 1;
  if (change >= 5) score -= 3; else if (change >= 2) score -= 2; else if (change >= 0.7) score -= 1; else if (change <= -5) score += 3; else if (change <= -2) score += 2; else if (change <= -0.7) score += 1;
  return score;
}
function scoreDxy(price, change) {
  let score = 0;
  price = num(price, 0); change = num(change, 0);
  if (price >= 106) score -= 2; else if (price >= 103) score -= 1; else if (price <= 100) score += 0.5;
  if (change >= 0.7) score -= 3; else if (change >= 0.3) score -= 2; else if (change >= 0.1) score -= 1; else if (change <= -0.7) score += 3; else if (change <= -0.3) score += 2; else if (change <= -0.1) score += 1;
  return score;
}
function scoreDi(change) {
  change = num(change, 0);
  if (change >= 1.5) return -3;
  if (change >= 0.7) return -2;
  if (change >= 0.2) return -1;
  if (change <= -1.5) return 3;
  if (change <= -0.7) return 2;
  if (change <= -0.2) return 1;
  return 0;
}
function buildIndiceRadar(data) {
  const macroScore = scoreVix(data.vixPrice, data.vixChange) + scoreDxy(data.dxyPrice, data.dxyChange) + calcDirectionalScore(data.ewzChange, 1.5, 1.5);
  const brasilScore = scoreDi(data.diChange) + calcDirectionalScore(data.ifncChange, 1.5, 1.5) + calcDirectionalScore(data.iconChange, 1.2, 1.2);
  const leaders = calcDirectionalScore(data.petrChange, 2.2, 2.2) + calcDirectionalScore(data.valeChange, 2.0, 2.0);
  const total = clamp(macroScore + brasilScore + leaders, -20, 20);
  const bullPercent = Math.round(((total + 20) / 40) * 100);
  const bearPercent = 100 - bullPercent;
  const conviction = Math.min(100, Math.round(Math.abs(total) * 5));
  let bias = 'neutro', quickTitle = 'Ambiente equilibrado', quickText = 'Os vetores estão mistos. O índice pede confirmação antes de favorecer compras ou vendas.', resumoTitle = 'Cenário misto', resumoText = 'Sem vantagem clara. Vale esperar confirmação de fluxo antes de aumentar a agressividade.', riskMode = 'Neutro';
  if (total >= 8) { bias = 'compra'; quickTitle = 'Ambiente favorável à compra do índice'; quickText = 'O radar mostra predominância compradora. Com risco controlado e pesos do índice sustentando, o mercado tende a aceitar compras com mais fluidez.'; resumoTitle = 'Cenário favorece compras'; resumoText = 'Priorize compras em pullback, rompimento ou defesa de suporte. Evite insistir em venda contra fluxo.'; riskMode = 'Risco controlado'; }
  else if (total >= 3) { bias = 'compra-moderada'; quickTitle = 'Leve vantagem compradora'; quickText = 'Há sustentação para compras, mas ainda sem domínio total. O ideal é buscar entradas seletivas e respeitar contexto.'; resumoTitle = 'Compras seletivas'; resumoText = 'O índice pode aceitar continuidade de alta, mas sem espaço para afobação.'; riskMode = 'Risco sob controle'; }
  else if (total <= -8) { bias = 'venda'; quickTitle = 'Ambiente favorável à venda do índice'; quickText = 'O radar mostra aumento de pressão vendedora. Com dólar e volatilidade pesando, o mercado tende a perder fluidez compradora.'; resumoTitle = 'Cenário pede cautela compradora'; resumoText = 'Priorize vendas em repique, rejeição de resistência ou perda de suporte.'; riskMode = 'Risco alto'; }
  else if (total <= -3) { bias = 'venda-moderada'; quickTitle = 'Leve pressão vendedora no índice'; quickText = 'O ambiente ficou menos amigável para compra. Ainda não é domínio total dos vendedores, mas o contexto já pede mais cautela.'; resumoTitle = 'Venda seletiva / cautela nas compras'; resumoText = 'Compras só com gatilho muito limpo; vendas ganham vantagem tática.'; riskMode = 'Risco moderado'; }
  return { bias, bullPercent, bearPercent, conviction, riskMode, quickRead: { title: quickTitle, text: quickText }, resumoOperacional: { title: resumoTitle, text: resumoText }, tactical: { brasilScore: Number((leaders + brasilScore).toFixed(2)), globalScore: Number(macroScore.toFixed(2)), riskScore: Number(total.toFixed(2)) } };
}

function buildMockEvents() {
  return [
    { time: '08:30', event: 'CPI', country: 'US', countryFlag: '🇺🇸', impact: 3, forecast: '3.2%', actual: '3.0%' },
    { time: '09:15', event: 'ADP Employment', country: 'US', countryFlag: '🇺🇸', impact: 3, forecast: '150K', actual: '180K' },
    { time: '09:30', event: 'Non Farm Payroll', country: 'US', countryFlag: '🇺🇸', impact: 3, forecast: '210K', actual: null },
    { time: '11:00', event: 'Oil Inventories', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '-2.1M', actual: null },
    { time: '15:00', event: 'Fed Speech', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '--', actual: null }
  ];
}

app.get('/api/events', (req, res) => {
  const now = new Date();
  const withTime = buildMockEvents().map((event) => {
    const [hours, minutes] = String(event.time || '00:00').split(':').map(Number);
    const eventDate = new Date(now);
    eventDate.setHours(hours || 0, minutes || 0, 0, 0);
    return { ...event, eventDate };
  });
  const upcoming = withTime.filter(e => e.eventDate >= now).sort((a, b) => a.eventDate - b.eventDate).slice(0, 3).map(({ eventDate, ...event }) => event);
  const released = withTime.filter(e => e.eventDate < now).sort((a, b) => b.eventDate - a.eventDate).slice(0, 5).map(({ eventDate, ...event }) => event);
  res.json({ upcoming, released, mode: 'mock' });
});

app.get('/api/quotes', async (req, res) => {
  try {
    const [brazil, global] = await Promise.all([fetchBrazil(), fetchGlobal()]);
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
    payload.indiceRadar = buildIndiceRadar({
      vixPrice: payload.VIX.price, vixChange: payload.VIX.change,
      dxyPrice: payload.DXY.price, dxyChange: payload.DXY.change,
      diChange: payload.DI1FUT.change, ewzChange: payload.EWZ.change,
      petrChange: payload.PETR4.change, valeChange: payload.VALE3.change,
      ifncChange: payload.IFNC.change, iconChange: payload.ICON.change
    });
    res.json(payload);
  } catch (error) {
    console.error('Erro em /api/quotes:', error);
    res.status(500).json({ error: 'Falha ao montar radar', details: error.message });
  }
});

app.listen(PORT, () => console.log(`Radar rodando em http://localhost:${PORT}`));
