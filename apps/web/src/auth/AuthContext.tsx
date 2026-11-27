import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, setAccessToken } from '../lib/api';

interface AuthUser { id: string; name: string; email: string; }
interface Organization { id: string; name: string; slug: string; role: string; }
interface AuthState { user: AuthUser; organization: Organization; }
interface AuthContextValue { state: AuthState | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string, organizationName: string) => Promise<void>; logout: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const acceptSession = (result: { accessToken: string; user?: AuthUser; organization?: Organization }) => {
    setAccessToken(result.accessToken);
    if (result.user && result.organization) setState({ user: result.user, organization: result.organization });
  };
  const refresh = useCallback(async () => {
    const result = await apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
    setAccessToken(result.accessToken);
  }, []);
  useEffect(() => { refresh().catch(() => setState(null)).finally(() => setLoading(false)); }, [refresh]);
  const login = async (email: string, password: string) => {
    const result = await apiRequest<{ accessToken: string; user: AuthUser; organization: Organization }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    acceptSession(result);
  };
  const register = async (name: string, email: string, password: string, organizationName: string) => {
    const result = await apiRequest<{ accessToken: string; user: AuthUser; organization: Organization }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, organizationName }) });
    acceptSession(result);
  };
  const logout = async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } finally { setAccessToken(null); setState(null); }
  };
  const value = useMemo(() => ({ state, loading, login, register, logout }), [state, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
