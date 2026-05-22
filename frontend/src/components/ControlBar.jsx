import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function ControlBar({
  isConnected,
  isConnecting,
  isDisconnecting,
  isStalled,
  status,
  isMuted,
  audioInputDevices = [],
  selectedAudioInputId = '',
  onConnect,
  onDisconnect,
  onReconnect,
  onToggleMute,
  onRefreshAudioInput,
  onSelectAudioInput,
}) {
  const [showMicMenu, setShowMicMenu] = useState(false);
  const micControlRef = useRef(null);

  const statusLabels = {
    idle: 'Ready',
    connecting: 'Connecting to Grace…',
    listening: 'Listening',
    speaking: 'Speaking',
    interrupted: 'Interrupted',
    thinking: 'Thinking',
    stalled: 'Not responding',
  };

  const isBusy = isConnecting || isDisconnecting;

  let buttonLabel;
  if (isConnecting) buttonLabel = 'Connecting…';
  else if (isDisconnecting) buttonLabel = 'Ending…';
  else if (isConnected) buttonLabel = 'End session';
  else buttonLabel = 'Connect to Grace';

  useEffect(() => {
    if (!showMicMenu) return undefined;

    const handlePointerDown = (event) => {
      if (micControlRef.current?.contains(event.target)) return;
      setShowMicMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showMicMenu]);

  const handleToggleMicMenu = async () => {
    if (showMicMenu) {
      setShowMicMenu(false);
      return;
    }

    await onRefreshAudioInput?.({ requestPermission: true });
    setShowMicMenu(true);
  };

  const handleSelectMic = (deviceId) => {
    onSelectAudioInput?.(deviceId);
    setShowMicMenu(false);
  };

  return (
    <div className="control-bar">
      <button
        type="button"
        className={`control-btn control-btn--primary ${isConnected && !isDisconnecting ? 'connected' : ''}`}
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

      <div className="mic-control" ref={micControlRef}>
        <button
          type="button"
          className={`control-btn control-btn--mute ${isMuted ? 'muted' : ''}`}
          onClick={onToggleMute}
          disabled={!isConnected}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <MicIcon muted={isMuted} />
        </button>

        <button
          type="button"
          className={`mic-control__toggle${showMicMenu ? ' mic-control__toggle--open' : ''}`}
          onClick={handleToggleMicMenu}
          aria-label="Select microphone"
          aria-haspopup="listbox"
          aria-expanded={showMicMenu}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {showMicMenu && (
          <div className="mic-control__menu" role="listbox" aria-label="Available microphones">
            {audioInputDevices.length === 0 ? (
              <p className="mic-control__empty">No microphones found</p>
            ) : (
              audioInputDevices.map((device) => {
                const isActive = device.deviceId === selectedAudioInputId;
                const label = device.label?.trim() || `Microphone ${device.deviceId.slice(0, 8)}…`;

                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`mic-control__option${isActive ? ' mic-control__option--active' : ''}`}
                    onClick={() => handleSelectMic(device.deviceId)}
                  >
                    <span className="mic-control__option-label">{label}</span>
                    {isActive && <Check size={14} aria-hidden="true" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

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
