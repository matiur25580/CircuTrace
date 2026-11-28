import { useAuth } from './auth/AuthContext';
import AuthPage from './auth/AuthPage';
import Dashboard from './Dashboard';
import PublicPassportPage from './PublicPassportPage';

export default function App() {
  const { state, loading, logout } = useAuth();
  if (window.location.pathname.startsWith('/passport/')) return <PublicPassportPage />;
  if (loading) return <div className="auth-loading">Loading secure workspace…</div>;
  if (!state) return <AuthPage />;
  return <Dashboard user={state.user} organization={state.organization} onLogout={logout} />;
}
