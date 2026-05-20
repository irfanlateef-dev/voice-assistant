import { llm } from '@livekit/agents';
import { z } from 'zod';

import { parseDueDate } from '../lib/parseDueDate.js';
import * as taskService from '../services/taskService.js';

function publishAction(room, payload) {
  if (!room) return;
  const data = Buffer.from(JSON.stringify({ type: 'action', ...payload }));
  room.localParticipant
    .publishData(data, { reliable: true })
    .catch((err) => console.error('Failed to publish action:', err));
}

async function runTool(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[tool] ${name} ok (${Date.now() - start}ms)`);
    return result;
  } catch (err) {
    console.error(`[tool] ${name} failed (${Date.now() - start}ms):`, err);
    return { success: false, error: `Could not complete ${name}` };
  }
}

function summarizeTasks(tasks, limit = 8) {
  return tasks.slice(0, limit).map((t) => ({
    title: t.title,
    status: t.status,
    dueAt: t.dueAt,
  }));
}

export function buildTaskTools(userId, room) {
  return {
    create_task: llm.tool({
      description: 'Create a new task or reminder for the user.',
      parameters: z.object({
        title: z.string().describe('Short task title'),
        description: z.string().optional().describe('Optional extra details'),
        due_at: z
          .string()
          .optional()
          .describe(
            'Due date as a relative phrase: today, tomorrow, next_monday, in_3_days. Do not invent ISO dates — the server resolves relative phrases using the real clock.',
          ),
      }),
      execute: async ({ title, description, due_at }) =>
        runTool('create_task', async () => {
          const dueAt = parseDueDate(due_at);
          const task = await taskService.createTask(userId, {
            title,
            description,
            dueAt,
          });
          publishAction(room, { action: 'task_created', data: task });
          return { success: true, task: { title: task.title, status: task.status, dueAt: task.dueAt } };
        }),
    }),

    list_tasks: llm.tool({
      description: 'List the user tasks. Defaults to pending tasks.',
      parameters: z.object({
        status: z
          .enum(['pending', 'done', 'cancelled', 'all'])
          .optional()
          .describe('Filter by status'),
      }),
      execute: async ({ status = 'pending' }) =>
        runTool('list_tasks', async () => {
          const tasks = await taskService.listTasks(userId, { status });
          return {
            success: true,
            count: tasks.length,
            tasks: summarizeTasks(tasks),
          };
        }),
    }),

    complete_task: llm.tool({
      description: 'Mark a task as done by title search or task id.',
      parameters: z.object({
        task_id: z.string().optional().describe('Task UUID if known'),
        title_search: z.string().optional().describe('Partial title match'),
      }),
      execute: async ({ task_id, title_search }) =>
        runTool('complete_task', async () => {
          const result = await taskService.completeTask(userId, {
            taskId: task_id,
            titleSearch: title_search,
          });
          if (result.error) return { success: false, error: result.error };
          publishAction(room, { action: 'task_completed', data: result.task });
          return { success: true, task: { title: result.task.title, status: result.task.status } };
        }),
    }),

    delete_task: llm.tool({
      description: 'Cancel/delete a task. Ask the user to confirm before calling this.',
      parameters: z.object({
        task_id: z.string().optional().describe('Task UUID if known'),
        title_search: z.string().optional().describe('Partial title match'),
      }),
      execute: async ({ task_id, title_search }) =>
        runTool('delete_task', async () => {
          const result = await taskService.deleteTask(userId, {
            taskId: task_id,
            titleSearch: title_search,
          });
          if (result.error) return { success: false, error: result.error };
          publishAction(room, { action: 'task_deleted', data: result.task });
          return { success: true, task: { title: result.task.title, status: result.task.status } };
        }),
    }),

    search_tasks: llm.tool({
      description: 'Search tasks by keyword in title or description.',
      parameters: z.object({
        query: z.string().describe('Search keyword'),
      }),
      execute: async ({ query }) =>
        runTool('search_tasks', async () => {
          const tasks = await taskService.searchTasks(userId, query);
          return {
            success: true,
            count: tasks.length,
            tasks: summarizeTasks(tasks),
          };
        }),
    }),
  };
}
