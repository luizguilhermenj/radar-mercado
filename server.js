const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.redirect('/login');
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Radar Mercado rodando em http://localhost:${PORT}`);
});
