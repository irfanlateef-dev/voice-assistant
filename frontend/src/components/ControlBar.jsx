export default function ControlBar({
  isConnected,
  isConnecting,
  isDisconnecting,
  isStalled,
  status,
  isMuted,
  onConnect,
  onDisconnect,
  onReconnect,
  onToggleMute,
}) {
  const statusLabels = {
    idle: 'Idle',
    listening: 'Listening',
    speaking: 'Speaking',
    interrupted: 'Interrupted',
    stalled: 'Not responding',
  };

  const isBusy = isConnecting || isDisconnecting;

  let buttonLabel;
  if (isConnecting) buttonLabel = 'Connecting…';
  else if (isDisconnecting) buttonLabel = 'Disconnecting…';
  else if (isConnected) buttonLabel = 'Disconnect';
  else buttonLabel = 'Connect';

  return (
    <div className="control-bar">
      <button
        type="button"
        className={`control-btn control-btn--primary ${isConnected || isDisconnecting ? 'connected' : ''}`}
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isBusy}
      >
        {buttonLabel}
      </button>

      {isStalled && (
        <button
          type="button"
          className="control-btn control-btn--reconnect"
          onClick={onReconnect}
          title="Agent stopped responding — click to reconnect"
        >
          Reconnect
        </button>
      )}

      <button
        type="button"
        className={`control-btn control-btn--mute ${isMuted ? 'muted' : ''}`}
        onClick={onToggleMute}
        disabled={!isConnected}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <MicIcon muted={isMuted} />
      </button>

      <span className={`status-label status-label--${status}`}>
        {statusLabels[status] || status}
      </span>
    </div>
  );
}

function MicIcon({ muted }) {
  if (muted) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" />
        <path d="M12 18v4" stroke="currentColor" strokeWidth="2" />
        <path d="M8 22h8" stroke="currentColor" strokeWidth="2" />
        <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" />
      <path d="M12 18v4" stroke="currentColor" strokeWidth="2" />
      <path d="M8 22h8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
