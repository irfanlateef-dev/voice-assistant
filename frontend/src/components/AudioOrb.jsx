export default function AudioOrb({ status }) {
  return (
    <div className={`audio-orb audio-orb--${status}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="orb-core" cx="100" cy="100" r="48" />
        {status === 'speaking' && (
          <>
            <circle className="orb-ring orb-ring-1" cx="100" cy="100" r="58" />
            <circle className="orb-ring orb-ring-2" cx="100" cy="100" r="68" />
            <circle className="orb-ring orb-ring-3" cx="100" cy="100" r="78" />
          </>
        )}
        {status === 'listening' && (
          <circle className="orb-pulse" cx="100" cy="100" r="56" />
        )}
        {status === 'interrupted' && (
          <circle className="orb-flash" cx="100" cy="100" r="52" />
        )}
        {status === 'stalled' && (
          <circle className="orb-flash" cx="100" cy="100" r="52" />
        )}
      </svg>
    </div>
  );
}
