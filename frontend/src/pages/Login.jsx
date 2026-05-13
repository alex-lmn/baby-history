import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        tab === 'login'
          ? await api.login(username.trim(), password)
          : await api.register(username.trim(), password);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">⚽</div>
        <h1 className="login-title">Baby-Foot</h1>
        <p className="login-subtitle">Gérez vos matchs, suivez vos scores</p>

        <div className="login-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setError(null); }}
          >
            Connexion
          </button>
          <button
            className={tab === 'register' ? 'active' : ''}
            onClick={() => { setTab('register'); setError(null); }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} className="login-form">
          {error && <p className="error">{error}</p>}

          <label>
            <span>Pseudo</span>
            <input
              type="text"
              placeholder="ex: Dupont"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              placeholder={tab === 'register' ? 'Min 4 caractères' : ''}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          <button type="submit" className="primary login-submit" disabled={loading}>
            {loading ? 'Chargement…' : tab === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
