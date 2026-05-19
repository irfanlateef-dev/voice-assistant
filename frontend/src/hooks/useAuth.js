import { useCallback, useEffect, useState } from 'react';

import { API_BASE } from '../config/api.js';

export const AUTH_KEY = 'voice-agent-auth';

async function parseResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) { setIsLoading(false); return; }
    try {
      const parsed = JSON.parse(saved);
      setUser(parsed.user);
      setToken(parsed.token);
    } catch {
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
