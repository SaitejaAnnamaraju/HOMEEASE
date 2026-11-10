import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { DEMO } from '../data/constants.js';
import Icon from '../components/Icon.jsx';
import AuthAside from '../components/AuthAside.jsx';

export default function Login() {
  const { user, login, toast, db } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(params.get('role') === 'worker' ? 'worker' : 'customer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const redirect = params.get('redirect');

  if (user) return <Navigate to={redirect && user.role === 'customer' ? redirect : user.role === 'worker' ? '/worker' : '/customer'} replace />;

  const go = (u) => {
    const dest = u.role === 'worker' ? '/worker' : redirect || '/customer';
    navigate(dest, { replace: true });
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    const res = login(form.email, form.password);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.user.role !== role) {
      toast(`Signed in to your ${res.user.role === 'worker' ? 'helper' : 'customer'} account.`, 'info');
    } else {
      toast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
    }
    go(res.user);
  };

  const demo = (kind) => {
    let res = login(DEMO[kind].email, DEMO[kind].password);
    if (res.error) {
      db.resetDemoData();
      res = login(DEMO[kind].email, DEMO[kind].password);
    }
    toast(kind === 'customer' ? 'Logged in as demo customer Ananya.' : 'Logged in as demo helper Lakshmi.', 'success');
    go(res.user);
  };

  const fill = () => setForm({ email: DEMO[role].email, password: DEMO[role].password });

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h1>Welcome back</h1>
          <p className="muted">Log in to manage your bookings.</p>

          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={role === 'customer'} className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              <Icon name="user" size={16} /> Customer
            </button>
            <button type="button" role="tab" aria-selected={role === 'worker'} className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}>
              <Icon name="briefcase" size={16} /> Helper
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="form-field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </label>
          <label className="form-field">
            <span>Password</span>
            <div className="input-wrap">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••"
              />
              <button type="button" className="input-icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                <Icon name="eye" size={18} />
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary btn-block btn-lg">
            Log in
          </button>
          <button type="button" className="link-btn" onClick={fill}>
            Fill {role === 'worker' ? 'helper' : 'customer'} demo credentials
          </button>

          <div className="divider">
            <span>or jump straight in</span>
          </div>
          <div className="demo-buttons">
            <button type="button" className="btn btn-ghost" onClick={() => demo('customer')}>
              <Icon name="user" size={18} /> Demo Customer
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => demo('worker')}>
              <Icon name="briefcase" size={18} /> Demo Worker
            </button>
          </div>

          <p className="auth-switch">
            New to HomeEase? <Link to={`/register?role=${role}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
