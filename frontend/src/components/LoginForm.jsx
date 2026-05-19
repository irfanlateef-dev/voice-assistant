import { useState } from 'react';

import { DEMO_USER } from '../config/demoUser.js';

export default function LoginForm({ onLogin, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(email.trim(), name.trim() || undefined);
  };

  const fillDemo = () => {
    setEmail(DEMO_USER.email);
    setName(DEMO_USER.name);
  };

  const loginAsDemo = async () => {
    setEmail(DEMO_USER.email);
    setName(DEMO_USER.name);
    await onLogin(DEMO_USER.email, DEMO_USER.name);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Personal Assistant</h1>
        <p className="login-subtitle">Sign in to manage tasks and notes by voice.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </label>

          <label>
            Name <span className="optional">(optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <div className="login-actions">
            <button
              type="button"
              className="control-btn login-demo-fill"
              onClick={fillDemo}
              disabled={isLoading}
            >
              Fill demo details
            </button>
            <button
              type="button"
              className="control-btn login-demo-signin"
              onClick={loginAsDemo}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in as demo'}
            </button>
          </div>

          <button type="submit" className="control-btn control-btn--primary login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
