async function atualizar() {
  try {
    const res = await fetch('/api/quotes');
    const data = await res.json();
    const ativos = data.assets || {};

    atualizarAtivo('petr4', ativos.PETR4);
    atualizarAtivo('vale3', ativos.VALE3);
    atualizarAtivo('ewz', ativos.EWZ);
    atualizarAtivo('brent', ativos.BRENT);
    atualizarAtivo('vix', ativos.VIX);
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

function atualizarAtivo(id, ativo) {
  if (!ativo) {
    return;
  }

  const price = ativo.price ?? '--';
  const change = ativo.change ?? '--';

  document.getElementById(`${id}_price`).innerText = price;
  document.getElementById(`${id}_change`).innerText = `${change}%`;
}

setInterval(atualizar, 2000);
atualizar();
