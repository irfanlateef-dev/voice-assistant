import { eq } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { users } from '../entity/users.js';

export async function findOrCreateUser(email, name) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
    })
    .returning();

  return created;
}

export async function getUserById(userId) {
  const db = getDb();
  return db.query.users.findFirst({ where: eq(users.id, userId) });
}
