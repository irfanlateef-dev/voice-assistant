import { useEffect, useRef } from 'react';

export default function TranscriptFeed({ transcript, greeting, isConnected }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript]);

  return (
    <section className="chat-panel">
      <header className="chat-panel__header">
        <div>
          <h2>Conversation</h2>
          <p className="chat-panel__subtitle">
            {isConnected ? 'Live transcript — only this panel scrolls.' : 'Connect to begin your session.'}
          </p>
        </div>
      </header>

      <div className="chat-panel__feed" ref={scrollRef}>
        {!isConnected && greeting && (
          <div className="chat-empty">
            <p className="chat-empty__title">Welcome back</p>
            <p className="chat-empty__text">{greeting}</p>
          </div>
        )}

        {transcript.length === 0 && isConnected && (
          <div className="chat-empty">
            <p className="chat-empty__title">You are connected</p>
            <p className="chat-empty__text">Say hello or ask me to add a task.</p>
          </div>
        )}

        {transcript.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`chat-bubble chat-bubble--${msg.role}`}
          >
            <span className="chat-bubble__label">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
