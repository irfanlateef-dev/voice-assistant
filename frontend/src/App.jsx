import { useCallback, useMemo, useState } from 'react';

import AssistantPanel from './components/AssistantPanel';
import ControlBar from './components/ControlBar';
import LoginForm from './components/LoginForm';
import NotesPanel from './components/NotesPanel';
import TaskPanel from './components/TaskPanel';
import TranscriptFeed from './components/TranscriptFeed';
import { useAssistantData } from './hooks/useAssistantData';
import { useAuth } from './hooks/useAuth';
import { useVoiceAgent } from './hooks/useVoiceAgent';

export default function App() {
  const { user, token, isLoading: authLoading, error: authError, login, logout, isAuthenticated } =
    useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAction = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { tasks, notes, isLoading: dataLoading } = useAssistantData(token, refreshKey);

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
  } = useVoiceAgent(token, { onAction: handleAction });

  const latestAssistantMessage = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i].role === 'assistant') return transcript[i].text;
    }
    return '';
  }, [transcript]);

  const handleLogout = async () => {
    await disconnect();
    logout();
  };

  if (authLoading) {
    return <div className="login-screen"><p className="login-subtitle">Loading…</p></div>;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} isLoading={authLoading} error={authError} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Personal Assistant</p>
          <h1>{user?.name || 'Your workspace'}</h1>
          <p className="app-header-sub">{user?.email}</p>
        </div>
        <button type="button" className="header-logout" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <main className="app-main workspace">
        <section className="workspace-left">
          <TranscriptFeed
            transcript={transcript}
            greeting={greeting}
            isConnected={isConnected}
          />

          <div className="workspace-data">
            <TaskPanel tasks={tasks} isLoading={dataLoading} />
            <NotesPanel notes={notes} isLoading={dataLoading} />
          </div>
        </section>

        <AssistantPanel
          status={status}
          isConnected={isConnected}
          greeting={greeting}
          latestAssistantMessage={latestAssistantMessage}
        />
      </main>

      <ControlBar
        isConnected={isConnected}
        isConnecting={isConnecting}
        isDisconnecting={isDisconnecting}
        isStalled={isStalled}
        status={status}
        isMuted={isMuted}
        onConnect={connect}
        onDisconnect={disconnect}
        onReconnect={reconnect}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
