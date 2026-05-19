import 'dotenv/config';
import { eq } from 'drizzle-orm';

import { DEMO_NOTES, DEMO_TASKS, DEMO_USER } from '../config/demoUser.js';
import { getDb } from '../db/client.js';
import { notes } from '../entity/notes.js';
import { tasks } from '../entity/tasks.js';
import {
  createUser,
  ensureUserPassword,
  getUserByEmail,
  toPublicUser,
} from '../services/userService.js';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';

async function seed() {
  const db = getDb();

  let user = await getUserByEmail(DEMO_USER.email);
  if (!user) {
    const result = await createUser({
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: DEMO_PASSWORD,
    });
    if (result.error) throw new Error(result.error);
    user = result.user;
  } else if (!user.passwordHash) {
    user = await ensureUserPassword(user.id, DEMO_PASSWORD);
  }

  const publicUser = toPublicUser(user);

  const existingTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, user.id)).limit(1);
  if (existingTasks.length === 0) {
    await db.insert(tasks).values(
      DEMO_TASKS.map((t) => ({ userId: user.id, title: t.title, description: t.description, status: 'pending' })),
    );
    console.log(`Seeded ${DEMO_TASKS.length} tasks for ${DEMO_USER.email}`);
  } else {
    console.log(`Tasks already exist for ${DEMO_USER.email}, skipping`);
  }

  const existingNotes = await db.select({ id: notes.id }).from(notes).where(eq(notes.userId, user.id)).limit(1);
  if (existingNotes.length === 0) {
    await db.insert(notes).values(
      DEMO_NOTES.map((n) => ({ userId: user.id, content: n.content, tags: n.tags })),
    );
    console.log(`Seeded ${DEMO_NOTES.length} notes for ${DEMO_USER.email}`);
  } else {
    console.log(`Notes already exist for ${DEMO_USER.email}, skipping`);
  }

  console.log('\nDemo user ready:');
  console.log(`  email:    ${publicUser.email}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  name:     ${publicUser.name}`);
  console.log(`  id:       ${publicUser.id}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
