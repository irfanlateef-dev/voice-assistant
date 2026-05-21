/**
 * Background step timers for the cooking agent.
 *
 * Each active session can have at most one "halfway" timer and one "complete"
 * timer scheduled at any time. When the agent advances to a new step, prior
 * timers for that session are cleared. When a timer fires, it invokes a
 * callback that the cooking tool wires to `session.generateReply()` so the
 * LLM can speak a natural, in-character check-in.
 *
 * Timers are intentionally simple: in-memory only. If the worker restarts mid
 * recipe the user just has to ask "how's it going?" — the LLM will recover
 * from the chat history.
 */

const sessionTimers = new Map();

const MIN_HALFWAY_DURATION_MINUTES = 3;

export function clearTimersFor(sessionId) {
  if (!sessionId) return;
  const timers = sessionTimers.get(sessionId);
  if (timers) {
    timers.forEach((t) => clearTimeout(t));
    sessionTimers.delete(sessionId);
  }
}

export function clearAllTimers() {
  for (const timers of sessionTimers.values()) {
    timers.forEach((t) => clearTimeout(t));
  }
  sessionTimers.clear();
}

/**
 * Schedule halfway and completion check-ins for a step.
 *
 * @param {string} sessionId
 * @param {object} opts
 * @param {number} opts.durationMinutes  How long the step takes.
 * @param {number} opts.stepNumber       For logging only.
 * @param {string} opts.stepInstruction  For logging + handing to the LLM.
 * @param {Function} [opts.onHalfway]    Fires at duration / 2 (skipped if duration < 3 min).
 * @param {Function} [opts.onComplete]   Fires at duration.
 */
export function scheduleStepTimers(sessionId, opts) {
  if (!sessionId) return;

  clearTimersFor(sessionId);

  const { durationMinutes, stepNumber, stepInstruction, onHalfway, onComplete } = opts ?? {};
  if (!durationMinutes || durationMinutes <= 0) return;

  const ms = durationMinutes * 60 * 1000;
  const timers = [];

  if (durationMinutes >= MIN_HALFWAY_DURATION_MINUTES && typeof onHalfway === 'function') {
    const halfId = setTimeout(() => {
      console.log(
        `[cooking-timer] halfway fire | session=${sessionId} step=${stepNumber} elapsed=${durationMinutes / 2}min`,
      );
      try {
        onHalfway({ stepNumber, stepInstruction, durationMinutes });
      } catch (err) {
        console.error('[cooking-timer] halfway callback error:', err);
      }
    }, ms / 2);
    timers.push(halfId);
  }

  if (typeof onComplete === 'function') {
    const fullId = setTimeout(() => {
      console.log(
        `[cooking-timer] complete fire | session=${sessionId} step=${stepNumber} duration=${durationMinutes}min`,
      );
      try {
        onComplete({ stepNumber, stepInstruction, durationMinutes });
      } catch (err) {
        console.error('[cooking-timer] complete callback error:', err);
      }
      // After firing, this timer is gone — but keep the slot in case halfway is still pending.
      const remaining = sessionTimers.get(sessionId);
      if (remaining) {
        const filtered = remaining.filter((t) => t !== fullId);
        if (filtered.length === 0) sessionTimers.delete(sessionId);
        else sessionTimers.set(sessionId, filtered);
      }
    }, ms);
    timers.push(fullId);
  }

  if (timers.length > 0) {
    sessionTimers.set(sessionId, timers);
    console.log(
      `[cooking-timer] scheduled | session=${sessionId} step=${stepNumber} duration=${durationMinutes}min timers=${timers.length}`,
    );
  }
}
