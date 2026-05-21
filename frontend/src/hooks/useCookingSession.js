import { useCallback, useEffect, useState } from 'react';

import { API_BASE } from '../config/api.js';

export function useCookingSession(getToken, refreshKey = 0, sessionId = null) {
  const [session, setSession] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!getToken) return;

    // New dish mode — nothing loaded until Grace creates a session via voice.
    if (!sessionId) {
      setSession(null);
      setIngredients([]);
      setSteps([]);
      setNotes([]);
      setError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const sessionRes = await fetch(`${API_BASE}/api/cooking/session/${sessionId}`, { headers });
      if (!sessionRes.ok) throw new Error('Failed to load cooking session');

      const sessionData = await sessionRes.json();
      const loadedSession = sessionData.session ?? null;
      setSession(loadedSession);
      setIngredients(loadedSession?.ingredients ?? []);
      setSteps(loadedSession?.steps ?? []);

      if (loadedSession?.id) {
        const notesRes = await fetch(
          `${API_BASE}/api/cooking/session/${loadedSession.id}/notes`,
          { headers },
        );
        if (!notesRes.ok) throw new Error('Failed to load session notes');
        const notesData = await notesRes.json();
        setNotes(notesData.notes ?? []);
      } else {
        setNotes([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, sessionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  return { session, ingredients, steps, notes, isLoading, error, refresh: fetchAll };
}
