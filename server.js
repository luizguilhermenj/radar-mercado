const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

async function fetchBrazil() {
  const body = {
    symbols: {
      tickers: [
        "BMFBOVESPA:PETR4",
        "BMFBOVESPA:VALE3",
        "BMFBOVESPA:IFNC",
        "BMFBOVESPA:ICON"
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

  if (Array.isArray(json.data)) {
    json.data.forEach(item => {
      const rawSymbol = item.s.split(":")[1];

      result[rawSymbol] = {
        price: item.d?.[0] ?? null,
        change: item.d?.[1] ?? null
      };
    });
  }

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

  if (Array.isArray(json.data)) {
    json.data.forEach(item => {
      const symbol = item.s.split(":")[1];

      result[symbol] = {
        price: item.d?.[0] ?? null,
        change: item.d?.[1] ?? null
      };
    });
  }

  return result;
}

app.get("/api/quotes", async (req, res) => {
  try {
    const br = await fetchBrazil();
    const gl = await fetchGlobal();

    res.json({
      PETR4: br.PETR4 || null,
      VALE3: br.VALE3 || null,
      IFNC: br.IFNC || null,
      ICON: br.ICON || null,
      DI1FUT: null,
      EWZ: {
        ...(gl.EWZ || {}),
        pre_price: null,
        pre_change: null,
        post_price: null,
        post_change: null
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