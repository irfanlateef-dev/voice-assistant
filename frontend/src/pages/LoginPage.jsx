import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const { login, signup, isLoading, error, clearError } = useAuth();

  const goToApp = () => navigate('/app', { replace: true });

  const handleLogin = async (credentials) => {
    await login(credentials);
    goToApp();
  };

  const handleSignup = async (payload) => {
    await signup(payload);
    goToApp();
  };

  return (
    <LoginForm
      mode={mode}
      onModeChange={setMode}
      onLogin={handleLogin}
      onSignup={handleSignup}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
    />
  );
}
