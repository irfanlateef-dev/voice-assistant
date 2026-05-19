import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { DEMO_USER } from '../config/demoUser.js';

function PasswordInput({ id, label, value, onChange, placeholder, minLength, autoComplete, disabled }) {
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={id}>
      {label}
      <span className="login-password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          minLength={minLength}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="login-password-toggle"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export default function LoginForm({ mode, onModeChange, onLogin, onSignup, isLoading, error, onClearError }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const isSignup = mode === 'signup';
  const displayError = localError || error;

  const switchMode = (next) => {
    setLocalError('');
    onClearError?.();
    onModeChange(next);
  };

  const fillDemo = () => {
    setEmail(DEMO_USER.email);
    setPassword(DEMO_USER.password);
    if (isSignup) { setName(DEMO_USER.name); setConfirmPassword(DEMO_USER.password); }
    setLocalError('');
    onClearError?.();
  };

  const loginAsDemo = async () => {
    setLocalError('');
    onClearError?.();
    await onLogin({ email: DEMO_USER.email, password: DEMO_USER.password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    onClearError?.();

    if (isSignup) {
      if (password !== confirmPassword) { setLocalError('Passwords do not match'); return; }
      await onSignup({ name: name.trim(), email: email.trim(), password, confirmPassword });
      return;
    }

    await onLogin({ email: email.trim(), password });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Personal Assistant</h1>
        <p className="login-subtitle">
          {isSignup ? 'Create your account.' : 'Sign in to your account.'}
        </p>

        <div className="login-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={`login-tab ${!isSignup ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('login')}
            disabled={isLoading}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={`login-tab ${isSignup ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('signup')}
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </label>

          <PasswordInput
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
            minLength={isSignup ? 8 : 1}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            disabled={isLoading}
          />

          {isSignup && (
            <PasswordInput
              id="login-confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              minLength={8}
              autoComplete="new-password"
              disabled={isLoading}
            />
          )}

          {displayError && <p className="login-error">{displayError}</p>}

          <div className="login-actions">
            <button type="button" className="control-btn login-demo-fill" onClick={fillDemo} disabled={isLoading}>
              Fill demo details
            </button>
            {!isSignup && (
              <button type="button" className="control-btn login-demo-signin" onClick={loginAsDemo} disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in as demo'}
              </button>
            )}
          </div>

          <button type="submit" className="control-btn control-btn--primary login-btn" disabled={isLoading}>
            {isLoading
              ? isSignup ? 'Creating account…' : 'Signing in…'
              : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
