import { useAuth } from './auth/AuthContext';
import AuthPage from './auth/AuthPage';
import Dashboard from './Dashboard';

export default function App() {
  const { state, loading, logout } = useAuth();
  if (loading) return <div className="auth-loading">Loading secure workspace…</div>;
  if (!state) return <AuthPage />;
  return <Dashboard user={state.user} organization={state.organization} onLogout={logout} />;
}
