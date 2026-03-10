async function atualizarRadar() {

  const r = await fetch("/api/quotes");
  const d = await r.json();

  atualizar("petr4", d.PETR4);
  atualizar("vale3", d.VALE3);
  atualizar("vix", d.VIX);
  atualizar("dxy", d.DXY);

  atualizarEWZ(d.EWZ);
}

function atualizar(id, ativo){

  if(!ativo) return;

  const p = document.getElementById(id+"_price");
  const c = document.getElementById(id+"_change");

  const price = Number(ativo.price).toFixed(2);
  const change = Number(ativo.change).toFixed(2);

  p.innerText = price;
  c.innerText = change;

  colorir(c, change);
}

function atualizarEWZ(ewz) {
  if (!ewz) return;

  const p = document.getElementById("ewz_price");
  const c = document.getElementById("ewz_change");
  const a = document.getElementById("ewz_after");

  const price = Number(ewz.price).toFixed(2);
  const change = Number(ewz.change).toFixed(2);

  p.innerText = price;
  c.innerText = change;
  colorir(c, change);

  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const totalMin = hora * 60 + minuto;

  const inicioPre = 5 * 60;       // 05:00
  const fimPre = 10 * 60 + 30;    // 10:30
  const inicioAfter = 17 * 60;    // 17:00
  const fimAfter = 21 * 60;       // 21:00

  const emPre = totalMin >= inicioPre && totalMin < fimPre;
  const emAfter = totalMin >= inicioAfter && totalMin < fimAfter;

  if (emPre && ewz.pre_price != null) {
    const ep = Number(ewz.pre_price).toFixed(2);
    const ec = Number(ewz.pre_change).toFixed(2);
    a.innerText = "PRE: " + ep + " (" + ec + "%)";
    colorir(a, ewz.pre_change);
    return;
  }

  if (emAfter && ewz.post_price != null) {
    const ep = Number(ewz.post_price).toFixed(2);
    const ec = Number(ewz.post_change).toFixed(2);
    a.innerText = "AFTER: " + ep + " (" + ec + "%)";
    colorir(a, ewz.post_change);
    return;
  }

  a.innerText = "--";
  a.style.color = "white";
}

function colorir(el, val) {
  const n = Number(val);

  if (n > 0) el.style.color = "#22c55e";
  else if (n < 0) el.style.color = "#ef4444";
  else el.style.color = "white";
}

setInterval(atualizarRadar,2000);
atualizarRadar();