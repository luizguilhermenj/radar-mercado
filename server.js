const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

async function fetchBrazil() {
  const body = {
    symbols: {
      tickers: [
        "BMFBOVESPA:PETR4",
        "BMFBOVESPA:VALE3"
      ]
    },
    columns: [
      "close",
      "change"
    ]
  };

  const response = await fetch("https://scanner.tradingview.com/brazil/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar scanner Brasil");
  }

  const json = await response.json();
  const result = {};

  json.data.forEach(item => {
    const symbol = item.s.split(":")[1];

    result[symbol] = {
      price: item.d[0],
      change: item.d[1]
    };
  });

  return result;
}

async function fetchGlobal() {
  const body = {
    symbols: {
      tickers: [
        "AMEX:EWZ",
        "TVC:VIX",
        "TVC:DXY"
      ]
    },
    columns: [
      "close",
      "change"
    ]
  };

  const response = await fetch("https://scanner.tradingview.com/global/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar scanner Global");
  }

  const json = await response.json();
  const result = {};

  json.data.forEach(item => {
    const symbol = item.s.split(":")[1];

    result[symbol] = {
      price: item.d[0],
      change: item.d[1]
    };
  });

  return result;
}

async function fetchEWZExtended() {
  try {
    const response = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=EWZ", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo HTTP ${response.status}`);
    }

    const json = await response.json();
    const q = json?.quoteResponse?.result?.[0];

    if (!q) {
      return null;
    }

    return {
      pre_price: q.preMarketPrice ?? null,
      pre_change: q.preMarketChangePercent ?? null,
      post_price: q.postMarketPrice ?? null,
      post_change: q.postMarketChangePercent ?? null
    };
  } catch (error) {
    console.log("EWZ extended indisponível:", error.message);
    return null;
  }
}

app.get("/api/quotes", async (req, res) => {
  try {
    const br = await fetchBrazil();
    const gl = await fetchGlobal();
    const ewzExtended = await fetchEWZExtended();

    res.json({
      PETR4: br.PETR4 || null,
      VALE3: br.VALE3 || null,
      EWZ: {
        ...(gl.EWZ || {}),
        pre_price: ewzExtended?.pre_price ?? null,
        pre_change: ewzExtended?.pre_change ?? null,
        post_price: ewzExtended?.post_price ?? null,
        post_change: ewzExtended?.post_change ?? null
      },
      VIX: gl.VIX || null,
      DXY: gl.DXY || null
    });
  } catch (err) {
    console.error("Erro em /api/quotes:", err.message);
    res.status(500).json({ error: "erro ao buscar dados" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});