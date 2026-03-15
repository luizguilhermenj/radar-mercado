const { clamp } = require('../../utils/number');

function computeIndiceRadar(payload) {
  const buySignals = [];
  const sellSignals = [];

  const addSignal = (condition, inverseCondition, weight) => {
    if (condition) buySignals.push(weight);
    else if (inverseCondition) sellSignals.push(weight);
  };

  addSignal((payload.PETR4?.change ?? 0) > 0, (payload.PETR4?.change ?? 0) < 0, 14);
  addSignal((payload.VALE3?.change ?? 0) > 0, (payload.VALE3?.change ?? 0) < 0, 14);
  addSignal((payload.IFNC?.change ?? 0) > 0, (payload.IFNC?.change ?? 0) < 0, 12);
  addSignal((payload.ICON?.change ?? 0) > 0, (payload.ICON?.change ?? 0) < 0, 8);
  addSignal((payload.EWZ?.change ?? 0) > 0, (payload.EWZ?.change ?? 0) < 0, 12);
  addSignal((payload.VIX?.change ?? 0) < 0, (payload.VIX?.change ?? 0) > 0, 16);
  addSignal((payload.DXY?.change ?? 0) < 0, (payload.DXY?.change ?? 0) > 0, 12);
  addSignal((payload.DI1FUT?.change ?? 0) < 0, (payload.DI1FUT?.change ?? 0) > 0, 12);

  const buyScore = buySignals.reduce((total, weight) => total + weight, 0);
  const sellScore = sellSignals.reduce((total, weight) => total + weight, 0);
  const base = Math.max(1, buyScore + sellScore);
  const bullPercent = clamp(Math.round((buyScore / base) * 100), 0, 100);
  const bearPercent = 100 - bullPercent;

  let bias = 'neutro';
  if (bullPercent >= 57) bias = 'compra de índice';
  else if (bearPercent >= 57) bias = 'venda de índice';

  const riskMode = (payload.VIX?.change ?? 0) > 0
    ? 'Risk-off'
    : (payload.VIX?.change ?? 0) < 0
      ? 'Risk-on'
      : 'Neutro';

  const quickRead = bias === 'compra de índice'
    ? {
        title: 'Fluxo pró-risco',
        text: 'Leitura favorece compra do índice, com maior apoio entre Brasil, setores e risco global.'
      }
    : bias === 'venda de índice'
      ? {
          title: 'Fluxo defensivo',
          text: 'Leitura favorece venda do índice, com pressão de risco, dólar e/ou curva.'
        }
      : {
          title: 'Fluxo misto',
          text: 'O radar está equilibrado e sem dominância clara entre compradores e vendedores.'
        };

  const resumoOperacional = bias === 'compra de índice'
    ? {
        title: 'Prioridade compradora',
        text: 'Buscar compras em pullback, evitando perseguição em esticadas.'
      }
    : bias === 'venda de índice'
      ? {
          title: 'Prioridade vendedora',
          text: 'Buscar vendas em repique e respeitar possíveis reversões rápidas.'
        }
      : {
          title: 'Contexto neutro',
          text: 'Menor convicção. Operar seletivamente e reduzir agressividade.'
        };

  return {
    bullPercent,
    bearPercent,
    bias,
    conviction: Math.max(bullPercent, bearPercent),
    riskMode,
    tactical: {
      brasilScore: Math.round(((payload.PETR4?.change ?? 0) + (payload.VALE3?.change ?? 0) + (payload.IFNC?.change ?? 0) + (payload.ICON?.change ?? 0)) * 10) / 10,
      globalScore: Math.round((((payload.EWZ?.change ?? 0) * 0.8) + ((payload.VIX?.change ?? 0) * -1) + ((payload.DXY?.change ?? 0) * -1)) * 10) / 10
    },
    quickRead,
    resumoOperacional
  };
}

module.exports = { computeIndiceRadar };
