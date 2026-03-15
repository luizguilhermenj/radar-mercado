const assetConfigs = [
  { key: 'PETR4', base: 39.84, positiveForIndex: true },
  { key: 'VALE3', base: 62.17, positiveForIndex: true },
  { key: 'ICON', base: 3290, positiveForIndex: true },
  { key: 'IFNC', base: 3514, positiveForIndex: true },
  { key: 'JUROS', base: 10.82, positiveForIndex: false },
  { key: 'EWZ', base: 33.74, positiveForIndex: true },
  { key: 'VIX', base: 15.24, positiveForIndex: false },
  { key: 'DXY', base: 103.42, positiveForIndex: false }
];

const scenarios = [
  {
    name: 'Cenário comprador',
    type: 'bull',
    score: 74,
    drift: 1.8,
    volatility: 2.6,
    macroText: 'VIX e DXY aliviam pressão externa',
    flowText: 'PETR4, VALE3, ICON e IFNC puxam o apetite local',
    biasText: 'Probabilidade compradora no WINFUT',
    values: {
      PETR4: { value: 40.26, change: 1.28 },
      VALE3: { value: 63.03, change: 1.09 },
      ICON: { value: 3336, change: 0.94 },
      IFNC: { value: 3551, change: 1.13 },
      JUROS: { value: 10.71, change: -0.31 },
      EWZ: { value: 34.18, change: 1.42 },
      VIX: { value: 14.78, change: -1.52 },
      DXY: { value: 103.01, change: -0.36 }
    }
  },
  {
    name: 'Cenário neutro',
    type: 'neutral',
    score: 54,
    drift: 0.32,
    volatility: 1.7,
    macroText: 'Fatores mistos mantêm o índice em observação',
    flowText: 'Setores se compensam e reduzem convicção',
    biasText: 'Leitura lateral com viés de definição',
    values: {
      PETR4: { value: 39.92, change: 0.18 },
      VALE3: { value: 62.28, change: 0.07 },
      ICON: { value: 3301, change: 0.11 },
      IFNC: { value: 3517, change: 0.05 },
      JUROS: { value: 10.83, change: 0.04 },
      EWZ: { value: 33.81, change: 0.16 },
      VIX: { value: 15.11, change: 0.09 },
      DXY: { value: 103.36, change: 0.06 }
    }
  },
  {
    name: 'Cenário vendedor',
    type: 'bear',
    score: 31,
    drift: -1.7,
    volatility: 2.7,
    macroText: 'VIX e DXY pressionam o risco global',
    flowText: 'Juros avançam e setores perdem tração doméstica',
    biasText: 'Probabilidade vendedora no WINFUT',
    values: {
      PETR4: { value: 39.11, change: -1.14 },
      VALE3: { value: 61.22, change: -1.03 },
      ICON: { value: 3260, change: -0.92 },
      IFNC: { value: 3476, change: -1.08 },
      JUROS: { value: 10.97, change: 0.38 },
      EWZ: { value: 33.19, change: -1.21 },
      VIX: { value: 16.18, change: 1.74 },
      DXY: { value: 103.94, change: 0.41 }
    }
  }
];

const cardsContainer = document.getElementById('cards');
const scoreValueEl = document.getElementById('scoreValue');
const scoreLabelEl = document.getElementById('scoreLabel');
const scoreFillEl = document.getElementById('scoreFill');
const scorePillEl = document.getElementById('scorePill');
const scenarioBadgeEl = document.getElementById('scenarioBadge');
const macroTextEl = document.getElementById('macroText');
const flowTextEl = document.getElementById('flowText');
const biasTextEl = document.getElementById('biasText');

function formatValue(value) {
  const decimals = value >= 1000 ? 0 : 2;
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatChange(change) {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function getChangeClass(change) {
  if (change > 0.05) return 'green';
  if (change < -0.05) return 'red';
  return 'neutral';
}

function renderCards(values) {
  cardsContainer.innerHTML = '';
  assetConfigs.forEach((asset) => {
    const current = values[asset.key];
    const changeClass = getChangeClass(current.change);
    const directionTag = asset.positiveForIndex ? 'Pró-bolsa' : 'Contra-bolsa';
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top">
        <h3>${asset.key}</h3>
        <span class="card-tag">${directionTag}</span>
      </div>
      <div class="card-value">${formatValue(current.value)}</div>
      <div class="card-change ${changeClass}">${formatChange(current.change)}</div>
    `;
    cardsContainer.appendChild(card);
  });
}

function updateScenarioMeta(scenario) {
  scoreValueEl.textContent = String(scenario.score);
  scoreLabelEl.textContent = scenario.type === 'bull'
    ? 'Fluxo comprador dominante'
    : scenario.type === 'bear'
      ? 'Fluxo vendedor dominante'
      : 'Fluxo equilibrado com baixa convicção';

  scoreValueEl.className = `score-value ${scenario.type}`;
  scorePillEl.className = `score-pill ${scenario.type}`;
  scenarioBadgeEl.className = `chart-badge ${scenario.type}`;

  scorePillEl.textContent = scenario.type === 'bull'
    ? 'BULL'
    : scenario.type === 'bear'
      ? 'BEAR'
      : 'NEUTRAL';

  scenarioBadgeEl.textContent = scenario.name;
  macroTextEl.textContent = scenario.macroText;
  flowTextEl.textContent = scenario.flowText;
  biasTextEl.textContent = scenario.biasText;

  scoreFillEl.style.width = `${scenario.score}%`;
  scoreFillEl.style.background = scenario.type === 'bull'
    ? 'linear-gradient(90deg, #59c2ff, #24df87)'
    : scenario.type === 'bear'
      ? 'linear-gradient(90deg, #ff8b6c, #ff5f72)'
      : 'linear-gradient(90deg, #59c2ff, #ffcc66)';
}

let currentScenarioIndex = 0;
let currentScenario = scenarios[currentScenarioIndex];
renderCards(currentScenario.values);
updateScenarioMeta(currentScenario);

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const DPR = window.devicePixelRatio || 1;
const displayWidth = canvas.width;
const displayHeight = canvas.height;
canvas.width = displayWidth * DPR;
canvas.height = displayHeight * DPR;
ctx.scale(DPR, DPR);

let points = [];
const POINT_COUNT = 90;
let basePrice = 180;
let animFrame = null;

function buildInitialSeries() {
  points = [];
  let value = basePrice;
  for (let i = 0; i < POINT_COUNT; i += 1) {
    value += (Math.random() - 0.5) * 1.8;
    points.push(value);
  }
}

buildInitialSeries();

function lineColorByScenario(type) {
  if (type === 'bull') return '#24df87';
  if (type === 'bear') return '#ff5f72';
  return '#ffcc66';
}

function fillColorByScenario(type) {
  if (type === 'bull') return 'rgba(36, 223, 135, 0.18)';
  if (type === 'bear') return 'rgba(255, 95, 114, 0.18)';
  return 'rgba(255, 204, 102, 0.14)';
}

function updateSeries() {
  const last = points[points.length - 1];
  const noise = (Math.random() - 0.5) * currentScenario.volatility;
  const next = last + currentScenario.drift + noise;
  points.push(next);
  if (points.length > POINT_COUNT) points.shift();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    const y = (displayHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(displayWidth, y);
    ctx.stroke();
  }
  for (let i = 1; i < 9; i += 1) {
    const x = (displayWidth / 9) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, displayHeight);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChart() {
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  drawGrid();

  const min = Math.min(...points) - 6;
  const max = Math.max(...points) + 6;
  const range = Math.max(max - min, 1);
  const stepX = displayWidth / (POINT_COUNT - 1);

  const coords = points.map((point, index) => {
    const x = index * stepX;
    const y = displayHeight - ((point - min) / range) * (displayHeight - 24) - 12;
    return { x, y };
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight);
  gradient.addColorStop(0, fillColorByScenario(currentScenario.type));
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  coords.forEach((coord, index) => {
    if (index === 0) ctx.moveTo(coord.x, coord.y);
    else ctx.lineTo(coord.x, coord.y);
  });
  ctx.lineTo(displayWidth, displayHeight);
  ctx.lineTo(0, displayHeight);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  coords.forEach((coord, index) => {
    if (index === 0) ctx.moveTo(coord.x, coord.y);
    else ctx.lineTo(coord.x, coord.y);
  });
  ctx.strokeStyle = lineColorByScenario(currentScenario.type);
  ctx.lineWidth = 3;
  ctx.shadowBlur = 18;
  ctx.shadowColor = lineColorByScenario(currentScenario.type);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const last = coords[coords.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = lineColorByScenario(currentScenario.type);
  ctx.fill();
}

function tick() {
  updateSeries();
  drawChart();
  animFrame = window.setTimeout(() => requestAnimationFrame(tick), 110);
}

function applyScenario(index) {
  currentScenarioIndex = index;
  currentScenario = scenarios[currentScenarioIndex];
  renderCards(currentScenario.values);
  updateScenarioMeta(currentScenario);
}

applyScenario(0);
drawChart();
tick();

setInterval(() => {
  const nextIndex = (currentScenarioIndex + 1) % scenarios.length;
  applyScenario(nextIndex);
}, 6500);

window.addEventListener('beforeunload', () => {
  if (animFrame) clearTimeout(animFrame);
});
