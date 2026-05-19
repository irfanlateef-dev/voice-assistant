import AssistantVisual, { getStatusCopy } from './AssistantVisual';

export default function AssistantPanel({
  status,
  isConnected,
  greeting,
  latestAssistantMessage,
}) {
  const copy = getStatusCopy(status);

  return (
    <aside className="assistant-panel">
      <div className="assistant-panel__visual">
        <AssistantVisual status={status} />
      </div>

      <div className="assistant-panel__status">
        <span className={`assistant-panel__badge assistant-panel__badge--${status}`}>
          {copy.title}
        </span>
        <p className="assistant-panel__hint">{copy.hint}</p>
      </div>

      <div className="assistant-panel__response">
        <p className="assistant-panel__response-label">Latest response</p>
        <p className="assistant-panel__response-text">
          {latestAssistantMessage
            || (isConnected ? 'Waiting for your first message…' : greeting || 'Connect to start talking with your assistant.')}
        </p>
      </div>

      <div className="assistant-panel__tips">
        <p className="assistant-panel__tips-title">Try saying</p>
        <ul>
          <li>“Add a task to call the dentist.”</li>
          <li>“What is on my to-do list?”</li>
          <li>“Note: ideas for the project.”</li>
        </ul>
      </div>
    </aside>
  );
}
