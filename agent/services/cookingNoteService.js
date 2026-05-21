import { desc, eq } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { cookingNotes } from '../entity/cookingNotes.js';

export async function addNote(sessionId, content, noteType = 'tip') {
  const db = getDb();
  const [note] = await db
    .insert(cookingNotes)
    .values({ sessionId, content, noteType })
    .returning();
  return note;
}

export async function getNotes(sessionId) {
  const db = getDb();
  return db
    .select()
    .from(cookingNotes)
    .where(eq(cookingNotes.sessionId, sessionId))
    .orderBy(desc(cookingNotes.createdAt));
}
