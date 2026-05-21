function truncate(text, words = 8) {
  const parts = text.split(' ');
  if (parts.length <= words) return text;
  return `${parts.slice(0, words).join(' ')}…`;
}

export default function StepTracker({ steps, currentStep, isLoading }) {
  if (isLoading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="panel-skeleton" style={{ height: '3.5rem' }} />
        ))}
      </>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <p className="panel-empty">
        Steps will appear once Grace saves the recipe.
      </p>
    );
  }

  return (
    <div className="step-timeline">
      <div className="step-timeline__line" aria-hidden="true" />
      {steps.map((step) => {
        const isActive = step.status === 'active';
        const isDone = step.status === 'done';
        const stateClass = isActive ? 'step-item--active' : isDone ? 'step-item--done' : 'step-item--upcoming';

        return (
          <div key={step.id} className={`step-item ${stateClass}`}>
            <div className="step-item__dot">
              {isDone ? '✓' : step.stepNumber}
            </div>
            <div className="step-item__content">
              {isActive && (
                <p className="step-item__label">
                  Current step
                  {step.durationMinutes ? ` · ${step.durationMinutes} min` : ''}
                </p>
              )}
              <p className="step-item__text">
                {isActive ? step.instruction : truncate(step.instruction)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
