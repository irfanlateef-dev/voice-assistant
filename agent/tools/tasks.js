import { llm } from '@livekit/agents';
import { z } from 'zod';

import * as taskService from '../services/taskService.js';

function publishAction(room, payload) {
  if (!room) return;
  const data = Buffer.from(JSON.stringify({ type: 'action', ...payload }));
  room.localParticipant
    .publishData(data, { reliable: true })
    .catch((err) => console.error('Failed to publish action:', err));
}

export function buildTaskTools(userId, room) {
  return {
    create_task: llm.tool({
      description: 'Create a new task or reminder for the user.',
      parameters: z.object({
        title: z.string().describe('Short task title'),
        description: z.string().optional().describe('Optional extra details'),
        due_at: z.string().optional().describe('Optional due date ISO string'),
      }),
      execute: async ({ title, description, due_at }) => {
        const task = await taskService.createTask(userId, {
          title,
          description,
          dueAt: due_at,
        });
        publishAction(room, { action: 'task_created', data: task });
        return { success: true, task };
      },
    }),

    list_tasks: llm.tool({
      description: 'List the user tasks. Defaults to pending tasks.',
      parameters: z.object({
        status: z
          .enum(['pending', 'done', 'cancelled', 'all'])
          .optional()
          .describe('Filter by status'),
      }),
      execute: async ({ status = 'pending' }) => {
        const tasks = await taskService.listTasks(userId, { status });
        return { success: true, count: tasks.length, tasks };
      },
    }),

    complete_task: llm.tool({
      description: 'Mark a task as done by title search or task id.',
      parameters: z.object({
        task_id: z.string().optional().describe('Task UUID if known'),
        title_search: z.string().optional().describe('Partial title match'),
      }),
      execute: async ({ task_id, title_search }) => {
        const result = await taskService.completeTask(userId, {
          taskId: task_id,
          titleSearch: title_search,
        });
        if (result.error) return { success: false, error: result.error };
        publishAction(room, { action: 'task_completed', data: result.task });
        return { success: true, task: result.task };
      },
    }),

    delete_task: llm.tool({
      description: 'Cancel/delete a task. Ask the user to confirm before calling this.',
      parameters: z.object({
        task_id: z.string().optional().describe('Task UUID if known'),
        title_search: z.string().optional().describe('Partial title match'),
      }),
      execute: async ({ task_id, title_search }) => {
        const result = await taskService.deleteTask(userId, {
          taskId: task_id,
          titleSearch: title_search,
        });
        if (result.error) return { success: false, error: result.error };
        publishAction(room, { action: 'task_deleted', data: result.task });
        return { success: true, task: result.task };
      },
    }),

    search_tasks: llm.tool({
      description: 'Search tasks by keyword in title or description.',
      parameters: z.object({
        query: z.string().describe('Search keyword'),
      }),
      execute: async ({ query }) => {
        const tasks = await taskService.searchTasks(userId, query);
        return { success: true, count: tasks.length, tasks };
      },
    }),
  };
}
