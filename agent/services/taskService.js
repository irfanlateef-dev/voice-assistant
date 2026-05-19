import { and, desc, eq, ilike, or } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { tasks } from '../entity/tasks.js';

function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueAt: task.dueAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function createTask(userId, { title, description, dueAt }) {
  const db = getDb();
  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      dueAt: dueAt || null,
    })
    .returning();

  return serializeTask(task);
}

export async function listTasks(userId, { status = 'pending' } = {}) {
  const db = getDb();
  const filters = [eq(tasks.userId, userId)];

  if (status && status !== 'all') {
    filters.push(eq(tasks.status, status));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...filters))
    .orderBy(desc(tasks.createdAt));

  return rows.map(serializeTask);
}

async function findTaskForUser(userId, { taskId, titleSearch }) {
  const db = getDb();

  if (taskId) {
    return db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });
  }

  if (titleSearch) {
    const rows = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, 'pending'),
          ilike(tasks.title, `%${titleSearch.trim()}%`),
        ),
      )
      .orderBy(desc(tasks.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }

  return null;
}

export async function completeTask(userId, { taskId, titleSearch }) {
  const db = getDb();
  const task = await findTaskForUser(userId, { taskId, titleSearch });

  if (!task) {
    return { error: 'Task not found' };
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: 'done', updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, task.id))
    .returning();

  return { task: serializeTask(updated) };
}

export async function deleteTask(userId, { taskId, titleSearch }) {
  const db = getDb();
  const task = await findTaskForUser(userId, { taskId, titleSearch });

  if (!task) {
    return { error: 'Task not found' };
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, task.id))
    .returning();

  return { task: serializeTask(updated) };
}

export async function searchTasks(userId, query) {
  const db = getDb();
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        or(
          ilike(tasks.title, `%${query.trim()}%`),
          ilike(tasks.description, `%${query.trim()}%`),
        ),
      ),
    )
    .orderBy(desc(tasks.createdAt))
    .limit(10);

  return rows.map(serializeTask);
}
