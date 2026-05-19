import { useCallback, useEffect, useState } from 'react';

import { API_BASE } from '../config/api.js';

export function useAssistantData(getToken, refreshKey = 0) {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!getToken) return;

    setIsLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const [tasksRes, notesRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks?status=pending`, { headers }),
        fetch(`${API_BASE}/api/notes?limit=20`, { headers }),
      ]);

      if (!tasksRes.ok || !notesRes.ok) {
        throw new Error('Failed to load assistant data');
      }

      const tasksData = await tasksRes.json();
      const notesData = await notesRes.json();
      setTasks(tasksData.tasks ?? []);
      setNotes(notesData.notes ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  return { tasks, notes, isLoading, error, refresh: fetchAll };
}
