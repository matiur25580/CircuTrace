import { useState, type FormEvent } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password, organizationName);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to authenticate.'); }
    finally { setBusy(false); }
  };
  return <main className="auth-shell"><section className="auth-brand"><a className="brand" href="/"><span className="brand-mark">C</span><span>Circu<span className="brand-accent">Trace</span></span></a><div className="auth-brand-copy"><span className="eyebrow">PRODUCT INTELLIGENCE, CONNECTED</span><h1>Every product has a story. Make yours traceable.</h1><p>One trusted workspace for product identity, supply chain provenance and circular lifecycle intelligence.</p><div className="auth-trust"><ShieldCheck size={17}/> Enterprise workspace security</div></div><div className="auth-brand-foot">Digital Product Passport · Circular Supply Chain</div></section><section className="auth-form-side"><form className="auth-form" onSubmit={submit}><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span><h2>{mode === 'login' ? 'Sign in to CircuTrace' : 'Create your workspace'}</h2><p>{mode === 'login' ? 'Access your organization’s product intelligence.' : 'Set up your identity and first organization.'}</p>{mode === 'register' && <><label>Full name<input autoComplete="name" required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></label><label>Organization name<input required minLength={2} value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="Company or organization"/></label></>}<label>Work email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/></label><label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 12} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 12 characters'}/></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></button><div className="auth-switch">{mode === 'login' ? 'New to CircuTrace?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></div><small className="auth-terms">By continuing, you agree to your organization’s access and security policies.</small></form></section></main>;
}
