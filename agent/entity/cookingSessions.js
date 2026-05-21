import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const cookingSessionStatusEnum = pgEnum('cooking_session_status', [
  'gathering_prefs',
  'confirmed',
  'cooking',
  'completed',
  'abandoned',
]);

export const cookingSessions = pgTable('cooking_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dishName: text('dish_name').notNull(),
  status: cookingSessionStatusEnum('status').default('gathering_prefs').notNull(),
  preferences: jsonb('preferences'),
  totalSteps: integer('total_steps').default(0),
  currentStep: integer('current_step').default(0),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});
