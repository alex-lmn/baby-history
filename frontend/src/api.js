import { getToken } from './auth.js';

const BASE = '/api';

async function request(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...opts, headers });

  if (!res.ok) {
    let msg;
    try { msg = (await res.json()).error; } catch { msg = `HTTP ${res.status}`; }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login:    (username, password) =>
    request('/auth/login',    { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Matchs
  listMatches:  ()                        => request('/matches'),
  current:      ()                        => request('/matches/current'),
  create:       (team_a, team_b)          =>
    request('/matches', { method: 'POST', body: JSON.stringify({ team_a, team_b }) }),
  updateScore:  (id, score_a, score_b)    =>
    request(`/matches/${id}/score`, { method: 'PATCH', body: JSON.stringify({ score_a, score_b }) }),
  finish:       (id)                      =>
    request(`/matches/${id}/finish`, { method: 'POST' }),
  remove:       (id)                      =>
    request(`/matches/${id}`, { method: 'DELETE' }),
};
