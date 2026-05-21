import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { cookingIngredients } from '../entity/cookingIngredients.js';
import { cookingSessions } from '../entity/cookingSessions.js';
import { cookingSteps } from '../entity/cookingSteps.js';

function serializeSession(session) {
  return {
    id: session.id,
    userId: session.userId,
    dishName: session.dishName,
    status: session.status,
    preferences: session.preferences,
    totalSteps: session.totalSteps,
    currentStep: session.currentStep,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export async function createSession(userId, dishName) {
  const db = getDb();
  const [session] = await db
    .insert(cookingSessions)
    .values({ userId, dishName, status: 'gathering_prefs' })
    .returning();
  return serializeSession(session);
}

export async function updateSessionPreferences(sessionId, userId, preferences) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ preferences, updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}

export async function confirmSession(sessionId, userId) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ status: 'confirmed', updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}

export async function startCooking(sessionId, userId) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ status: 'cooking', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}

export async function completeSession(sessionId, userId) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}

const INCOMPLETE_STATUSES = ['gathering_prefs', 'confirmed', 'cooking'];

export async function listIncompleteSessions(userId) {
  const db = getDb();
  const rows = await db
    .select()
    .from(cookingSessions)
    .where(
      and(
        eq(cookingSessions.userId, userId),
        inArray(cookingSessions.status, INCOMPLETE_STATUSES),
      ),
    )
    .orderBy(desc(cookingSessions.updatedAt));

  return rows.map(serializeSession);
}

export async function deleteSession(sessionId, userId) {
  const db = getDb();
  const existing = await getSessionById(sessionId, userId);
  if (!existing) {
    return { error: 'Session not found' };
  }

  await db
    .delete(cookingSessions)
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)));

  return { success: true };
}

export async function getActiveSession(userId, sessionId = null) {
  if (sessionId) {
    const session = await getSessionById(sessionId, userId);
    if (!session || !INCOMPLETE_STATUSES.includes(session.status)) return null;
    return session;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(cookingSessions)
    .where(
      and(
        eq(cookingSessions.userId, userId),
        inArray(cookingSessions.status, INCOMPLETE_STATUSES),
      ),
    )
    .orderBy(desc(cookingSessions.updatedAt))
    .limit(1);

  const session = rows[0];
  if (!session) return null;

  const [ingredients, steps] = await Promise.all([
    db
      .select()
      .from(cookingIngredients)
      .where(eq(cookingIngredients.sessionId, session.id))
      .orderBy(asc(cookingIngredients.sortOrder)),
    db
      .select()
      .from(cookingSteps)
      .where(eq(cookingSteps.sessionId, session.id))
      .orderBy(asc(cookingSteps.stepNumber)),
  ]);

  return { ...serializeSession(session), ingredients, steps };
}

export async function getSessionById(sessionId, userId) {
  const db = getDb();
  const rows = await db
    .select()
    .from(cookingSessions)
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .limit(1);

  const session = rows[0];
  if (!session) return null;

  const [ingredients, steps] = await Promise.all([
    db
      .select()
      .from(cookingIngredients)
      .where(eq(cookingIngredients.sessionId, session.id))
      .orderBy(asc(cookingIngredients.sortOrder)),
    db
      .select()
      .from(cookingSteps)
      .where(eq(cookingSteps.sessionId, session.id))
      .orderBy(asc(cookingSteps.stepNumber)),
  ]);

  return { ...serializeSession(session), ingredients, steps };
}

export async function updateCurrentStep(sessionId, userId, stepNumber) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ currentStep: stepNumber, updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}

export async function setTotalSteps(sessionId, userId, totalSteps) {
  const db = getDb();
  const [session] = await db
    .update(cookingSessions)
    .set({ totalSteps, updatedAt: new Date().toISOString() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();
  return serializeSession(session);
}
