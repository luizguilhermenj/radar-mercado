async function atualizar(){

const res = await fetch('/api/quotes');
const data = await res.json();

atualizarAtivo("petr4",data.PETR4);
atualizarAtivo("vale3",data.VALE3);
atualizarAtivo("ewz",data.EWZ);
atualizarAtivo("brent",data.BRENT);
atualizarAtivo("vix",data.VIX);

}

function atualizarAtivo(id,ativo){

document.getElementById(id+"_price").innerText=ativo.price;
document.getElementById(id+"_change").innerText=ativo.change+"%";

}

setInterval(atualizar,2000);
atualizar();