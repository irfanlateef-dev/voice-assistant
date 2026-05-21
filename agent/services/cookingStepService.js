import { and, asc, eq } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { cookingSteps } from '../entity/cookingSteps.js';

export async function bulkCreateSteps(sessionId, steps) {
  const db = getDb();
  const rows = await db
    .insert(cookingSteps)
    .values(
      steps.map((step) => ({
        sessionId,
        stepNumber: step.step_number,
        instruction: step.instruction,
        durationMinutes: step.duration_minutes ?? null,
      })),
    )
    .returning();
  return rows;
}

export async function activateStep(sessionId, stepNumber) {
  const db = getDb();

  await db
    .update(cookingSteps)
    .set({ status: 'pending', updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSteps.sessionId, sessionId), eq(cookingSteps.status, 'active')));

  const [step] = await db
    .update(cookingSteps)
    .set({
      status: 'active',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(cookingSteps.sessionId, sessionId), eq(cookingSteps.stepNumber, stepNumber)))
    .returning();

  if (step) return step;

  const all = await db
    .select()
    .from(cookingSteps)
    .where(eq(cookingSteps.sessionId, sessionId))
    .orderBy(asc(cookingSteps.stepNumber));
  return all.find((r) => r.stepNumber === stepNumber) ?? null;
}

export async function completeStep(sessionId, stepNumber) {
  const db = getDb();
  const [step] = await db
    .update(cookingSteps)
    .set({ status: 'done', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSteps.sessionId, sessionId), eq(cookingSteps.stepNumber, stepNumber)))
    .returning();

  return step ?? null;
}

export async function completeStepAndAdvance(sessionId, stepNumber) {
  const completed = await completeStep(sessionId, stepNumber);
  if (!completed) {
    return { error: `Step ${stepNumber} not found` };
  }

  const steps = await getSteps(sessionId);
  const nextStep = steps.find((s) => s.status === 'pending');

  if (!nextStep) {
    return {
      completed_step: completed,
      next_step: null,
      next_step_number: null,
      recipe_finished: true,
    };
  }

  const activated = await activateStep(sessionId, nextStep.stepNumber);
  return {
    completed_step: completed,
    next_step: activated,
    next_step_number: nextStep.stepNumber,
    recipe_finished: false,
  };
}

export async function getSteps(sessionId) {
  const db = getDb();
  return db
    .select()
    .from(cookingSteps)
    .where(eq(cookingSteps.sessionId, sessionId))
    .orderBy(asc(cookingSteps.stepNumber));
}

export async function getCurrentStep(sessionId) {
  const db = getDb();
  const steps = await db
    .select()
    .from(cookingSteps)
    .where(eq(cookingSteps.sessionId, sessionId))
    .orderBy(asc(cookingSteps.stepNumber));

  const active = steps.find((s) => s.status === 'active');
  if (active) return active;

  return steps.find((s) => s.status === 'pending') ?? null;
}
