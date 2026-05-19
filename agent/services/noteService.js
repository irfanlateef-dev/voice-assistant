import { and, desc, eq, ilike } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { notes } from '../entity/notes.js';

function serializeNote(note) {
  return {
    id: note.id,
    content: note.content,
    tags: note.tags ?? [],
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function createNote(userId, { content, tags = [] }) {
  const db = getDb();
  const [note] = await db
    .insert(notes)
    .values({
      userId,
      content: content.trim(),
      tags: tags.filter(Boolean),
    })
    .returning();

  return serializeNote(note);
}

export async function listNotes(userId, { limit = 10 } = {}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt))
    .limit(limit);

  return rows.map(serializeNote);
}

export async function searchNotes(userId, query, { limit = 10 } = {}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), ilike(notes.content, `%${query.trim()}%`)))
    .orderBy(desc(notes.createdAt))
    .limit(limit);

  return rows.map(serializeNote);
}
