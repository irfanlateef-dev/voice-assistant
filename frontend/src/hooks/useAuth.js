import { useCallback, useState } from 'react';

import { API_BASE } from '../config/api.js';

export const AUTH_KEY = 'voice-agent-auth';

function readStoredAuth() {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    // Corrupted entry — remove it so it doesn't block login
    try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
    return null;
  }
}

async function parseResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function useAuth() {
  // Synchronous lazy init — reads localStorage on the first render so token
  // and user are available immediately (no async loading phase, no authReady
  // flip-flop that delayed auto-connect on every navigation).
  const [user, setUser] = useState(() => readStoredAuth()?.user ?? null);
  const [token, setToken] = useState(() => readStoredAuth()?.token ?? null);
  // isLoading is only true during explicit login/signup API calls now.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const persist = useCallback((data) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const signup = useCallback(async ({ name, email, password, confirmPassword }) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      return persist(await parseResponse(res));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const login = useCallback(async ({ email, password }) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return persist(await parseResponse(res));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setToken(null);
    setError('');
  }, []);

  const getToken = useCallback(() => Promise.resolve(token), [token]);
  const clearError = useCallback(() => setError(''), []);

  return {
    user,
    token,
    getToken,
    isLoading,
    error,
    signup,
    login,
    logout,
    clearError,
    isAuthenticated: !!token,
  };
}
