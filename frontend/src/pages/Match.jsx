import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Match() {
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState({ a: false, b: false });
  const prevScore = useRef({ a: 0, b: 0 });

  const refresh = async () => {
    try {
      const m = await api.current();
      setMatch(m);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, []);

  // Détecte les buts depuis la dernière mise à jour (multi-écrans)
  useEffect(() => {
    if (!match) return;
    const prev = prevScore.current;
    if (match.score_a > prev.a) triggerFlash('a');
    if (match.score_b > prev.b) triggerFlash('b');
    prevScore.current = { a: match.score_a, b: match.score_b };
  }, [match?.score_a, match?.score_b]);

  const triggerFlash = (side) => {
    setFlash((f) => ({ ...f, [side]: true }));
    setTimeout(() => setFlash((f) => ({ ...f, [side]: false })), 800);
  };

  const start = async (e) => {
    e.preventDefault();
    setError(null);
    if (!teamA.trim() || !teamB.trim()) {
      setError("Renseigne les deux noms d'équipes.");
      return;
    }
    try {
      const m = await api.create(teamA.trim(), teamB.trim());
      prevScore.current = { a: 0, b: 0 };
      setMatch(m);
      setTeamA('');
      setTeamB('');
    } catch (e) {
      setError(e.message);
    }
  };

  const bump = async (side, delta) => {
    if (!match) return;
    const newA = side === 'a' ? Math.max(0, match.score_a + delta) : match.score_a;
    const newB = side === 'b' ? Math.max(0, match.score_b + delta) : match.score_b;
    if (delta > 0) triggerFlash(side);
    const updated = await api.updateScore(match.id, newA, newB);
    prevScore.current = { a: updated.score_a, b: updated.score_b };
    setMatch(updated);
  };

  const finish = async () => {
    if (!match) return;
    await api.finish(match.id);
    setMatch(null);
  };

  if (!match) {
    return (
      <section className="card">
        <h2>Nouveau match</h2>
        <p className="creator-hint">Vous êtes connecté en tant que <strong>{user.username}</strong> — votre nom sera enregistré sur la partie.</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={start} className="form">
          <input
            placeholder="Équipe A (ex: Bleus)"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
          />
          <span className="vs">VS</span>
          <input
            placeholder="Équipe B (ex: Rouges)"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
          />
          <button type="submit">Lancer la partie</button>
        </form>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="match-header">
        <h2>
          Match en cours{' '}
          <span className="live-badge">● LIVE</span>
        </h2>
        {match.created_by && (
          <span className="created-by">Lancé par {match.created_by}</span>
        )}
      </div>

      <div className="scoreboard">
        <div className={`team${flash.a ? ' goal' : ''}`}>
          <h3>{match.team_a}</h3>
          <div className="score">{match.score_a}</div>
          <div className="actions">
            <button onClick={() => bump('a', -1)}>−1</button>
            <button className="primary" onClick={() => bump('a', 1)}>+1 BUT</button>
          </div>
        </div>
        <div className="separator">VS</div>
        <div className={`team${flash.b ? ' goal' : ''}`}>
          <h3>{match.team_b}</h3>
          <div className="score">{match.score_b}</div>
          <div className="actions">
            <button onClick={() => bump('b', -1)}>−1</button>
            <button className="primary" onClick={() => bump('b', 1)}>+1 BUT</button>
          </div>
        </div>
      </div>
      <button className="danger" onClick={finish}>Terminer le match</button>
    </section>
  );
}
