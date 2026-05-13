import { Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Match from './pages/Match.jsx';
import History from './pages/History.jsx';
import Login from './pages/Login.jsx';

function AppShell() {
  const { user, logout } = useAuth();

  if (!user) return <Login />;

  return (
    <div className="app">
      <header className="topbar">
        <h1>⚽ Baby-Foot</h1>
        <nav>
          <NavLink to="/" end>Match en direct</NavLink>
          <NavLink to="/historique">Historique</NavLink>
        </nav>
        <div className="topbar-user">
          <span className="topbar-username">👤 {user.username}</span>
          <button className="logout-btn" onClick={logout}>Déconnexion</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Match />} />
          <Route path="/historique" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
