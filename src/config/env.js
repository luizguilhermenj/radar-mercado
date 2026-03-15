const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

module.exports = {
  ROOT_DIR,
  PORT: Number(process.env.PORT) || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET || 'troque-esta-chave-em-producao'
};
