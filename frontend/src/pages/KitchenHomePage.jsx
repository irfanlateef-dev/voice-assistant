import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Plus, Trash2 } from 'lucide-react';

import { useAuth } from '../hooks/useAuth.js';
import { API_BASE } from '../config/api.js';
import DeleteDishModal from '../components/cooking/DeleteDishModal.jsx';

const STATUS_LABELS = {
  gathering_prefs: 'Gathering preferences',
  confirmed: 'Recipe confirmed',
  cooking: 'Cooking',
};

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function KitchenHomePage() {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/cooking/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your dishes');

      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    setDeletingId(sessionToDelete.id);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cooking/session/${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete dish');
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="kitchen-page">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">HomeChef AI</p>
          <h1>{user?.name || 'Your kitchen'}</h1>
          <p className="app-header-sub">{user?.email}</p>
        </div>
        <button type="button" className="header-logout" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <main className="kitchen-main">
        <div className="kitchen-hero-row">
          <div>
            <h2 className="kitchen-title">Your dishes in progress</h2>
            <p className="kitchen-subtitle">
              Pick up where you left off, or start something new with Grace.
            </p>
          </div>
          <button type="button" className="kitchen-cta" onClick={() => navigate('/app/cook')}>
            <Plus size={18} />
            Start new dish
          </button>
        </div>

        {error && <p className="connect-error">{error}</p>}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="panel-skeleton" style={{ height: '5rem' }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div className="session-banner__icon" style={{ margin: '0 auto 1rem', width: '4rem', height: '4rem', fontSize: '1.75rem' }}>
              👩‍🍳
            </div>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Nothing cooking yet</p>
            <p className="kitchen-subtitle" style={{ marginTop: '0.5rem' }}>
              Tap Start new dish and tell Grace what you want to make.
            </p>
            <button type="button" className="kitchen-cta" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/app/cook')}>
              <ChefHat size={18} />
              Start cooking
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((session) => {
              const progress =
                session.totalSteps > 0
                  ? `Step ${session.currentStep || 0} of ${session.totalSteps}`
                  : STATUS_LABELS[session.status] ?? session.status;

              return (
                <li key={session.id} className="dish-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <div className="dish-card__icon">🍳</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="dish-card__name">{session.dishName}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className={`status-pill status-pill--${session.status ?? 'gathering_prefs'}`}>
                          {STATUS_LABELS[session.status] ?? session.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progress}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          · {formatWhen(session.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" className="dish-card__continue" onClick={() => navigate(`/app/cook/${session.id}`)}>
                      Continue
                    </button>
                    <button
                      type="button"
                      className="dish-card__delete"
                      onClick={() => setSessionToDelete(session)}
                      disabled={deletingId === session.id}
                      aria-label={`Delete ${session.dishName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <DeleteDishModal
        isOpen={Boolean(sessionToDelete)}
        dishName={sessionToDelete?.dishName ?? ''}
        isDeleting={Boolean(sessionToDelete && deletingId === sessionToDelete.id)}
        onCancel={() => {
          if (!deletingId) setSessionToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
