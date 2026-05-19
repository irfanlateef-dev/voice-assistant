import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const handleLogin = async (email, name) => {
    await login(email, name);
    navigate('/app', { replace: true });
  };

  return <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />;
}
