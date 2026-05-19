import 'dotenv/config';
import { eq } from 'drizzle-orm';

import { DEMO_NOTES, DEMO_TASKS, DEMO_USER } from '../config/demoUser.js';
import { getDb } from '../db/client.js';
import { notes } from '../entity/notes.js';
import { tasks } from '../entity/tasks.js';
import { findOrCreateUser } from '../services/userService.js';

async function seed() {
  const db = getDb();
  const user = await findOrCreateUser(DEMO_USER.email, DEMO_USER.name);

  const existingTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .limit(1);

  if (existingTasks.length === 0) {
    await db.insert(tasks).values(
      DEMO_TASKS.map((task) => ({
        userId: user.id,
        title: task.title,
        description: task.description,
        status: 'pending',
      })),
    );
    console.log(`Seeded ${DEMO_TASKS.length} tasks for ${DEMO_USER.email}`);
  } else {
    console.log(`Tasks already exist for ${DEMO_USER.email}, skipping tasks`);
  }

  const existingNotes = await db
    .select({ id: notes.id })
    .from(notes)
    .where(eq(notes.userId, user.id))
    .limit(1);

  if (existingNotes.length === 0) {
    await db.insert(notes).values(
      DEMO_NOTES.map((note) => ({
        userId: user.id,
        content: note.content,
        tags: note.tags,
      })),
    );
    console.log(`Seeded ${DEMO_NOTES.length} notes for ${DEMO_USER.email}`);
  } else {
    console.log(`Notes already exist for ${DEMO_USER.email}, skipping notes`);
  }

  console.log('Demo user ready:');
  console.log(`  email: ${DEMO_USER.email}`);
  console.log(`  name:  ${DEMO_USER.name}`);
  console.log(`  id:    ${user.id}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
