const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { DB_PATH } = require('../config/paths');
const { MASTER_USERNAME, MASTER_PASSWORD } = require('../constants/auth');

const db = new Database(DB_PATH);

function migrateUsersTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'subscriber',
      active INTEGER NOT NULL DEFAULT 1,
      plan TEXT NOT NULL DEFAULT 'monthly',
      expires_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  if (!columns.includes('plan')) db.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'monthly';");
  if (!columns.includes('expires_at')) db.exec('ALTER TABLE users ADD COLUMN expires_at TEXT;');
}

function seedMasterUser() {
  const existingMaster = db.prepare('SELECT id FROM users WHERE username = ?').get(MASTER_USERNAME);
  if (existingMaster) return;

  const passwordHash = bcrypt.hashSync(MASTER_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, role, active, plan, expires_at, created_at)
    VALUES (?, ?, ?, 1, ?, ?, ?)
  `).run(MASTER_USERNAME, passwordHash, 'master', 'master', null, new Date().toISOString());

  console.log(`[AUTH] Usuário master criado: ${MASTER_USERNAME}`);
}

function initializeDatabase() {
  migrateUsersTable();
  seedMasterUser();
}

module.exports = {
  db,
  initializeDatabase
};
