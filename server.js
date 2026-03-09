const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

// rota de teste para cotação
app.get('/api/quotes', (req, res) => {

const data = {

PETR4:{
price:(35+Math.random()*5).toFixed(2),
change:(Math.random()*2-1).toFixed(2)
},

VALE3:{
price:(60+Math.random()*5).toFixed(2),
change:(Math.random()*2-1).toFixed(2)
},

EWZ:{
price:(30+Math.random()*2).toFixed(2),
change:(Math.random()*2-1).toFixed(2)
},

BRENT:{
price:(80+Math.random()*3).toFixed(2),
change:(Math.random()*2-1).toFixed(2)
},

VIX:{
price:(14+Math.random()*3).toFixed(2),
change:(Math.random()*2-1).toFixed(2)
}

};

  res.json(data);

});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});