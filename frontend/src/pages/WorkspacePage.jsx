import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AssistantPanel from '../components/AssistantPanel.jsx';
import ControlBar from '../components/ControlBar.jsx';
import NotesPanel from '../components/NotesPanel.jsx';
import TaskPanel from '../components/TaskPanel.jsx';
import TranscriptFeed from '../components/TranscriptFeed.jsx';
import { useAssistantData } from '../hooks/useAssistantData.js';
import { useAuth } from '../hooks/useAuth.js';
import { useVoiceAgent } from '../hooks/useVoiceAgent.js';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAction = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { tasks, notes, isLoading: dataLoading } = useAssistantData(getToken, refreshKey);

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
  } = useVoiceAgent(getToken, { onAction: handleAction });

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

  const handleLogout = async () => {
    await disconnect();
    logout();
    navigate('/login', { replace: true });
  };

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
          isAssistantLive={isAssistantLive}
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
