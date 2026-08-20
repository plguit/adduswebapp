import React, { useState } from 'react';
import { AdminDashboard } from './AdminDashboard.jsx';

export function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem('ADMIN_TOKEN') !== null
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Check your admin email and password.');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('ADMIN_TOKEN', data.token);
      setIsLoggedIn(true);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ADMIN_TOKEN');
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  if (isLoggedIn) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="admin-login-viewport">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-sparkle">✦</span>
          <span className="admin-brand-name">ADDUS</span>
          <span className="admin-brand-tag">Admin Portal</span>
        </div>

        <h1 className="admin-login-title">Admin Access</h1>
        <p className="admin-login-subtitle">Sign in with your admin credentials</p>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-field-group">
            <label className="admin-field-label">Email</label>
            <input
              type="email"
              className="admin-field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@addus.in"
              required
              autoFocus
            />
          </div>
          <div className="admin-field-group">
            <label className="admin-field-label">Password</label>
            <input
              type="password"
              className="admin-field-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>
          {error && <div className="admin-error-msg">{error}</div>}
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <a href="/" className="admin-back-link">← Back to ADDUS App</a>
      </div>
    </div>
  );
}
