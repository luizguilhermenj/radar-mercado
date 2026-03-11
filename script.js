async function atualizarRadar() {
  try {
    const response = await fetch("/api/quotes", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    atualizarAtivo("PETR4", data.PETR4, {
      price: "petr4_price",
      change: "petr4_change",
      direction: "petr4_direction"
    });

    atualizarAtivo("VALE3", data.VALE3, {
      price: "vale3_price",
      change: "vale3_change",
      direction: "vale3_direction"
    });

    atualizarAtivo("IFNC", data.IFNC, {
      price: "ifnc_price",
      change: "ifnc_change",
      direction: "ifnc_direction"
    });

    atualizarAtivo("ICON", data.ICON, {
      price: "icon_price",
      change: "icon_change",
      direction: "icon_direction"
    });

    atualizarEWZ(data.EWZ);

    atualizarAtivo("VIX", data.VIX, {
      price: "vix_price",
      change: "vix_change",
      direction: "vix_direction"
    }, true);

    atualizarAtivo("DXY", data.DXY, {
      price: "dxy_price",
      change: "dxy_change",
      direction: "dxy_direction"
    }, true);

    atualizarDI(data.DI1FUT);

    atualizarResumo(data);
    atualizarStatus("online");

    document.getElementById("updateTime").innerText =
      "Última atualização • " + new Date().toLocaleTimeString("pt-BR");
  } catch (error) {
    console.error("Erro ao atualizar radar:", error);
    atualizarStatus("erro");
    document.getElementById("updateTime").innerText =
      "Falha ao atualizar • confira o backend";
  }
}

function atualizarAtivo(nome, ativo, ids, leituraEspecial = false) {
  if (!ativo) {
    preencherAtivoIndisponivel(ids);
    return;
  }

  const priceEl = document.getElementById(ids.price);
  const changeEl = document.getElementById(ids.change);
  const directionEl = document.getElementById(ids.direction);

  const price = formatarNumero(ativo.price);
  const changeValue = Number(ativo.change ?? 0);
  const changeText = formatarPercentual(changeValue);

  priceEl.innerText = price;
  changeEl.innerText = changeText;

  aplicarCor(changeEl, changeValue);

  let direcao = "Neutro";

  if (leituraEspecial && nome === "VIX") {
    if (changeValue > 0) direcao = "Risco ↑";
    else if (changeValue < 0) direcao = "Alívio ↓";
    else direcao = "Neutro";
  } else if (leituraEspecial && nome === "DXY") {
    if (changeValue > 0) direcao = "Dólar forte";
    else if (changeValue < 0) direcao = "Dólar fraco";
    else direcao = "Neutro";
  } else {
    if (changeValue > 0) direcao = "Comprador";
    else if (changeValue < 0) direcao = "Pressão vendedora";
    else direcao = "Neutro";
  }

  directionEl.innerText = direcao;
  aplicarCor(directionEl, changeValue);
}

function atualizarEWZ(ewz) {
  const priceEl = document.getElementById("ewz_price");
  const changeEl = document.getElementById("ewz_change");
  const afterEl = document.getElementById("ewz_after");

  if (!ewz) {
    priceEl.innerText = "--";
    changeEl.innerText = "Indisponível";
    afterEl.innerText = "Sem extended";
    changeEl.className = "";
    afterEl.className = "";
    changeEl.classList.add("neutral");
    afterEl.classList.add("neutral");
    return;
  }

  const price = formatarNumero(ewz.price);
  const changeValue = Number(ewz.change ?? 0);

  priceEl.innerText = price;
  changeEl.innerText = formatarPercentual(changeValue);
  aplicarCor(changeEl, changeValue);

  if (ewz.pre_price != null && ewz.pre_change != null) {
    afterEl.innerText =
      "Pré " + formatarNumero(ewz.pre_price) + " • " + formatarPercentual(ewz.pre_change);
    aplicarCor(afterEl, Number(ewz.pre_change));
    return;
  }

  if (ewz.post_price != null && ewz.post_change != null) {
    afterEl.innerText =
      "After " + formatarNumero(ewz.post_price) + " • " + formatarPercentual(ewz.post_change);
    aplicarCor(afterEl, Number(ewz.post_change));
    return;
  }

  afterEl.innerText = "Sem extended agora";
  afterEl.className = "";
  afterEl.classList.add("neutral");
}

function atualizarDI(di) {
  const priceEl = document.getElementById("di_price");
  const changeEl = document.getElementById("di_change");
  const directionEl = document.getElementById("di_direction");

  if (!di) {
    priceEl.innerText = "--";
    changeEl.innerText = "Sem fonte";
    directionEl.innerText = "Em ajuste";

    changeEl.className = "";
    directionEl.className = "";

    changeEl.classList.add("neutral");
    directionEl.classList.add("neutral");
    return;
  }

  const price = formatarNumero(di.price);
  const changeValue = Number(di.change ?? 0);

  priceEl.innerText = price;
  changeEl.innerText = formatarPercentual(changeValue);
  aplicarCor(changeEl, changeValue);

  let direcao = "Neutro";

  if (changeValue > 0) {
    direcao = "Pressão no índice";
  } else if (changeValue < 0) {
    direcao = "Alívio no índice";
  }

  directionEl.innerText = direcao;
  aplicarCor(directionEl, changeValue);
}

function atualizarResumo(data) {
  const ativos = [
    { nome: "PETR4", valor: Number(data?.PETR4?.change ?? 0) },
    { nome: "VALE3", valor: Number(data?.VALE3?.change ?? 0) },
    { nome: "IFNC", valor: Number(data?.IFNC?.change ?? 0) },
    { nome: "ICON", valor: Number(data?.ICON?.change ?? 0) },
    { nome: "EWZ", valor: Number(data?.EWZ?.change ?? 0) },
    { nome: "VIX", valor: Number(data?.VIX?.change ?? 0) },
    { nome: "DXY", valor: Number(data?.DXY?.change ?? 0) }
  ];

  const bullCount = ativos.filter(a => a.valor > 0).length;
  const bearCount = ativos.filter(a => a.valor < 0).length;
  const total = ativos.length || 1;

  const bullPct = Math.round((bullCount / total) * 100);
  const bearPct = 100 - bullPct;

  document.getElementById("bullBar").style.width = `${bullPct}%`;
  document.getElementById("bearBar").style.width = `${bearPct}%`;
  document.getElementById("bullText").innerText = `Bull ${bullPct}%`;
  document.getElementById("bearText").innerText = `Bear ${bearPct}%`;
  document.getElementById("sentimentValue").innerText = `${bullPct}% / ${bearPct}%`;

  const brScore =
    Number(data?.PETR4?.change ?? 0) +
    Number(data?.VALE3?.change ?? 0) +
    Number(data?.IFNC?.change ?? 0) +
    Number(data?.ICON?.change ?? 0);

  const globalScore =
    Number(data?.EWZ?.change ?? 0) -
    Number(data?.VIX?.change ?? 0) -
    Number(data?.DXY?.change ?? 0);

  document.getElementById("brStrength").innerText =
    brScore >= 0 ? `+${brScore.toFixed(2)}` : brScore.toFixed(2);

  document.getElementById("globalStrength").innerText =
    globalScore >= 0 ? `+${globalScore.toFixed(2)}` : globalScore.toFixed(2);

  let riskMode = "Neutro";
  const vixChange = Number(data?.VIX?.change ?? 0);
  const dxyChange = Number(data?.DXY?.change ?? 0);

  if (vixChange > 0 || dxyChange > 0) riskMode = "Risco alto";
  if (vixChange < 0 && dxyChange < 0) riskMode = "Risco aliviando";

  document.getElementById("riskMode").innerText = riskMode;

  const marketMoodTitle = document.getElementById("marketMoodTitle");
  const marketMoodText = document.getElementById("marketMoodText");
  const tradeCall = document.getElementById("tradeCall");
  const tradeSummary = document.getElementById("tradeSummary");

  if (bullPct >= 60 && brScore > 0 && globalScore > -1) {
    marketMoodTitle.innerText = "Mercado com inclinação compradora";
    marketMoodText.innerText =
      "Os principais vetores do radar mostram sustentação melhor no bloco doméstico, com leitura geral mais favorável para continuidade ou defesa de suporte.";
    tradeCall.innerText = "Compradores no controle";
    tradeSummary.innerText =
      "PETR4, VALE3, IFNC e ICON ajudam a sustentar o tom local. Se o risco global não apertar, o índice tende a responder melhor.";
  } else if (bearPct >= 60 || vixChange > 0.8 || dxyChange > 0.4) {
    marketMoodTitle.innerText = "Ambiente mais sensível ao risco";
    marketMoodText.innerText =
      "O radar mostra aumento de pressão defensiva. Com volatilidade ou dólar fortalecendo, o mercado tende a perder fluidez compradora.";
    tradeCall.innerText = "Cenário pede cautela";
    tradeSummary.innerText =
      "Se VIX e DXY continuarem firmes, vale respeitar máximas e evitar compras afoitas no índice.";
  } else {
    marketMoodTitle.innerText = "Contexto misto no radar";
    marketMoodText.innerText =
      "Há sinais cruzados entre força local e pressão externa. O melhor uso do painel agora é mapear quem está puxando e quem está travando o índice.";
    tradeCall.innerText = "Mercado em definição";
    tradeSummary.innerText =
      "Sem domínio claro. A leitura favorece seleção de contexto e gestão curta até aparecer direção mais limpa.";
  }
}

function atualizarStatus(tipo) {
  const statusText = document.getElementById("connectionStatus");
  const dot = document.querySelector(".status-dot");

  if (tipo === "online") {
    statusText.innerText = "Radar online";
    dot.style.background = "#22c55e";
    dot.style.boxShadow = "0 0 14px #22c55e";
  } else {
    statusText.innerText = "Falha na conexão";
    dot.style.background = "#ef4444";
    dot.style.boxShadow = "0 0 14px #ef4444";
  }
}

function preencherAtivoIndisponivel(ids) {
  const priceEl = document.getElementById(ids.price);
  const changeEl = document.getElementById(ids.change);
  const directionEl = document.getElementById(ids.direction);

  if (priceEl) priceEl.innerText = "--";
  if (changeEl) {
    changeEl.innerText = "Indisponível";
    changeEl.className = "";
    changeEl.classList.add("neutral");
  }
  if (directionEl) {
    directionEl.innerText = "Sem leitura";
    directionEl.className = "";
    directionEl.classList.add("neutral");
  }
}

function aplicarCor(element, valor) {
  element.classList.remove("pos", "neg", "neutral");

  if (valor > 0) {
    element.classList.add("pos");
  } else if (valor < 0) {
    element.classList.add("neg");
  } else {
    element.classList.add("neutral");
  }
}

function formatarNumero(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "--";
  return Number(valor).toFixed(2);
}

function formatarPercentual(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "--";
  const n = Number(valor);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

setInterval(atualizarRadar, 4000);
atualizarRadar();