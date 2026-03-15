(() => {
  const assets = [
    { key: 'PETR4', tag: 'Brasil' },
    { key: 'VALE3', tag: 'Brasil' },
    { key: 'ICON', tag: 'Consumo' },
    { key: 'IFNC', tag: 'Financeiro' },
    { key: 'JUROS', tag: 'Curva' },
    { key: 'EWZ', tag: 'ADR / ETF' },
    { key: 'VIX', tag: 'Volatilidade' },
    { key: 'DXY', tag: 'Dólar' }
  ];

  const scenarios = [
    {
      title: 'Mercado em observação',
      text: 'Os sinais ainda estão mistos. O radar observa quem vai assumir o controle antes de acelerar a leitura do WIN.',
      trendLabel: 'Mercado em observação',
      direction: 'Neutra',
      conviction: 54,
      flow: 'Misto',
      directionText: 'Observação',
      drivers: 'Ativos divergentes',
      read: 'Mista',
      graphColor: '#a9b6cf',
      targetDelta: 12,
      pills: ['Contexto em formação', 'Sem dominância clara', 'Índice lateral'],
      summaryGlobal: [
        ['EWZ', '+0.18%', 'up', 'ADR levemente pró-risco'],
        ['VIX', '-0.08%', 'flat', 'Volatilidade ainda comportada'],
        ['DXY', '+0.04%', 'flat', 'Dólar sem pressão decisiva']
      ],
      summaryBr: [
        ['PETR4', '+0.22%', 'up', 'Petróleo sustentando'],
        ['VALE3', '-0.11%', 'down', 'Mineração sem direção'],
        ['JUROS', '+0.03%', 'flat', 'Curva praticamente estável']
      ],
      assetData: {
        PETR4: { price: '44.82', change: '+0.22%', dir: 'up', read: 'Compradores discretos' },
        VALE3: { price: '78.14', change: '-0.11%', dir: 'down', read: 'Oferta ainda contida' },
        ICON: { price: '3.106', change: '+0.34%', dir: 'up', read: 'Consumo ajudando' },
        IFNC: { price: '18.952', change: '+0.28%', dir: 'up', read: 'Financeiro sustentando' },
        JUROS: { price: '12.16', change: '+0.03%', dir: 'flat', read: 'Curva neutra' },
        EWZ: { price: '35.58', change: '+0.18%', dir: 'up', read: 'ADR sem estresse' },
        VIX: { price: '14.76', change: '-0.08%', dir: 'flat', read: 'Volatilidade leve' },
        DXY: { price: '103.41', change: '+0.04%', dir: 'flat', read: 'Dólar neutro' }
      }
    },
    {
      title: 'Fluxo comprador sincronizado',
      text: 'PETR4, VALE3, setores e EWZ começam a confirmar risco. O VIX alivia e o radar libera leitura compradora para o índice.',
      trendLabel: 'Fluxo comprador armado',
      direction: 'Compra de WIN',
      conviction: 79,
      flow: 'Comprador',
      directionText: 'Alta provável',
      drivers: 'PETR4, VALE3, EWZ e VIX',
      read: 'Pró-risco',
      graphColor: '#2be97c',
      targetDelta: 340,
      pills: ['VIX em alívio', 'Brasil pró-risco', 'Índice acompanhando'],
      summaryGlobal: [
        ['EWZ', '+1.42%', 'up', 'ADR confirmando apetite'],
        ['VIX', '-1.18%', 'up', 'Risco cedendo'],
        ['DXY', '-0.42%', 'up', 'Dólar favorece bolsa']
      ],
      summaryBr: [
        ['PETR4', '+1.38%', 'up', 'Energia liderando'],
        ['VALE3', '+1.12%', 'up', 'Mineração confirmando'],
        ['JUROS', '-0.24%', 'up', 'Curva ajuda a bolsa']
      ],
      assetData: {
        PETR4: { price: '45.67', change: '+1.38%', dir: 'up', read: 'Pressão compradora' },
        VALE3: { price: '79.11', change: '+1.12%', dir: 'up', read: 'Força pró-alta' },
        ICON: { price: '3.145', change: '+0.86%', dir: 'up', read: 'Consumo responde' },
        IFNC: { price: '19.084', change: '+0.94%', dir: 'up', read: 'Financeiro acelera' },
        JUROS: { price: '11.92', change: '-0.24%', dir: 'up', read: 'Curva aliviando' },
        EWZ: { price: '36.09', change: '+1.42%', dir: 'up', read: 'ADR impulsionando' },
        VIX: { price: '13.41', change: '-1.18%', dir: 'up', read: 'Vol em queda' },
        DXY: { price: '102.88', change: '-0.42%', dir: 'up', read: 'Dólar ajuda risco' }
      }
    },
    {
      title: 'Fluxo defensivo dominando',
      text: 'VIX e DXY sobem, a curva pesa e os pesos do índice enfraquecem. O radar vira a mão e o WIN perde tração rapidamente.',
      trendLabel: 'Pressão vendedora dominante',
      direction: 'Venda de WIN',
      conviction: 83,
      flow: 'Defensivo',
      directionText: 'Queda provável',
      drivers: 'DXY, VIX e curva',
      read: 'Risk-off',
      graphColor: '#ff626c',
      targetDelta: -390,
      pills: ['Dólar forte', 'Volatilidade em alta', 'Curva pressionando'],
      summaryGlobal: [
        ['EWZ', '-1.16%', 'down', 'ADR perdendo força'],
        ['VIX', '+1.84%', 'down', 'Proteção aumentando'],
        ['DXY', '+0.76%', 'down', 'Dólar pressionando']
      ],
      summaryBr: [
        ['PETR4', '-1.04%', 'down', 'Energia cedendo'],
        ['VALE3', '-1.22%', 'down', 'Mineração piora'],
        ['JUROS', '+0.37%', 'down', 'Curva atrapalhando']
      ],
      assetData: {
        PETR4: { price: '44.07', change: '-1.04%', dir: 'down', read: 'Oferta dominante' },
        VALE3: { price: '77.21', change: '-1.22%', dir: 'down', read: 'Pressão vendedora' },
        ICON: { price: '3.051', change: '-0.95%', dir: 'down', read: 'Consumo recua' },
        IFNC: { price: '18.742', change: '-1.31%', dir: 'down', read: 'Financeiro pesa' },
        JUROS: { price: '12.53', change: '+0.37%', dir: 'down', read: 'Curva abrindo' },
        EWZ: { price: '35.02', change: '-1.16%', dir: 'down', read: 'ADR acompanha queda' },
        VIX: { price: '15.92', change: '+1.84%', dir: 'down', read: 'Volatilidade acesa' },
        DXY: { price: '104.12', change: '+0.76%', dir: 'down', read: 'Dólar fortalece defesa' }
      }
    }
  ];

  const state = {
    scenarioIndex: 0,
    lastScenarioChange: performance.now(),
    transitionMs: 2600,
    reactionDelayMs: 700,
    scenarioDurationMs: 6200,
    basePrice: 126430,
    currentPrice: 126430,
    fromPrice: 126430,
    toPrice: 126442,
    series: [],
    lastTs: performance.now(),
    assetTimers: []
  };

  const assetGrid = document.getElementById('assetGrid');
  const globalSummary = document.getElementById('globalSummary');
  const brSummary = document.getElementById('brSummary');
  const scenarioTitle = document.getElementById('scenarioTitle');
  const scenarioText = document.getElementById('scenarioText');
  const readingPills = document.getElementById('readingPills');
  const conditionFlow = document.getElementById('conditionFlow');
  const conditionDirection = document.getElementById('conditionDirection');
  const conditionDrivers = document.getElementById('conditionDrivers');
  const conditionConviction = document.getElementById('conditionConviction');
  const trendChip = document.getElementById('trendChip');
  const chartDirection = document.getElementById('chartDirection');
  const chartConviction = document.getElementById('chartConviction');
  const chartRead = document.getElementById('chartRead');
  const chartPrice = document.getElementById('chartPrice');
  const canvas = document.getElementById('winChart');
  const ctx = canvas.getContext('2d');

  function buildAssetCards() {
    assetGrid.innerHTML = assets.map(asset => `
      <article class="asset-card" id="asset-${asset.key}">
        <div class="asset-top">
          <div class="asset-name">${asset.key}</div>
          <div class="asset-tag">${asset.tag}</div>
        </div>
        <div class="asset-price" data-role="price">--</div>
        <div class="asset-change flat" data-role="change">--</div>
        <div class="asset-reading" data-role="reading">Aguardando leitura</div>
      </article>
    `).join('');
  }

  function summaryItemHtml([label, value, dir, desc]) {
    return `
      <div class="sidebar-item">
        <div>
          <div class="sidebar-item-label">${label}</div>
          <small>${desc}</small>
        </div>
        <div class="summary-value ${dir}">${value}</div>
      </div>
    `;
  }

  function clearAssetTimers() {
    state.assetTimers.forEach(timer => clearTimeout(timer));
    state.assetTimers = [];
  }

  function setAssetNeutral(card) {
    const changeEl = card.querySelector('[data-role="change"]');
    card.classList.remove('is-up', 'is-down', 'is-focus');
    changeEl.classList.remove('up', 'down', 'flat');
    changeEl.classList.add('flat');
  }

  function applyScenario(index) {
    const scenario = scenarios[index];
    scenarioTitle.textContent = scenario.title;
    scenarioText.textContent = scenario.text;
    trendChip.textContent = scenario.trendLabel;
    chartDirection.textContent = scenario.direction;
    chartConviction.textContent = `${scenario.conviction}%`;
    chartRead.textContent = scenario.read;
    conditionFlow.textContent = scenario.flow;
    conditionDirection.textContent = scenario.directionText;
    conditionDrivers.textContent = scenario.drivers;
    conditionConviction.textContent = `${scenario.conviction}%`;

    readingPills.innerHTML = scenario.pills.map(text => `<span class="reading-pill">${text}</span>`).join('');
    globalSummary.innerHTML = scenario.summaryGlobal.map(summaryItemHtml).join('');
    brSummary.innerHTML = scenario.summaryBr.map(summaryItemHtml).join('');

    clearAssetTimers();
    assets.forEach(asset => {
      const card = document.getElementById(`asset-${asset.key}`);
      const data = scenario.assetData[asset.key];
      card.querySelector('[data-role="price"]').textContent = data.price;
      card.querySelector('[data-role="reading"]').textContent = 'Monitorando correlação';
      card.querySelector('[data-role="change"]').textContent = '--';
      setAssetNeutral(card);
    });

    const focusKeys = index === 1 ? ['PETR4', 'VALE3', 'EWZ', 'VIX'] : index === 2 ? ['DXY', 'VIX', 'JUROS', 'IFNC'] : ['PETR4', 'IFNC'];

    assets.forEach((asset, i) => {
      const timer = setTimeout(() => {
        const card = document.getElementById(`asset-${asset.key}`);
        const data = scenario.assetData[asset.key];
        const changeEl = card.querySelector('[data-role="change"]');
        card.querySelector('[data-role="reading"]').textContent = data.read;
        changeEl.textContent = data.change;
        changeEl.classList.remove('up', 'down', 'flat');
        if (data.dir === 'up') {
          card.classList.add('is-up');
          changeEl.classList.add('up');
        } else if (data.dir === 'down') {
          card.classList.add('is-down');
          changeEl.classList.add('down');
        } else {
          changeEl.classList.add('flat');
        }
        if (focusKeys.includes(asset.key)) card.classList.add('is-focus');
      }, 140 + (i * 160));
      state.assetTimers.push(timer);
    });

    state.fromPrice = state.currentPrice;
    state.toPrice = state.basePrice + scenario.targetDelta;
    chartPrice.style.color = scenario.graphColor;
  }

  function seedSeries() {
    state.series = new Array(64).fill(0).map((_, idx) => ({
      x: idx,
      y: state.basePrice + Math.sin(idx / 9) * 4
    }));
  }

  function drawGrid(width, height, padding) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = padding.top + ((height - padding.top - padding.bottom) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i += 1) {
      const x = padding.left + ((width - padding.left - padding.right) / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawChart() {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const padding = { top: 26, right: 26, bottom: 34, left: 26 };
    drawGrid(width, height, padding);

    const values = state.series.map(point => point.y);
    const min = Math.min(...values) - 40;
    const max = Math.max(...values) + 40;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const scenario = scenarios[state.scenarioIndex];
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, hexToRgba(scenario.graphColor, 0.28));
    gradient.addColorStop(1, hexToRgba(scenario.graphColor, 0));

    ctx.beginPath();
    state.series.forEach((point, idx) => {
      const x = padding.left + (idx / (state.series.length - 1)) * plotWidth;
      const y = padding.top + (1 - ((point.y - min) / (max - min))) * plotHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = width - padding.right;
    ctx.lineTo(lastX, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    state.series.forEach((point, idx) => {
      const x = padding.left + (idx / (state.series.length - 1)) * plotWidth;
      const y = padding.top + (1 - ((point.y - min) / (max - min))) * plotHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = scenario.graphColor;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = hexToRgba(scenario.graphColor, 0.35);
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const lastPoint = state.series[state.series.length - 1];
    const lastY = padding.top + (1 - ((lastPoint.y - min) / (max - min))) * plotHeight;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.fillStyle = scenario.graphColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function hexToRgba(hex, alpha) {
    const parsed = hex.replace('#', '');
    const bigint = Number.parseInt(parsed, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function animate(ts) {
    const dt = Math.min(64, ts - state.lastTs || 16);
    state.lastTs = ts;

    const elapsed = ts - state.lastScenarioChange;
    if (elapsed >= state.scenarioDurationMs) {
      state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
      state.lastScenarioChange = ts;
      applyScenario(state.scenarioIndex);
    }

    const progressStart = Math.max(0, ts - state.lastScenarioChange - state.reactionDelayMs);
    const t = Math.min(1, progressStart / state.transitionMs);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    state.currentPrice = state.fromPrice + (state.toPrice - state.fromPrice) * eased;
    chartPrice.textContent = Math.round(state.currentPrice).toLocaleString('pt-BR');

    const noise = (Math.random() - 0.5) * 2.2;
    const drift = (state.currentPrice - state.series[state.series.length - 1].y) * 0.065;
    const next = state.series[state.series.length - 1].y + drift + noise * (dt / 16);
    state.series.push({ x: state.series.length, y: next });
    if (state.series.length > 64) state.series.shift();

    drawChart();
    requestAnimationFrame(animate);
  }

  buildAssetCards();
  seedSeries();
  applyScenario(0);
  requestAnimationFrame(animate);
})();
