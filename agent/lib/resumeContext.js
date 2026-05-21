const STATUS_LABELS = {
  gathering_prefs: 'gathering your preferences',
  confirmed: 'recipe confirmed, not started cooking yet',
  cooking: 'actively cooking',
};

function summarizePreferences(preferences) {
  if (!preferences) return 'none saved yet';
  if (preferences.summary) return preferences.summary;
  if (Array.isArray(preferences.collected)) {
    return preferences.collected.map(({ topic, answer }) => `${topic}: ${answer}`).join('; ');
  }
  return JSON.stringify(preferences);
}

export function buildResumeGreeting(session) {
  const dish = session.dishName;
  const { status, currentStep, totalSteps } = session;

  if (status === 'gathering_prefs') {
    return `Welcome back! We were getting your ${dish} just right — ready to pick up where we left off?`;
  }

  if (status === 'confirmed') {
    return `Hey again! Your ${dish} is all set — want to start cooking?`;
  }

  if (status === 'cooking' && totalSteps > 0 && currentStep > 0) {
    return `Welcome back to your ${dish}! You were on step ${currentStep} of ${totalSteps} — shall we continue?`;
  }

  return `Welcome back! Let's keep going with your ${dish}.`;
}

export function buildResumeContext(session) {
  if (!session) return '';

  const ingredients = session.ingredients ?? [];
  const steps = session.steps ?? [];
  const activeStep = steps.find((s) => s.status === 'active');
  const pendingStep =
    activeStep ?? steps.find((s) => s.status === 'pending');
  const doneSteps = steps.filter((s) => s.status === 'done');
  const pendingIngredients = ingredients.filter((i) => i.status === 'pending');
  const addedIngredients = ingredients.filter((i) => i.status === 'added');

  const lines = [
    '=== RESUMED COOKING SESSION (critical — read before replying) ===',
    `The user chose to CONTINUE an existing session. Do NOT call start_cooking_session.`,
    `session_id: ${session.id}`,
    `dish: ${session.dishName}`,
    `status: ${session.status} (${STATUS_LABELS[session.status] ?? session.status})`,
    `progress: step ${session.currentStep ?? 0} of ${session.totalSteps ?? steps.length}`,
    `preferences: ${summarizePreferences(session.preferences)}`,
  ];

  if (doneSteps.length > 0) {
    lines.push(`completed steps: ${doneSteps.map((s) => s.stepNumber).join(', ')}`);
  }

  if (activeStep) {
    lines.push(`active step ${activeStep.stepNumber}: ${activeStep.instruction}`);
    if (activeStep.durationMinutes) {
      lines.push(
        `active step timer was reset on reconnect — ask whether this step is still in progress or already done before advancing.`,
      );
    }
  } else if (pendingStep) {
    lines.push(`next pending step ${pendingStep.stepNumber}: ${pendingStep.instruction}`);
  }

  if (addedIngredients.length > 0) {
    lines.push(`ingredients already added: ${addedIngredients.map((i) => i.name).join(', ')}`);
  }

  if (pendingIngredients.length > 0) {
    lines.push(`ingredients still pending: ${pendingIngredients.map((i) => i.name).join(', ')}`);
  }

  lines.push(
    'Resume behaviour: greet warmly, summarise where they left off in one sentence, ask ONE short confirmation question, then continue from the correct phase. Use the session_id above for every tool call.',
  );

  if (session.status === 'cooking' && activeStep) {
    lines.push(
      `If they confirm they want to continue, pick up at step ${activeStep.stepNumber}. If they say that step is already done, call complete_step_and_advance with step_number ${activeStep.stepNumber}.`,
    );
  } else if (session.status === 'cooking' && !activeStep && pendingStep) {
    lines.push(
      `If they confirm, call advance_step with step_number ${pendingStep.stepNumber} before reading that step aloud.`,
    );
  } else if (session.status === 'gathering_prefs') {
    lines.push('Continue gathering preferences — do not restart from scratch.');
  } else if (session.status === 'confirmed') {
    lines.push('The recipe is saved — confirm they still have the ingredients, then call save_recipe only if they changed something, otherwise advance to cooking.');
  }

  return lines.join('\n');
}
