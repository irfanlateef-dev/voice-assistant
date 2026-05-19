import { AUTH_KEY } from '../hooks/useAuth.js';

export function isAppAuthenticated() {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return Boolean(parsed?.user);
  } catch {
    return false;
  }
}

export function getAppPath() {
  return isAppAuthenticated() ? '/app' : '/login';
}

export function getAppCtaLabel(fallback = 'Get started') {
  return isAppAuthenticated() ? 'Open app' : fallback;
}
