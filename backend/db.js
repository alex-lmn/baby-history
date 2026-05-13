const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'baby',
  password: process.env.DB_PASSWORD || 'baby',
  database: process.env.DB_NAME || 'babyfoot',
});

async function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      username     VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS matches (
      id          SERIAL PRIMARY KEY,
      team_a      VARCHAR(80) NOT NULL,
      team_b      VARCHAR(80) NOT NULL,
      score_a     INTEGER NOT NULL DEFAULT 0,
      score_b     INTEGER NOT NULL DEFAULT 0,
      status      VARCHAR(20) NOT NULL DEFAULT 'live',
      created_by  VARCHAR(50),
      started_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMP
    );

    ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);
  `;
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query(sql);
      console.log('[db] schema OK');
      return;
    } catch (err) {
      console.log(`[db] en attente de PostgreSQL... (${retries})`, err.message);
      retries -= 1;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Impossible de se connecter à PostgreSQL');
}

module.exports = { pool, initDb };
