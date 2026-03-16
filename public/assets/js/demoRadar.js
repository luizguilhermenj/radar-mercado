(function () {
  const canvas = document.getElementById('demoChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const assets = {
    PETR4: { price: 39.92, change: 0.18, bias: 1, digits: 2 },
    VALE3: { price: 62.28, change: 0.07, bias: 1, digits: 2 },
    ICON:  { price: 3301,  change: 0.11, bias: 1, digits: 0 },
    IFNC:  { price: 3517,  change: 0.05, bias: 1, digits: 0 },
    JUROS: { price: 10.83, change: 0.04, bias: -1, digits: 2 },
    EWZ:   { price: 33.81, change: 0.16, bias: 1, digits: 2 },
    VIX:   { price: 15.11, change: 0.09, bias: -1, digits: 2 },
    DXY:   { price: 103.36, change: 0.06, bias: -1, digits: 2 }
  };

  const scenarios = {
    bull: {
      scoreRange: [67, 81],
      drift: 0.23,
      volatility: 0.11,
      assetPush: [0.0020, 0.0065],
      texts: {
        score: 'Fluxo comprador dominante',
        macro: 'VIX e DXY aliviam pressão externa',
        flow: 'PETR4, VALE3, ICON e IFNC puxam o apetite local',
        bias: 'Probabilidade compradora no WINFUT',
        pill: 'Cenário comprador',
        radarBias: 'Bull'
      }
    },
    neutral: {
      scoreRange: [45, 57],
      drift: 0.0,
      volatility: 0.05,
      assetPush: [0.0006, 0.0020],
      texts: {
        score: 'Fluxo equilibrado com baixa convicção',
        macro: 'Fatores mistos mantêm o índice em observação',
        flow: 'Setores se compensam e reduzem convicção',
        bias: 'Leitura lateral com viés de definição',
        pill: 'Cenário neutro',
        radarBias: 'Neutral'
      }
    },
    bear: {
      scoreRange: [24, 36],
      drift: -0.23,
      volatility: 0.11,
      assetPush: [0.0020, 0.0065],
      texts: {
        score: 'Pressão defensiva dominante',
        macro: 'Dólar e risco elevam a cautela externa',
        flow: 'Pressão vendedora pesa nos principais vetores locais',
        bias: 'Probabilidade vendedora no WINFUT',
        pill: 'Cenário vendedor',
        radarBias: 'Bear'
      }
    }
  };

  const rotation = [
    { mode: 'neutral', duration: 11000 },
    { mode: 'bull', duration: 14000 },
    { mode: 'neutral', duration: 9000 },
    { mode: 'bear', duration: 14000 },
    { mode: 'neutral', duration: 10000 }
  ];

  const state = {
    rotationIndex: 0,
    scenario: rotation[0].mode,
    scenarioDuration: rotation[0].duration,
    scenarioStartedAt: performance.now(),
    score: 54,
    scoreTarget: 54,
    line: [],
    smoothLine: [],
    lineTargetDrift: 0,
    lastFrame: performance.now(),
    lastScoreTextMode: null,
    lineAccumulator: 0,
    glowPhase: 0
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(from, to, t) {
    return from + (to - from) * t;
  }

  function formatNumber(value, digits = 2) {
    return Number(value).toLocaleString('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatPercent(value) {
    const signal = value > 0 ? '+' : '';
    return `${signal}${value.toFixed(2)}%`;
  }

  function getModeFromScore(score) {
    if (score >= 65) return 'bull';
    if (score <= 35) return 'bear';
    return 'neutral';
  }

  function getModeColor(mode) {
    if (mode === 'bull') return '#20f0a8';
    if (mode === 'bear') return '#ff6b82';
    return '#f7c85d';
  }

  function getModeFill(mode) {
    if (mode === 'bull') return 'rgba(32,240,168,0.18)';
    if (mode === 'bear') return 'rgba(255,107,130,0.18)';
    return 'rgba(247,200,93,0.18)';
  }

  function applyTexts(mode) {
  if (state.lastScoreTextMode === mode) return;
  state.lastScoreTextMode = mode;

  const set = scenarios[mode].texts;

  const radarText = document.getElementById('radarText');
  const macroText = document.getElementById('macroText');
  const flowText = document.getElementById('flowText');
  const indexBiasText = document.getElementById('indexBiasText');
  const scenarioPill = document.getElementById('scenarioPill');
  const radarBias = document.getElementById('radarBias');
  const radarScore = document.getElementById('radarScore');
  const scoreBarFill = document.getElementById('scoreBarFill');

  radarText.textContent = set.score;
  macroText.textContent = set.macro;
  flowText.textContent = set.flow;
  indexBiasText.textContent = set.bias;
  scenarioPill.textContent = set.pill;
  radarBias.textContent = set.radarBias;

  scenarioPill.classList.remove('is-bull', 'is-neutral', 'is-bear');
  radarBias.classList.remove('is-bull', 'is-neutral', 'is-bear');
  radarScore.classList.remove('is-bull', 'is-neutral', 'is-bear');
  scoreBarFill.classList.remove('is-bull', 'is-neutral', 'is-bear');

  if (mode === 'bull') {
    scenarioPill.classList.add('is-bull');
    radarBias.classList.add('is-bull');
    radarScore.classList.add('is-bull');
    scoreBarFill.classList.add('is-bull');
  } else if (mode === 'bear') {
    scenarioPill.classList.add('is-bear');
    radarBias.classList.add('is-bear');
    radarScore.classList.add('is-bear');
    scoreBarFill.classList.add('is-bear');
  } else {
    scenarioPill.classList.add('is-neutral');
    radarBias.classList.add('is-neutral');
    radarScore.classList.add('is-neutral');
    scoreBarFill.classList.add('is-neutral');
  }
}

  function setNextScenario(now) {
    state.rotationIndex = (state.rotationIndex + 1) % rotation.length;
    const item = rotation[state.rotationIndex];
    state.scenario = item.mode;
    state.scenarioDuration = item.duration;
    state.scenarioStartedAt = now;

    const config = scenarios[state.scenario];
    state.scoreTarget = rand(config.scoreRange[0], config.scoreRange[1]);
  }

  function initLine() {
    if (state.line.length) return;

    let base = 100;
    for (let i = 0; i < 74; i += 1) {
      base += rand(-0.05, 0.05);
      state.line.push(base);
    }
    state.smoothLine = [...state.line];
  }

  function updateAssets(mode, dt) {
    const config = scenarios[mode];
    const intensity = mode === 'bull' ? 1 : mode === 'bear' ? -1 : 0;

    Object.entries(assets).forEach(([symbol, asset], idx) => {
      const directional = intensity * asset.bias;
      const microNoise = rand(-0.0018, 0.0018);
      const directionalPush = directional * rand(config.assetPush[0], config.assetPush[1]);
      const speed = 1 + (idx * 0.018);

      asset.change += (directionalPush + microNoise) * dt * 1.35 * speed;
      asset.change = clamp(asset.change, -2.2, 2.2);

      const meanReversion = asset.change * 0.0025 * dt;
      asset.change -= meanReversion;

      const priceMovePct = (asset.change / 100) * 0.0038 * dt * speed;
      asset.price = Math.max(0.1, asset.price * (1 + priceMovePct));

      const priceEl = document.getElementById(`price-${symbol}`);
      const changeEl = document.getElementById(`change-${symbol}`);

      if (priceEl) {
        priceEl.textContent = formatNumber(asset.price, asset.digits);
      }

      if (changeEl) {
        changeEl.textContent = formatPercent(asset.change);
        changeEl.className =
          'asset-change ' +
          (asset.change > 0.05 ? 'up' : asset.change < -0.05 ? 'down' : 'flat');
      }
    });
  }

  function updateScore(dt) {
    state.score = lerp(state.score, state.scoreTarget, 0.0085 * dt * 60);
    state.score = clamp(state.score, 20, 86);

    const rounded = Math.round(state.score);
    document.getElementById('radarScore').textContent = rounded;
    document.getElementById('scoreBarFill').style.width = `${rounded}%`;

    const mode = getModeFromScore(state.score);
    applyTexts(mode);
    return mode;
  }

  function updateLine(mode, dt, now) {
    initLine();

    const config = scenarios[mode];
    state.lineAccumulator += dt;

    if (state.lineAccumulator < 2.55) return;
    state.lineAccumulator = 0;

    const progress = clamp((now - state.scenarioStartedAt) / state.scenarioDuration, 0, 1);
    const driftMultiplier =
      progress < 0.16 ? 0.72 :
      progress < 0.72 ? 1.18 :
      0.82;

    state.lineTargetDrift = lerp(
      state.lineTargetDrift,
      config.drift * driftMultiplier,
      0.06
    );

    const last = state.line[state.line.length - 1];
    const liveNoise = rand(-config.volatility, config.volatility);
    const waveA = Math.sin(now / 3200) * 0.020;
    const waveB = Math.sin(now / 1400) * 0.010;
    const next = clamp(
      last + state.lineTargetDrift + liveNoise + waveA + waveB,
      90,
      112
    );

    state.line.push(next);
    if (state.line.length > 90) state.line.shift();
  }

  function getSmoothedLine() {
    if (!state.smoothLine.length) {
      state.smoothLine = [...state.line];
    }

    state.smoothLine = state.line.map((value, index) => {
      const prev = state.smoothLine[index] ?? value;
      return lerp(prev, value, 0.13);
    });

    return state.smoothLine;
  }

  function drawChart(mode) {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const values = getSmoothedLine();
    const min = Math.min(...values) - 0.8;
    const max = Math.max(...values) + 0.8;
    const stepX = width / Math.max(1, values.length - 1);

    const points = values.map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / (max - min)) * (height - 20) - 10;
      return { x, y };
    });

    const color = getModeColor(mode);
    const fillColor = getModeFill(mode);

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = points[index - 1];
        const midX = prev.x + (point.x - prev.x) * 0.72;
        const midY = prev.y + (point.y - prev.y) * 0.72;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
    });

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);

    state.glowPhase += 0.02;
    const glowPulse = 10 + Math.sin(state.glowPhase) * 2.5;

    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowPulse;
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.shadowBlur = 0;
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function loop(now) {
    const elapsedScenario = now - state.scenarioStartedAt;
    if (elapsedScenario >= state.scenarioDuration) {
      setNextScenario(now);
    }

    const rawDt = (now - state.lastFrame) / 16.6667;
    const dt = clamp(rawDt, 0.65, 1.35);
    state.lastFrame = now;

    const mode = updateScore(dt);
    updateAssets(mode, dt);
    updateLine(mode, dt, now);
    drawChart(mode);

    requestAnimationFrame(loop);
  }

  function boot() {
    initLine();
    applyTexts('neutral');
    state.scoreTarget = 54;
    updateScore(1);
    updateAssets('neutral', 1);
    drawChart('neutral');
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    drawChart(getModeFromScore(state.score));
  });

  boot();
})();