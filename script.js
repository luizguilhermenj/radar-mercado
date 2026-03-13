async function carregarSessaoDashboard() {
  try {
    const response = await fetch('/api/me', { cache: 'no-store' });
    if (response.status === 401) {
      window.location.href = '/login';
      return null;
    }
    const user = await response.json();

    const sessionUser = document.getElementById('sessionUser');
    if (sessionUser) {
      const plano = user.plan ? ` • ${user.plan}` : '';
      sessionUser.textContent = `Logado como ${user.username} • ${user.role}${plano}`;
    }

    const adminLink = document.getElementById('adminLink');
    if (adminLink && user.role === 'master') {
      adminLink.classList.remove('hidden');
      adminLink.style.display = 'inline-flex';
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && !logoutButton.dataset.bound) {
      logoutButton.dataset.bound = '1';
      logoutButton.addEventListener('click', async () => {
        try {
          await fetch('/api/logout', { method: 'POST' });
        } finally {
          window.location.href = '/login';
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Erro ao carregar sessão:', error);
    return null;
  }
}

async function atualizarRadar() {
  try {
    const response = await fetch('/api/quotes', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    atualizarAtivo('PETR4', data.PETR4, { price: 'petr4_price', change: 'petr4_change', direction: 'petr4_direction', low: 'petr4_low', high: 'petr4_high', range: 'petr4_range' });
    atualizarAtivo('VALE3', data.VALE3, { price: 'vale3_price', change: 'vale3_change', direction: 'vale3_direction', low: 'vale3_low', high: 'vale3_high', range: 'vale3_range' });
    atualizarAtivo('IFNC', data.IFNC, { price: 'ifnc_price', change: 'ifnc_change', direction: 'ifnc_direction', low: 'ifnc_low', high: 'ifnc_high', range: 'ifnc_range' });
    atualizarAtivo('ICON', data.ICON, { price: 'icon_price', change: 'icon_change', direction: 'icon_direction', low: 'icon_low', high: 'icon_high', range: 'icon_range' });
    atualizarDI(data.DI1FUT, { price: 'di_price', change: 'di_change', direction: 'di_direction', low: 'di_low', high: 'di_high', range: 'di_range' });
    atualizarEWZ(data.EWZ, { price: 'ewz_price', change: 'ewz_change', after: 'ewz_after', low: 'ewz_low', high: 'ewz_high', range: 'ewz_range' });
    atualizarAtivo('VIX', data.VIX, { price: 'vix_price', change: 'vix_change', direction: 'vix_direction', low: 'vix_low', high: 'vix_high', range: 'vix_range' }, true);
    atualizarAtivo('DXY', data.DXY, { price: 'dxy_price', change: 'dxy_change', direction: 'dxy_direction', low: 'dxy_low', high: 'dxy_high', range: 'dxy_range' }, true);

    atualizarResumo(data.indiceRadar);
    atualizarStatus('online');
    const timeEl = document.getElementById('updateTime');
    if (timeEl) timeEl.innerText = 'Última atualização • ' + new Date().toLocaleTimeString('pt-BR');
  } catch (error) {
    console.error('Erro ao atualizar radar:', error);
    atualizarStatus('erro');
    const timeEl = document.getElementById('updateTime');
    if (timeEl) timeEl.innerText = 'Falha ao atualizar • confira o backend';
  }
}

function atualizarAtivo(nome, ativo, ids, leituraEspecial = false) {
  if (!ativo) return preencherAtivoIndisponivel(ids);

  const priceEl = document.getElementById(ids.price);
  const changeEl = document.getElementById(ids.change);
  const directionEl = document.getElementById(ids.direction);

  if (priceEl) priceEl.innerText = formatarNumero(ativo.price);

  const changeValue = Number(ativo.change);
  if (changeEl) {
    changeEl.innerText = formatarPercentual(ativo.change);
    aplicarCor(changeEl, changeValue);
  }

  if (directionEl) {
    let direcao = 'Neutro';
    if (leituraEspecial && nome === 'VIX') {
      if (changeValue > 0) direcao = 'Risco ↑';
      else if (changeValue < 0) direcao = 'Alívio ↓';
    } else if (leituraEspecial && nome === 'DXY') {
      if (changeValue > 0) direcao = 'Dólar forte';
      else if (changeValue < 0) direcao = 'Dólar fraco';
    } else {
      if (changeValue > 0) direcao = 'Comprador';
      else if (changeValue < 0) direcao = 'Pressão vendedora';
    }
    directionEl.innerText = direcao;
    aplicarCor(directionEl, changeValue);
  }

  atualizarExtremos(ativo, ids);
}

function atualizarExtremos(ativo, ids) {
  const lowEl = document.getElementById(ids.low);
  const highEl = document.getElementById(ids.high);
  const rangeEl = document.getElementById(ids.range);

  const extremos = calcularExtremosPercentuais(ativo.price, ativo.change, ativo.low, ativo.high);

  if (lowEl) {
    lowEl.innerText = extremos.lowText;
    aplicarCor(lowEl, extremos.lowValue);
  }
  if (highEl) {
    highEl.innerText = extremos.highText;
    aplicarCor(highEl, extremos.highValue);
  }
  if (rangeEl) {
    rangeEl.innerText = lerFaixaPregao(ativo.rangePosition);
    rangeEl.classList.remove('pos', 'neg', 'neutral');
    if (ativo.rangePosition >= 85) rangeEl.classList.add('pos');
    else if (ativo.rangePosition <= 15) rangeEl.classList.add('neg');
    else rangeEl.classList.add('neutral');
  }
}

function atualizarEWZ(ewz, ids) {
  const priceEl = document.getElementById(ids.price);
  const changeEl = document.getElementById(ids.change);
  const afterEl = document.getElementById(ids.after);

  if (!ewz) {
    if (priceEl) priceEl.innerText = '--';
    if (changeEl) { changeEl.innerText = 'Indisponível'; changeEl.className = 'neutral'; }
    if (afterEl) { afterEl.innerText = 'Sem extended'; afterEl.className = 'neutral'; }
    atualizarExtremos({}, ids);
    return;
  }

  if (priceEl) priceEl.innerText = formatarNumero(ewz.price);
  if (changeEl) {
    changeEl.innerText = formatarPercentual(ewz.change);
    aplicarCor(changeEl, Number(ewz.change));
  }

  if (afterEl) {
    if (ewz.pre_price != null && ewz.pre_change != null) {
      afterEl.innerText = 'Pré ' + formatarNumero(ewz.pre_price) + ' • ' + formatarPercentual(ewz.pre_change);
      aplicarCor(afterEl, Number(ewz.pre_change));
    } else if (ewz.post_price != null && ewz.post_change != null) {
      afterEl.innerText = 'After ' + formatarNumero(ewz.post_price) + ' • ' + formatarPercentual(ewz.post_change);
      aplicarCor(afterEl, Number(ewz.post_change));
    } else {
      afterEl.innerText = 'Sem extended agora';
      afterEl.className = 'neutral';
    }
  }

  atualizarExtremos(ewz, ids);
}

function atualizarDI(di, ids) {
  const priceEl = document.getElementById(ids.price);
  const changeEl = document.getElementById(ids.change);
  const directionEl = document.getElementById(ids.direction);

  if (!di || (di.price == null && di.change == null)) {
    if (priceEl) priceEl.innerText = '--';
    if (changeEl) { changeEl.innerText = '--'; changeEl.className = 'neutral'; }
    if (directionEl) { directionEl.innerText = 'Neutro'; directionEl.className = 'neutral'; }
    atualizarExtremos(di || {}, ids);
    return;
  }

  if (priceEl) priceEl.innerText = formatarNumero(di.price);
  if (changeEl) {
    changeEl.innerText = formatarPercentual(di.change);
    aplicarCor(changeEl, Number(di.change));
  }

  if (directionEl) {
    let direcao = 'Neutro';
    if (Number(di.change) > 0) direcao = 'Pressão no índice';
    else if (Number(di.change) < 0) direcao = 'Alívio no índice';
    directionEl.innerText = direcao;
    aplicarCor(directionEl, Number(di.change) > 0 ? -1 : Number(di.change) < 0 ? 1 : 0);
  }

  atualizarExtremos(di, ids);
}

function calcularExtremosPercentuais(price, change, low, high) {
  if (price == null || change == null || low == null || high == null || !Number.isFinite(Number(price)) || !Number.isFinite(Number(change)) || !Number.isFinite(Number(low)) || !Number.isFinite(Number(high))) {
    return { lowText: '--', highText: '--', lowValue: 0, highValue: 0 };
  }

  const prevClose = Number(price) / (1 + Number(change) / 100);
  if (!Number.isFinite(prevClose) || prevClose === 0) {
    return { lowText: '--', highText: '--', lowValue: 0, highValue: 0 };
  }

  const lowPct = ((Number(low) - prevClose) / prevClose) * 100;
  const highPct = ((Number(high) - prevClose) / prevClose) * 100;

  return {
    lowText: formatarPercentual(lowPct),
    highText: formatarPercentual(highPct),
    lowValue: lowPct,
    highValue: highPct
  };
}

function lerFaixaPregao(pos) {
  const n = Number(pos);
  if (!Number.isFinite(n)) return 'Aguardando...';
  if (n >= 85) return 'Pressionando topo do dia';
  if (n <= 15) return 'Pressionando fundo do dia';
  return 'Faixa intermediária do dia';
}

function atualizarResumo(indiceRadar) {
  if (!indiceRadar) return;
  const bullPct = Number(indiceRadar.bullPercent ?? 50);
  const bearPct = Number(indiceRadar.bearPercent ?? 50);

  const bullBar = document.getElementById('bullBar');
  const bearBar = document.getElementById('bearBar');
  if (bullBar) bullBar.style.width = `${bullPct}%`;
  if (bearBar) bearBar.style.width = `${bearPct}%`;

  const bullText = document.getElementById('bullText');
  const bearText = document.getElementById('bearText');
  const sentimentValue = document.getElementById('sentimentValue');
  if (bullText) bullText.innerText = `Bull ${bullPct}%`;
  if (bearText) bearText.innerText = `Bear ${bearPct}%`;
  if (sentimentValue) sentimentValue.innerText = `${bullPct}% / ${bearPct}%`;

  const brScore = Number(indiceRadar?.tactical?.brasilScore ?? 0);
  const globalScore = Number(indiceRadar?.tactical?.globalScore ?? 0);
  const brStrength = document.getElementById('brStrength');
  const globalStrength = document.getElementById('globalStrength');
  const riskMode = document.getElementById('riskMode');

  if (brStrength) { brStrength.innerText = prefixarNumero(brScore); aplicarCor(brStrength, brScore); }
  if (globalStrength) { globalStrength.innerText = prefixarNumero(globalScore); aplicarCor(globalStrength, globalScore); }
  if (riskMode) {
    riskMode.innerText = indiceRadar.riskMode ?? 'Neutro';
    riskMode.classList.remove('pos', 'neg', 'neutral');
    if ((indiceRadar.bias || '').includes('compra')) riskMode.classList.add('pos');
    else if ((indiceRadar.bias || '').includes('venda')) riskMode.classList.add('neg');
    else riskMode.classList.add('neutral');
  }

  const moodTitle = document.getElementById('marketMoodTitle');
  const moodText = document.getElementById('marketMoodText');
  const tradeCall = document.getElementById('tradeCall');
  const tradeSummary = document.getElementById('tradeSummary');
  if (moodTitle) moodTitle.innerText = indiceRadar?.quickRead?.title ?? 'Leitura indisponível';
  if (moodText) moodText.innerText = indiceRadar?.quickRead?.text ?? 'Sem dados suficientes para montar a leitura.';
  if (tradeCall) tradeCall.innerText = indiceRadar?.resumoOperacional?.title ?? 'Sem resumo';
  if (tradeSummary) {
    let resumo = indiceRadar?.resumoOperacional?.text ?? 'Sem resumo operacional.';
    const conviccao = Number(indiceRadar?.conviction ?? 0);
    if (conviccao > 0) resumo += ` Convicção do radar: ${conviccao}%.`;
    tradeSummary.innerText = resumo;
  }
}

function atualizarStatus(tipo) {
  const statusText = document.getElementById('connectionStatus');
  const dot = document.querySelector('.status-dot');
  if (!statusText || !dot) return;
  if (tipo === 'online') {
    statusText.innerText = 'Radar online';
    dot.style.background = '#22c55e';
    dot.style.boxShadow = '0 0 14px #22c55e';
  } else {
    statusText.innerText = 'Falha na conexão';
    dot.style.background = '#ef4444';
    dot.style.boxShadow = '0 0 14px #ef4444';
  }
}

function preencherAtivoIndisponivel(ids) {
  ['price', 'change', 'direction', 'low', 'high', 'range'].forEach((key) => {
    const el = document.getElementById(ids[key]);
    if (!el) return;
    el.innerText = key === 'range' ? 'Aguardando...' : '--';
    el.classList.remove('pos', 'neg', 'neutral');
    el.classList.add('neutral');
  });
}

function aplicarCor(element, valor) {
  if (!element) return;
  element.classList.remove('pos', 'neg', 'neutral');
  const n = Number(valor);
  if (Number.isFinite(n) && n > 0) element.classList.add('pos');
  else if (Number.isFinite(n) && n < 0) element.classList.add('neg');
  else element.classList.add('neutral');
}

function formatarNumero(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return '--';
  return Number(valor).toFixed(2);
}

function formatarPercentual(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return '--';
  const n = Number(valor);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function prefixarNumero(valor) {
  const n = Number(valor ?? 0);
  if (!Number.isFinite(n)) return '--';
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

function formatarHoraEvento(time) { return time || '--:--'; }
function gerarEstrelas(impacto) { const n = Number(impacto ?? 0); return !Number.isFinite(n) || n <= 0 ? '-' : '★'.repeat(n); }
function parseNumeroEvento(valor) {
  if (valor == null) return null;
  const limpo = String(valor).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return limpo ? Number(limpo[0]) : null;
}

function interpretarEvento(evento) {
  if (evento.actual == null || evento.forecast == null) return { surpresa: 'Sem dado comparável ainda', vies: 'Viés ainda indefinido', classe: 'macro-bias-neutral' };
  const actual = parseNumeroEvento(evento.actual);
  const forecast = parseNumeroEvento(evento.forecast);
  if (actual == null || forecast == null) return { surpresa: 'Comparação indisponível', vies: 'Viés ainda indefinido', classe: 'macro-bias-neutral' };
  const nome = String(evento.event || '').toLowerCase();
  const hawkish = ['payroll', 'non farm', 'adp', 'cpi', 'inflation', 'ppi', 'core', 'employment', 'jobs', 'wage'].some(term => nome.includes(term));
  if (actual > forecast) return hawkish ? { surpresa: 'Acima do consenso', vies: 'Viés: bolsa - / juros +', classe: 'macro-bias-neg' } : { surpresa: 'Acima do consenso', vies: 'Viés: leitura positiva para risco', classe: 'macro-bias-pos' };
  if (actual < forecast) return hawkish ? { surpresa: 'Abaixo do consenso', vies: 'Viés: bolsa + / juros -', classe: 'macro-bias-pos' } : { surpresa: 'Abaixo do consenso', vies: 'Viés: leitura negativa para risco', classe: 'macro-bias-neg' };
  return { surpresa: 'Em linha com o consenso', vies: 'Viés: neutro', classe: 'macro-bias-neutral' };
}

function minutosParaEvento(time) {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const now = new Date();
  const eventDate = new Date();
  eventDate.setHours(h, m, 0, 0);
  return Math.round((eventDate.getTime() - now.getTime()) / 60000);
}

function renderizarProximosEventos(eventos) {
  const root = document.getElementById('macroUpcoming');
  if (!root) return;
  if (!Array.isArray(eventos) || !eventos.length) {
    root.innerHTML = '<div class="macro-empty">Nenhum evento relevante restante para hoje.</div>';
    return;
  }
  root.innerHTML = eventos.map((evento) => {
    const minutos = minutosParaEvento(evento.time);
    let countdown = 'Horário do dia';
    if (minutos != null) {
      if (minutos > 0) countdown = `Em ${minutos} min`;
      else if (minutos === 0) countdown = 'Saindo agora';
      else countdown = 'Horário já passou';
    }
    return `<div class="macro-event"><div class="macro-event-top"><div class="macro-event-title">${evento.countryFlag || '🌐'} ${evento.event || 'Evento'}</div><div class="macro-event-time">${formatarHoraEvento(evento.time)}</div></div><div class="macro-event-impact">Impacto <span class="macro-impact-stars">${gerarEstrelas(evento.impact)}</span></div><div class="macro-event-meta">Previsto: ${evento.forecast ?? '--'}</div><div class="macro-event-meta">${countdown}</div></div>`;
  }).join('');
}

function renderizarEventosDivulgados(eventos) {
  const root = document.getElementById('macroReleased');
  if (!root) return;
  if (!Array.isArray(eventos) || !eventos.length) {
    root.innerHTML = '<div class="macro-empty">Nenhum evento relevante divulgado hoje.</div>';
    return;
  }
  root.innerHTML = eventos.map((evento) => {
    const leitura = interpretarEvento(evento);
    return `<div class="macro-event"><div class="macro-event-top"><div class="macro-event-title">${evento.countryFlag || '🌐'} ${evento.event || 'Evento'}</div><div class="macro-event-time">${formatarHoraEvento(evento.time)}</div></div><div class="macro-event-impact">Impacto <span class="macro-impact-stars">${gerarEstrelas(evento.impact)}</span></div><div class="macro-event-meta">Previsto: ${evento.forecast ?? '--'}</div><div class="macro-event-meta">Divulgado: ${evento.actual ?? '--'}</div><div class="macro-event-bias ${leitura.classe}">${leitura.surpresa}</div><div class="macro-event-bias ${leitura.classe}">${leitura.vies}</div></div>`;
  }).join('');
}

async function atualizarEventosMacro() {
  try {
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderizarProximosEventos(data.upcoming);
    renderizarEventosDivulgados(data.released);
  } catch (error) {
    console.error('Erro ao atualizar eventos macro:', error);
    const upcoming = document.getElementById('macroUpcoming');
    const released = document.getElementById('macroReleased');
    if (upcoming) upcoming.innerHTML = '<div class="macro-empty">Falha ao carregar próximos eventos.</div>';
    if (released) released.innerHTML = '<div class="macro-empty">Falha ao carregar eventos divulgados.</div>';
  }
}

setInterval(atualizarRadar, 4000);
setInterval(atualizarEventosMacro, 30000);
atualizarRadar();
atualizarEventosMacro();


carregarSessaoDashboard();
