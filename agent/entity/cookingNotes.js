import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { cookingSessions } from './cookingSessions.js';

export const cookingNoteTypeEnum = pgEnum('cooking_note_type', [
  'tip',
  'substitution',
  'preference',
  'warning',
  'joke_fact',
]);

export const cookingNotes = pgTable('cooking_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => cookingSessions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  noteType: cookingNoteTypeEnum('note_type').default('tip').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});
