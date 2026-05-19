import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function useAssistantData(token, refreshKey = 0) {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
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
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  return { tasks, notes, isLoading, error, refresh: fetchAll };
}
