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

async function fetchEWZAfter() {
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
      price: q.postMarketPrice ?? null,
      change: q.postMarketChangePercent ?? null
    };
  } catch (error) {
    console.log("EWZ after indisponível:", error.message);
    return null;
  }
}

app.get("/api/quotes", async (req, res) => {
  try {
    const br = await fetchBrazil();
    const gl = await fetchGlobal();
    const ewzAfter = await fetchEWZAfter();

    res.json({
      PETR4: br.PETR4 || null,
      VALE3: br.VALE3 || null,
      EWZ: {
        ...(gl.EWZ || {}),
        after_price: ewzAfter?.price ?? null,
        after_change: ewzAfter?.change ?? null
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