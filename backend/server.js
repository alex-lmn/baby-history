// IMPORTANT : OTel doit être require en tout premier pour patcher les modules
require('./otel');

const express = require('express');
const cors = require('cors');
const promClient = require('prom-client');
const { pool, initDb } = require('./db');
const { router: authRouter, authMiddleware } = require('./auth');

// prom-client — registre séparé de l'OTel (port 9464)
const register = promClient.register;
promClient.collectDefaultMetrics({ register });

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const httpTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status'],
});

const app = express();
app.use(cors());
app.use(express.json());

// Middleware HTTP metrics — doit être avant les routes
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ?? req.path;
    end({ method: req.method, route, status: res.statusCode });
    httpTotal.inc({ method: req.method, route, status: res.statusCode });
  });
  next();
});

// Endpoint prom-client (dashboard 11159)
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Auth routes
app.use('/api/auth', authRouter);

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Liste des matchs (historique + en cours)
app.get('/api/matches', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM matches ORDER BY started_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Récupère le match en cours (le dernier "live")
app.get('/api/matches/current', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM matches WHERE status = 'live' ORDER BY started_at DESC LIMIT 1"
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Détail d'un match
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM matches WHERE id = $1', [
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: 'Match introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Création d'un nouveau match — authentification obligatoire
app.post('/api/matches', authMiddleware, async (req, res) => {
  const { team_a, team_b } = req.body;
  if (!team_a || !team_b) {
    return res.status(400).json({ error: 'team_a et team_b sont obligatoires' });
  }
  try {
    await pool.query(
      "UPDATE matches SET status = 'finished', finished_at = NOW() WHERE status = 'live'"
    );
    const { rows } = await pool.query(
      `INSERT INTO matches (team_a, team_b, score_a, score_b, status, created_by)
       VALUES ($1, $2, 0, 0, 'live', $3) RETURNING *`,
      [team_a, team_b, req.user.username]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mise à jour du score en direct
app.patch('/api/matches/:id/score', async (req, res) => {
  const { score_a, score_b } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE matches
       SET score_a = COALESCE($1, score_a),
           score_b = COALESCE($2, score_b)
       WHERE id = $3 RETURNING *`,
      [score_a, score_b, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Match introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Termine un match
app.post('/api/matches/:id/finish', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE matches SET status = 'finished', finished_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Match introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppression
app.delete('/api/matches/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM matches WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] écoute sur ${PORT}`));
  })
  .catch((err) => {
    console.error('Démarrage impossible :', err);
    process.exit(1);
  });
