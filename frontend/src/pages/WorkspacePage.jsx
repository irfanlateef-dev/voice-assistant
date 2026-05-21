import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AssistantPanel from '../components/AssistantPanel.jsx';
import ControlBar from '../components/ControlBar.jsx';
import TranscriptFeed from '../components/TranscriptFeed.jsx';
import SessionHeader from '../components/cooking/SessionHeader.jsx';
import IngredientChecklist from '../components/cooking/IngredientChecklist.jsx';
import StepTracker from '../components/cooking/StepTracker.jsx';
import NotesPanel from '../components/cooking/NotesPanel.jsx';
import { useCookingSession } from '../hooks/useCookingSession.js';
import { useAuth } from '../hooks/useAuth.js';
import { useVoiceAgent } from '../hooks/useVoiceAgent.js';

const COOKING_ACTIONS = new Set([
  'ingredient_added',
  'step_advanced',
  'step_completed',
  'recipe_saved',
  'progress_checked',
  'note_saved',
  'session_created',
  'session_completed',
  'preferences_saved',
]);

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user, getToken, logout, isLoading, token } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConversation, setShowConversation] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleAction = useCallback(
    (msg) => {
      const action = typeof msg === 'string' ? msg : msg?.action;
      const data = typeof msg === 'object' ? msg?.data : null;

      if (action === 'session_created' && data?.id && !sessionId) {
        navigate(`/app/cook/${data.id}`, { replace: true });
      }

      if (action && COOKING_ACTIONS.has(action)) {
        setRefreshKey((k) => k + 1);
      }
    },
    [navigate, sessionId],
  );

  const { session, ingredients, steps, notes, isLoading: dataLoading } = useCookingSession(
    getToken,
    refreshKey,
    sessionId ?? null,
  );

  const {
    connect,
    disconnect,
    reconnect,
    isConnected,
    isConnecting,
    isDisconnecting,
    isStalled,
    status,
    transcript,
    isMuted,
    toggleMute,
    greeting,
    connectError,
  } = useVoiceAgent(getToken, {
    onAction: handleAction,
    sessionId: sessionId ?? null,
    autoConnect: true,
    authReady: !isLoading && !!token,
  });

  const { latestAssistantMessage, isAssistantLive } = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i].role === 'assistant') {
        return {
          latestAssistantMessage: transcript[i].text,
          isAssistantLive: Boolean(transcript[i].interim),
        };
      }
    }
    return { latestAssistantMessage: '', isAssistantLive: false };
  }, [transcript]);

  const addedCount = ingredients.filter((i) => i.status === 'added').length;

  const handleLogout = async () => {
    await disconnect();
    logout();
    navigate('/login', { replace: true });
  };

  const handleBack = async () => {
    await disconnect();
    navigate('/app');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">HomeChef AI</p>
          <h1>Cooking workspace</h1>
          <p className="app-header-sub">{user?.email}</p>
        </div>
        <div className="app-header__actions">
          <button
            type="button"
            className={`header-toggle${showConversation ? ' header-toggle--active' : ''}`}
            onClick={() => setShowConversation((v) => !v)}
            aria-pressed={showConversation}
          >
            Conversation
          </button>
          <button
            type="button"
            className={`header-toggle${showNotes ? ' header-toggle--active' : ''}`}
            onClick={() => setShowNotes((v) => !v)}
            aria-pressed={showNotes}
          >
            Session notes{notes.length > 0 ? ` (${notes.length})` : ''}
          </button>
          <button type="button" className="header-back" onClick={handleBack}>
            My dishes
          </button>
          <button type="button" className="header-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        <div
          className={`cooking-dashboard${showConversation ? ' cooking-dashboard--conversation' : ''}`}
        >
          <SessionHeader session={session} />

          {connectError && !isConnected && !isConnecting && (
            <p className="connect-error">{connectError}</p>
          )}

          {showConversation ? (
            <section className="cooking-panel cooking-panel--conversation">
              <TranscriptFeed
                transcript={transcript}
                greeting={greeting}
                isConnected={isConnected}
              />
            </section>
          ) : (
            <>
              <section className="cooking-panel cooking-panel--ingredients">
                <div className="cooking-panel__header">
                  <h2 className="cooking-panel__title">Ingredients</h2>
                  {ingredients.length > 0 && (
                    <span className="cooking-panel__meta">
                      {addedCount}/{ingredients.length} added
                    </span>
                  )}
                </div>
                <div className="cooking-panel__body">
                  <IngredientChecklist ingredients={ingredients} isLoading={dataLoading} />
                </div>
              </section>

              <section className="cooking-panel cooking-panel--steps">
                <div className="cooking-panel__header">
                  <h2 className="cooking-panel__title">Steps</h2>
                  {steps.length > 0 && (
                    <span className="cooking-panel__meta">
                      Step {session?.currentStep ?? 0} of {steps.length}
                    </span>
                  )}
                </div>
                <div className="cooking-panel__body">
                  <StepTracker
                    steps={steps}
                    currentStep={session?.currentStep ?? 0}
                    isLoading={dataLoading}
                  />
                </div>
              </section>
            </>
          )}

          <section className="cooking-panel cooking-panel--assistant">
            {showNotes ? (
              <>
                <div className="cooking-panel__header">
                  <h2 className="cooking-panel__title">Session notes</h2>
                  {notes.length > 0 && (
                    <span className="cooking-panel__meta">{notes.length}</span>
                  )}
                </div>
                <div className="cooking-panel__body">
                  <NotesPanel notes={notes} isLoading={dataLoading} />
                </div>
              </>
            ) : (
              <>
                <div className="cooking-panel__header">
                  <h2 className="cooking-panel__title">Grace</h2>
                  <span className="cooking-panel__meta">Voice assistant</span>
                </div>
                <div className="cooking-panel__body" style={{ padding: 0 }}>
                  <AssistantPanel
                    compact
                    status={status}
                    isConnected={isConnected}
                    greeting={greeting}
                    latestAssistantMessage={latestAssistantMessage}
                    isAssistantLive={isAssistantLive}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <ControlBar
        isConnected={isConnected}
        isConnecting={isConnecting}
        isDisconnecting={isDisconnecting}
        isStalled={isStalled}
        status={status}
        isMuted={isMuted}
        onConnect={connect}
        onDisconnect={() => disconnect()}
        onReconnect={reconnect}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
