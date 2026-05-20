const STATUS_COPY = {
  idle: {
    title: 'Ready to assist',
    hint: 'Connect and ask me to manage your tasks or notes.',
  },
  listening: {
    title: 'Listening',
    hint: 'Speak naturally — I will respond when you finish.',
  },
  speaking: {
    title: 'Speaking',
    hint: 'You can interrupt me anytime.',
  },
  interrupted: {
    title: 'Interrupted',
    hint: 'Go ahead — I am listening.',
  },
  thinking: {
    title: 'Working on it',
    hint: 'Running your request — this can take a moment.',
  },
  stalled: {
    title: 'Not responding',
    hint: 'Try reconnecting if I stay silent.',
  },
};

export default function AssistantVisual({ status }) {
  const isActive = status === 'speaking' || status === 'listening' || status === 'interrupted' || status === 'thinking';

  return (
    <div className={`siri-orb siri-orb--${status}`} aria-hidden="true">
      <div className="siri-orb__glow" />
      <div className="siri-orb__shell">
        <div className="siri-orb__layer siri-orb__layer--1" />
        <div className="siri-orb__layer siri-orb__layer--2" />
        <div className="siri-orb__layer siri-orb__layer--3" />
        <div className="siri-orb__core" />
      </div>

      {status === 'speaking' && (
        <div className="siri-orb__waves">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="siri-orb__wave" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}

      {status === 'thinking' && (
        <div className="siri-orb__ripple siri-orb__ripple--1" />
      )}

      {status === 'listening' && (
        <div className="siri-orb__ripple siri-orb__ripple--1" />
      )}

      {isActive && <div className="siri-orb__ripple siri-orb__ripple--2" />}
    </div>
  );
}

export function getStatusCopy(status) {
  return STATUS_COPY[status] ?? STATUS_COPY.idle;
}
