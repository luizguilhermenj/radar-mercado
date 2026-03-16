const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMarketSnapshot, getEventsSnapshot } = require('../services/market');

const router = express.Router();

router.get('/events', requireAuth, (req, res) => {
  res.json(getEventsSnapshot());
});

router.get('/quotes', requireAuth, async (req, res) => {
  try {
    const snapshot = await getMarketSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error('Erro em /api/quotes:', error.message);
    res.status(500).json({ error: 'Falha ao consultar mercado.' });
  }
});

router.get('/market', requireAuth, async (req, res) => {
  try {
    const snapshot = await getMarketSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error('Erro em /api/market:', error.message);
    res.status(500).json({ error: 'Falha ao consultar mercado.' });
  }
});

module.exports = router;
