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

    atualizarAtivo(
      "VIX",
      data.VIX,
      {
        price: "vix_price",
        change: "vix_change",
        direction: "vix_direction"
      },
      true
    );

    atualizarAtivo(
      "DXY",
      data.DXY,
      {
        price: "dxy_price",
        change: "dxy_change",
        direction: "dxy_direction"
      },
      true
    );

    atualizarDI(data.DI1FUT);
    atualizarResumo(data.indiceRadar);
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
    directionEl.className = "";
    directionEl.classList.add("neg");
  } else if (changeValue < 0) {
    direcao = "Alívio no índice";
    directionEl.className = "";
    directionEl.classList.add("pos");
  } else {
    directionEl.className = "";
    directionEl.classList.add("neutral");
  }

  directionEl.innerText = direcao;
}

function atualizarResumo(indiceRadar) {
  if (!indiceRadar) return;

  const bullPct = Number(indiceRadar.bullPercent ?? 50);
  const bearPct = Number(indiceRadar.bearPercent ?? 50);

  const bullBar = document.getElementById("bullBar");
  const bearBar = document.getElementById("bearBar");

  bullBar.style.width = `${bullPct}%`;
  bearBar.style.width = `${bearPct}%`;

  document.getElementById("bullText").innerText = `Bull ${bullPct}%`;
  document.getElementById("bearText").innerText = `Bear ${bearPct}%`;
  document.getElementById("sentimentValue").innerText = `${bullPct}% / ${bearPct}%`;

  const brScore = Number(indiceRadar?.tactical?.brasilScore ?? 0);
  const globalScore = Number(indiceRadar?.tactical?.globalScore ?? 0);

  document.getElementById("brStrength").innerText = prefixarNumero(brScore);
  document.getElementById("globalStrength").innerText = prefixarNumero(globalScore);
  document.getElementById("riskMode").innerText = indiceRadar.riskMode ?? "Neutro";

  aplicarCor(document.getElementById("brStrength"), brScore);
  aplicarCor(document.getElementById("globalStrength"), globalScore);

  const riskEl = document.getElementById("riskMode");
  riskEl.classList.remove("pos", "neg", "neutral");

  if ((indiceRadar.bias || "").includes("compra")) {
    riskEl.classList.add("pos");
  } else if ((indiceRadar.bias || "").includes("venda")) {
    riskEl.classList.add("neg");
  } else {
    riskEl.classList.add("neutral");
  }

  document.getElementById("marketMoodTitle").innerText =
    indiceRadar?.quickRead?.title ?? "Leitura indisponível";

  document.getElementById("marketMoodText").innerText =
    indiceRadar?.quickRead?.text ?? "Sem dados suficientes para montar a leitura.";

  document.getElementById("tradeCall").innerText =
    indiceRadar?.resumoOperacional?.title ?? "Sem resumo";

  let resumo = indiceRadar?.resumoOperacional?.text ?? "Sem resumo operacional.";
  const conviccao = Number(indiceRadar?.conviction ?? 0);

  if (conviccao > 0) {
    resumo += ` Convicção do radar: ${conviccao}%.`;
  }

  document.getElementById("tradeSummary").innerText = resumo;
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

function prefixarNumero(valor) {
  const n = Number(valor ?? 0);
  if (!Number.isFinite(n)) return "--";
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

setInterval(atualizarRadar, 4000);
atualizarRadar();