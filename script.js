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

function atualizarEWZ(ewz){

  if(!ewz) return;

  const p = document.getElementById("ewz_price");
  const c = document.getElementById("ewz_change");
  const a = document.getElementById("ewz_after");

  const price = Number(ewz.price).toFixed(2);
  const change = Number(ewz.change).toFixed(2);

  p.innerText = price;
  c.innerText = change;

  colorir(c, change);

  if(ewz.after_price){
    const ap = Number(ewz.after_price).toFixed(2);
    const ac = Number(ewz.after_change).toFixed(2);
    a.innerText = ap + " ("+ac+"%)";
  }else{
    a.innerText = "--";
  }
}

function colorir(el,val){

  if(val>0) el.style.color="#22c55e";
  else if(val<0) el.style.color="#ef4444";
  else el.style.color="white";
}

setInterval(atualizarRadar,2000);
atualizarRadar();