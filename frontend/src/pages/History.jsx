import { useEffect, useState } from 'react';
import { api } from '../api.js';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('fr-FR');
}

function winner(m) {
  if (m.status !== 'finished') return null;
  if (m.score_a > m.score_b) return m.team_a;
  if (m.score_b > m.score_a) return m.team_b;
  return 'Égalité';
}

export default function History() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setMatches(await api.listMatches());
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Supprimer ce match ?')) return;
    await api.remove(id);
    load();
  };

  return (
    <section className="card">
      <h2>Historique des parties</h2>
      {error && <p className="error">{error}</p>}
      {matches.length === 0 ? (
        <p>Aucun match enregistré pour le moment.</p>
      ) : (
        <table className="history">
          <thead>
            <tr>
              <th>Date</th>
              <th>Équipe A</th>
              <th>Score</th>
              <th>Équipe B</th>
              <th>Statut</th>
              <th>Vainqueur</th>
              <th>Créé par</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td>{formatDate(m.started_at)}</td>
                <td>{m.team_a}</td>
                <td><strong>{m.score_a} - {m.score_b}</strong></td>
                <td>{m.team_b}</td>
                <td>
                  <span className={`badge ${m.status}`}>
                    {m.status === 'live' ? 'En direct' : 'Terminé'}
                  </span>
                </td>
                <td>{winner(m) || '—'}</td>
                <td>
                  {m.created_by
                    ? <span className="creator-chip">👤 {m.created_by}</span>
                    : <span style={{ color: '#475569' }}>—</span>}
                </td>
                <td>
                  <button className="danger small" onClick={() => remove(m.id)}>
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
