const path = require('path');
const fs = require('fs');
const { ROOT_DIR } = require('./env');

const DATA_DIR = path.join(ROOT_DIR, 'data');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VIEWS_DIR = path.join(ROOT_DIR, 'views');
const DB_PATH = path.join(DATA_DIR, 'auth.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

module.exports = {
  DATA_DIR,
  PUBLIC_DIR,
  VIEWS_DIR,
  DB_PATH
};
