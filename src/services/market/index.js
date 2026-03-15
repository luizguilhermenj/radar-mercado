const { formatAsset, fetchBrazilQuotes, fetchGlobalQuotes, enrichEwzExtended } = require('./providers');
const { computeIndiceRadar } = require('./radar');
const { getEventsSnapshot } = require('./events');

async function getMarketSnapshot() {
  const [brazil, global] = await Promise.all([
    fetchBrazilQuotes(),
    fetchGlobalQuotes()
  ]);

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

  payload.indiceRadar = computeIndiceRadar(payload);
  return payload;
}

module.exports = {
  getMarketSnapshot,
  getEventsSnapshot
};
