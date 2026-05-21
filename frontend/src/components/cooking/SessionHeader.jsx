const STATUS_LABELS = {
  gathering_prefs: 'Gathering preferences',
  confirmed: 'Recipe confirmed',
  cooking: 'Cooking',
  completed: 'Completed',
};

export default function SessionHeader({ session }) {
  if (!session) {
    return (
      <div className="session-banner">
        <div className="session-banner__left">
          <div className="session-banner__icon">👩‍🍳</div>
          <div>
            <p className="session-banner__title">New cooking session</p>
            <p className="session-banner__subtitle">Grace will connect when you open this page</p>
          </div>
        </div>
      </div>
    );
  }

  const progress =
    session.totalSteps > 0
      ? Math.round((session.currentStep / session.totalSteps) * 100)
      : 0;

  const statusKey = session.status ?? 'gathering_prefs';

  return (
    <div className="session-banner">
      <div className="session-banner__left">
        <div className="session-banner__icon">🍳</div>
        <div>
          <p className="session-banner__title">{session.dishName}</p>
          <p className="session-banner__subtitle">
            {session.servings ? `${session.servings} servings · ` : ''}
            Guided by Grace
          </p>
        </div>
      </div>

      <div className="session-banner__right">
        {session.totalSteps > 0 && (
          <div className="session-progress">
            <div className="session-progress__track">
              <div
                className="session-progress__fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="session-progress__label">
              {session.currentStep}/{session.totalSteps}
            </span>
          </div>
        )}
        <span className={`status-pill status-pill--${statusKey}`}>
          {STATUS_LABELS[statusKey] ?? session.status}
        </span>
      </div>
    </div>
  );
}
