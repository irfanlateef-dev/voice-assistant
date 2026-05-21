import AssistantVisual, { getStatusCopy } from './AssistantVisual';

export default function AssistantPanel({
  status,
  isConnected,
  isAgentReady = false,
  greeting,
  latestAssistantMessage,
  isAssistantLive,
  compact = false,
}) {
  const copy = getStatusCopy(status);

  return (
    <aside className={`assistant-panel${compact ? ' assistant-panel--compact' : ''}`}>
      <div className="assistant-panel__visual">
        <AssistantVisual status={status} />
      </div>

      <div className="assistant-panel__status">
        <span className={`assistant-panel__badge assistant-panel__badge--${status}`}>
          {copy.title}
        </span>
        <p className="assistant-panel__hint">{copy.hint}</p>
      </div>

      <div className={`assistant-panel__response${isAssistantLive ? ' assistant-panel__response--live' : ''}`}>
        <p className="assistant-panel__response-label">
          {isAssistantLive ? 'Speaking now' : 'Latest from Grace'}
        </p>
        <p className="assistant-panel__response-text">
          {latestAssistantMessage
            || (isConnected && isAgentReady
              ? 'Grace is listening…'
              : isConnected
                ? 'Connecting to Grace…'
                : greeting || 'Connect to start cooking with Grace.')}
        </p>
      </div>

      <div className="assistant-panel__tips">
        <p className="assistant-panel__tips-title">Try saying</p>
        <ul>
          <li>“I added the garlic.”</li>
          <li>“What&apos;s the next step?”</li>
          <li>“Where did we leave off?”</li>
        </ul>
      </div>
    </aside>
  );
}
