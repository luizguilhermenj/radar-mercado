const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'auth.db'));

const MASTER_USERNAME = 'luizaotrader';
const MASTER_PASSWORD = '010918@Gui';
const SESSION_SECRET = process.env.SESSION_SECRET || 'troque-esta-chave-em-producao';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 12
  }
}));
app.use(express.static(__dirname, { index: false }));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'subscriber',
      active INTEGER NOT NULL DEFAULT 1,
      plan TEXT NOT NULL DEFAULT 'monthly',
      expires_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const columns = db.prepare(`PRAGMA table_info(users)`).all().map(c => c.name);
  if (!columns.includes('plan')) db.exec(`ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'monthly';`);
  if (!columns.includes('expires_at')) db.exec(`ALTER TABLE users ADD COLUMN expires_at TEXT;`);

  const existingMaster = db.prepare('SELECT id FROM users WHERE username = ?').get(MASTER_USERNAME);
  if (!existingMaster) {
    const hash = bcrypt.hashSync(MASTER_PASSWORD, 10);
    db.prepare('INSERT INTO users (username, password_hash, role, active, plan, expires_at, created_at) VALUES (?, ?, ?, 1, ?, ?, ?)')
      .run(MASTER_USERNAME, hash, 'master', 'master', null, new Date().toISOString());
    console.log(`[AUTH] Usuário master criado: ${MASTER_USERNAME}`);
  }
}

initDb();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function requirePageAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireMaster(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.session.user.role !== 'master') return res.status(403).json({ error: 'Acesso restrito ao master' });
  next();
}

function requireMasterPage(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'master') return res.redirect('/app');
  next();
}

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
  const body = { symbols: { tickers }, columns: ['close', 'change', 'low', 'high'] };
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

function computeIndiceRadar(payload) {
  const buySignals = [];
  const sellSignals = [];

  const addSignal = (condition, inverseCondition, weight) => {
    if (condition) buySignals.push(weight);
    else if (inverseCondition) sellSignals.push(weight);
  };

  addSignal((payload.PETR4?.change ?? 0) > 0, (payload.PETR4?.change ?? 0) < 0, 14);
  addSignal((payload.VALE3?.change ?? 0) > 0, (payload.VALE3?.change ?? 0) < 0, 14);
  addSignal((payload.IFNC?.change ?? 0) > 0, (payload.IFNC?.change ?? 0) < 0, 12);
  addSignal((payload.ICON?.change ?? 0) > 0, (payload.ICON?.change ?? 0) < 0, 8);
  addSignal((payload.EWZ?.change ?? 0) > 0, (payload.EWZ?.change ?? 0) < 0, 12);
  addSignal((payload.VIX?.change ?? 0) < 0, (payload.VIX?.change ?? 0) > 0, 16);
  addSignal((payload.DXY?.change ?? 0) < 0, (payload.DXY?.change ?? 0) > 0, 12);
  addSignal((payload.DI1FUT?.change ?? 0) < 0, (payload.DI1FUT?.change ?? 0) > 0, 12);

  const buyScore = buySignals.reduce((a, b) => a + b, 0);
  const sellScore = sellSignals.reduce((a, b) => a + b, 0);
  const total = Math.max(1, buyScore + sellScore);
  const bullPercent = clamp(Math.round((buyScore / total) * 100), 0, 100);
  const bearPercent = 100 - bullPercent;

  let bias = 'neutro';
  if (bullPercent >= 57) bias = 'compra de índice';
  else if (bearPercent >= 57) bias = 'venda de índice';

  const riskMode = (payload.VIX?.change ?? 0) > 0 ? 'Risk-off' : (payload.VIX?.change ?? 0) < 0 ? 'Risk-on' : 'Neutro';
  const quickRead = bias === 'compra de índice'
    ? { title: 'Fluxo pró-risco', text: 'Leitura favorece compra do índice, com maior apoio entre Brasil, setores e risco global.' }
    : bias === 'venda de índice'
      ? { title: 'Fluxo defensivo', text: 'Leitura favorece venda do índice, com pressão de risco, dólar e/ou curva.' }
      : { title: 'Fluxo misto', text: 'O radar está equilibrado e sem dominância clara entre compradores e vendedores.' };

  const resumoOperacional = bias === 'compra de índice'
    ? { title: 'Prioridade compradora', text: 'Buscar compras em pullback, evitando perseguição em esticadas.' }
    : bias === 'venda de índice'
      ? { title: 'Prioridade vendedora', text: 'Buscar vendas em repique e respeitar possíveis reversões rápidas.' }
      : { title: 'Contexto neutro', text: 'Menor convicção. Operar seletivamente e reduzir agressividade.' };

  return {
    bullPercent,
    bearPercent,
    bias,
    conviction: Math.max(bullPercent, bearPercent),
    riskMode,
    tactical: {
      brasilScore: Math.round(((payload.PETR4?.change ?? 0) + (payload.VALE3?.change ?? 0) + (payload.IFNC?.change ?? 0) + (payload.ICON?.change ?? 0)) * 10) / 10,
      globalScore: Math.round((((payload.EWZ?.change ?? 0) * 0.8) + ((payload.VIX?.change ?? 0) * -1) + ((payload.DXY?.change ?? 0) * -1)) * 10) / 10
    },
    quickRead,
    resumoOperacional
  };
}

function buildMockEvents() {
  return [
    { time: '09:00', event: 'Produção Industrial', country: 'BR', countryFlag: '🇧🇷', impact: 2, forecast: '0.4%', actual: '0.6%' },
    { time: '09:30', event: 'Non Farm Payroll', country: 'US', countryFlag: '🇺🇸', impact: 3, forecast: '210K', actual: null },
    { time: '11:00', event: 'Oil Inventories', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '-2.1M', actual: null },
    { time: '15:00', event: 'Fed Speech', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '--', actual: null }
  ];
}

function formatUserRow(u) {
  return {
    ...u,
    active: !!u.active,
    created_at: u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '--',
    expires_at: u.expires_at ? new Date(u.expires_at).toLocaleDateString('pt-BR') : '--'
  };
}

app.get('/', (req, res) => res.redirect(req.session.user ? '/app' : '/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/app', requirePageAuth, (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/admin', requireMasterPage, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  const dbUser = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users WHERE id = ?').get(req.session.user.id);
  if (!dbUser || !dbUser.active) {
    req.session.destroy(() => res.status(401).json({ error: 'Sessão inválida' }));
    return;
  }
  res.json(formatUserRow(dbUser));
});

app.post('/api/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha.' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  if (!user.active) return res.status(403).json({ error: 'Usuário inativo. Fale com o administrador.' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ ok: true, username: user.username, role: user.role });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/users', requireMaster, (req, res) => {
  const users = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users ORDER BY id ASC').all();
  res.json(users.map(formatUserRow));
});

app.post('/api/users', requireMaster, (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const role = req.body.role === 'master' ? 'master' : 'subscriber';
  const plan = ['monthly', 'quarterly', 'lifetime', 'trial', 'master'].includes(req.body.plan) ? req.body.plan : 'monthly';
  const expiresAt = req.body.expires_at ? new Date(req.body.expires_at).toISOString() : null;
  if (username.length < 3) return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 caracteres.' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha precisa ter pelo menos 6 caracteres.' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Este usuário já existe.' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, role, active, plan, expires_at, created_at) VALUES (?, ?, ?, 1, ?, ?, ?)').run(username, hash, role, plan, expiresAt, new Date().toISOString());
  res.status(201).json({ id: result.lastInsertRowid, username, role, active: true, plan, expires_at: expiresAt });
});

app.put('/api/users/:id', requireMaster, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const username = String(req.body.username || user.username).trim();
  const role = req.body.role === 'master' ? 'master' : 'subscriber';
  const active = req.body.active === false || req.body.active === 'false' || req.body.active === 0 || req.body.active === '0' ? 0 : 1;
  const plan = ['monthly', 'quarterly', 'lifetime', 'trial', 'master'].includes(req.body.plan) ? req.body.plan : (user.plan || 'monthly');
  const expiresAt = req.body.expires_at ? new Date(req.body.expires_at).toISOString() : null;
  const password = String(req.body.password || '');

  if (username.length < 3) return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 caracteres.' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ? AND id <> ?').get(username, id);
  if (exists) return res.status(409).json({ error: 'Já existe outro usuário com este login.' });
  if (user.id === req.session.user.id && active === 0) return res.status(400).json({ error: 'Não é possível desativar o próprio usuário logado.' });

  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Nova senha precisa ter pelo menos 6 caracteres.' });
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET username = ?, password_hash = ?, role = ?, active = ?, plan = ?, expires_at = ? WHERE id = ?')
      .run(username, hash, role, active, plan, expiresAt, id);
  } else {
    db.prepare('UPDATE users SET username = ?, role = ?, active = ?, plan = ?, expires_at = ? WHERE id = ?')
      .run(username, role, active, plan, expiresAt, id);
  }

  if (user.id === req.session.user.id) {
    req.session.user = { id: user.id, username, role };
  }

  const updated = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users WHERE id = ?').get(id);
  res.json(formatUserRow(updated));
});

app.post('/api/users/:id/toggle', requireMaster, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT id, username, role, active FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (user.id === req.session.user.id) return res.status(400).json({ error: 'Não é possível desativar o próprio usuário logado.' });
  const next = user.active ? 0 : 1;
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(next, id);
  res.json({ ok: true, id, active: !!next });
});

app.get('/api/events', requireAuth, (req, res) => {
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

app.get('/api/quotes', requireAuth, async (req, res) => {
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
    payload.indiceRadar = computeIndiceRadar(payload);
    res.json(payload);
  } catch (error) {
    console.error('Erro em /api/quotes:', error.message);
    res.status(500).json({ error: 'Falha ao consultar mercado.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
