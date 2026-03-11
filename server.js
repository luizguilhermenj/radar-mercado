const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatAsset(price = null, change = null, extra = {}) {
  return {
    price: price ?? null,
    change: change ?? null,
    ...extra
  };
}

async function postScanner(url, tickers) {
  const body = {
    symbols: { tickers },
    columns: ["close", "change"]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Scanner HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchBrazil() {
  const json = await postScanner("https://scanner.tradingview.com/brazil/scan", [
    "BMFBOVESPA:PETR4",
    "BMFBOVESPA:VALE3",
    "BMFBOVESPA:IFNC",
    "BMFBOVESPA:ICON",
    "BMFBOVESPA:DI1FUT"
  ]);

  const result = {};

  if (Array.isArray(json.data)) {
    for (const item of json.data) {
      const rawSymbol = item.s?.split(":")[1];
      if (!rawSymbol) continue;

      result[rawSymbol] = formatAsset(item.d?.[0] ?? null, item.d?.[1] ?? null);
    }
  }

  return result;
}

async function fetchGlobal() {
  const json = await postScanner("https://scanner.tradingview.com/global/scan", [
    "AMEX:EWZ",
    "TVC:VIX",
    "TVC:DXY"
  ]);

  const result = {};

  if (Array.isArray(json.data)) {
    for (const item of json.data) {
      const rawSymbol = item.s?.split(":")[1];
      if (!rawSymbol) continue;

      result[rawSymbol] = formatAsset(item.d?.[0] ?? null, item.d?.[1] ?? null);
    }
  }

  return result;
}

async function enrichEwzExtended(ewz) {
  if (!ewz) return null;

  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/EWZ?region=US&lang=en-US&includePrePost=true&interval=1m&range=1d"
    );

    if (!response.ok) {
      console.warn(`EWZ extended indisponível: Yahoo HTTP ${response.status}`);
      return ewz;
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) return ewz;

    const regular = num(meta.regularMarketPrice, null);

    const prePrice =
      meta.preMarketPrice != null && regular != null ? Number(meta.preMarketPrice) : null;
    const postPrice =
      meta.postMarketPrice != null && regular != null ? Number(meta.postMarketPrice) : null;

    let preChange = null;
    let postChange = null;

    if (prePrice != null && regular != null && regular !== 0) {
      preChange = ((prePrice - regular) / regular) * 100;
    }

    if (postPrice != null && regular != null && regular !== 0) {
      postChange = ((postPrice - regular) / regular) * 100;
    }

    return {
      ...ewz,
      pre_price: prePrice,
      pre_change: preChange,
      post_price: postPrice,
      post_change: postChange
    };
  } catch (error) {
    console.warn("Falha ao enriquecer EWZ extended:", error.message);
    return ewz;
  }
}

function calcDirectionalScore(change, weightUp = 1, weightDown = 1) {
  const v = num(change, 0);

  if (v > 1.5) return 2 * weightUp;
  if (v > 0.5) return 1 * weightUp;
  if (v > 0.1) return 0.5 * weightUp;

  if (v < -1.5) return -2 * weightDown;
  if (v < -0.5) return -1 * weightDown;
  if (v < -0.1) return -0.5 * weightDown;

  return 0;
}

function scoreVix(vixPrice, vixChange) {
  const price = num(vixPrice, 0);
  const change = num(vixChange, 0);

  let score = 0;

  if (price >= 30) score -= 4;
  else if (price >= 25) score -= 3;
  else if (price >= 22) score -= 2;
  else if (price >= 19) score -= 1;
  else if (price <= 15) score += 1;

  if (change >= 5) score -= 3;
  else if (change >= 2) score -= 2;
  else if (change >= 0.7) score -= 1;
  else if (change <= -5) score += 3;
  else if (change <= -2) score += 2;
  else if (change <= -0.7) score += 1;

  return score;
}

function scoreDxy(dxyPrice, dxyChange) {
  const price = num(dxyPrice, 0);
  const change = num(dxyChange, 0);

  let score = 0;

  if (price >= 106) score -= 2;
  else if (price >= 103) score -= 1;
  else if (price <= 100) score += 0.5;

  if (change >= 0.7) score -= 3;
  else if (change >= 0.3) score -= 2;
  else if (change >= 0.1) score -= 1;
  else if (change <= -0.7) score += 3;
  else if (change <= -0.3) score += 2;
  else if (change <= -0.1) score += 1;

  return score;
}

function scoreDi(diChange) {
  const change = num(diChange, 0);

  if (change >= 1.5) return -3;
  if (change >= 0.7) return -2;
  if (change >= 0.2) return -1;

  if (change <= -1.5) return 3;
  if (change <= -0.7) return 2;
  if (change <= -0.2) return 1;

  return 0;
}

function scoreSector(change, weight = 1) {
  return calcDirectionalScore(change, weight, weight);
}

function scoreStock(change, weight = 1) {
  return calcDirectionalScore(change, weight, weight);
}

function buildIndiceRadar(data) {
  const vixPrice = num(data.vixPrice);
  const vixChange = num(data.vixChange);
  const dxyPrice = num(data.dxyPrice);
  const dxyChange = num(data.dxyChange);
  const diChange = num(data.diChange);
  const ewzChange = num(data.ewzChange);
  const petrChange = num(data.petrChange);
  const valeChange = num(data.valeChange);
  const ifncChange = num(data.ifncChange);
  const iconChange = num(data.iconChange);

  const macroScore =
    scoreVix(vixPrice, vixChange) +
    scoreDxy(dxyPrice, dxyChange) +
    calcDirectionalScore(ewzChange, 1.5, 1.5);

  const brasilScore =
    scoreDi(diChange) +
    scoreSector(ifncChange, 1.5) +
    scoreSector(iconChange, 1.2);

  const indexLeadersScore =
    scoreStock(petrChange, 2.2) +
    scoreStock(valeChange, 2.0);

  let conflictPenalty = 0;
  if (petrChange < 0 && valeChange < 0 && (ifncChange > 0 || iconChange > 0)) {
    conflictPenalty -= 1.5;
  }

  const totalScore = macroScore + brasilScore + indexLeadersScore + conflictPenalty;
  const normalized = clamp(totalScore, -20, 20);

  const bullPercent = Math.round(((normalized + 20) / 40) * 100);
  const bearPercent = 100 - bullPercent;
  const conviction = Math.min(100, Math.round(Math.abs(normalized) * 5));

  let bias = "neutro";
  let direction = "Neutro";
  let quickTitle = "Ambiente equilibrado";
  let quickText =
    "Os vetores estão mistos. O índice pede confirmação antes de favorecer compras ou vendas.";
  let resumoTitle = "Cenário misto";
  let resumoText =
    "Sem vantagem clara. Vale esperar confirmação de fluxo antes de aumentar a agressividade.";

  if (normalized >= 8) {
    bias = "compra";
    direction = "Compra";
    quickTitle = "Ambiente favorável à compra do índice";
    quickText =
      "O radar mostra predominância compradora. Com risco controlado e pesos do índice sustentando, o mercado tende a aceitar compras com mais fluidez.";
    resumoTitle = "Cenário favorece compras";
    resumoText =
      "Priorize compras em pullback, rompimento ou defesa de suporte. Evite insistir em venda contra fluxo.";
  } else if (normalized >= 3) {
    bias = "compra-moderada";
    direction = "Compra moderada";
    quickTitle = "Leve vantagem compradora";
    quickText =
      "Há sustentação para compras, mas ainda sem domínio total. O ideal é buscar entradas seletivas e respeitar contexto.";
    resumoTitle = "Compras seletivas";
    resumoText =
      "O índice pode aceitar continuidade de alta, mas sem espaço para afobação. Melhor comprar com contexto e gestão curta.";
  } else if (normalized <= -8) {
    bias = "venda";
    direction = "Venda";
    quickTitle = "Ambiente favorável à venda do índice";
    quickText =
      "O radar mostra aumento de pressão vendedora. Com dólar e volatilidade pesando, o mercado tende a perder fluidez compradora.";
    resumoTitle = "Cenário pede cautela compradora";
    resumoText =
      "Priorize vendas em repique, rejeição de resistência ou perda de suporte. Evite compras afoitas contra o ambiente.";
  } else if (normalized <= -3) {
    bias = "venda-moderada";
    direction = "Venda moderada";
    quickTitle = "Leve pressão vendedora no índice";
    quickText =
      "O ambiente ficou menos amigável para compra. Ainda não é domínio total dos vendedores, mas o contexto já pede mais cautela.";
    resumoTitle = "Venda seletiva / cautela nas compras";
    resumoText =
      "O índice pode ceder em repiques. Compras só com gatilho muito limpo; vendas ganham vantagem tática.";
  }

  let riskMode = "Neutro";
  if (normalized <= -8) riskMode = "Risco alto";
  else if (normalized <= -3) riskMode = "Risco moderado";
  else if (normalized >= 8) riskMode = "Risco controlado";
  else if (normalized >= 3) riskMode = "Risco sob controle";

  const regime =
    normalized >= 8
      ? "risk-on forte"
      : normalized >= 3
        ? "risk-on moderado"
        : normalized <= -8
          ? "risk-off forte"
          : normalized <= -3
            ? "risk-off moderado"
            : "neutro";

  return {
    bias,
    direction,
    regime,
    riskMode,
    score: normalized,
    conviction,
    bullPercent,
    bearPercent,
    quickRead: {
      title: quickTitle,
      text: quickText
    },
    resumoOperacional: {
      title: resumoTitle,
      text: resumoText
    },
    tactical: {
      brasilScore: Number((indexLeadersScore + brasilScore).toFixed(2)),
      globalScore: Number(macroScore.toFixed(2)),
      riskScore: Number(normalized.toFixed(2))
    }
  };
}

app.get("/api/quotes", async (req, res) => {
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
      vixPrice: payload.VIX.price,
      vixChange: payload.VIX.change,
      dxyPrice: payload.DXY.price,
      dxyChange: payload.DXY.change,
      diChange: payload.DI1FUT.change,
      ewzChange: payload.EWZ.change,
      petrChange: payload.PETR4.change,
      valeChange: payload.VALE3.change,
      ifncChange: payload.IFNC.change,
      iconChange: payload.ICON.change
    });

    res.json(payload);
  } catch (error) {
    console.error("Erro em /api/quotes:", error);
    res.status(500).json({
      error: "Falha ao montar radar",
      details: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Radar rodando na porta ${PORT}`);
});