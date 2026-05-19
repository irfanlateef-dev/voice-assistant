import { eq } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { users } from '../entity/users.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

export function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function getUserByEmail(email) {
  const db = getDb();
  return db.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
}

export async function getUserById(userId) {
  const db = getDb();
  return db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function createUser({ email, name, password }) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return { error: 'An account with this email already exists' };
  }

  const [created] = await db
    .insert(users)
    .values({ email: normalizedEmail, name: name.trim(), passwordHash: hashPassword(password) })
    .returning();

  return { user: created };
}

export async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user?.passwordHash) {
    return { error: 'Invalid email or password' };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return { error: 'Invalid email or password' };
  }
  return { user };
}

export async function ensureUserPassword(userId, password) {
  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}
