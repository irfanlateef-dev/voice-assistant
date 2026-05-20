import { llm } from '@livekit/agents';
import { z } from 'zod';

import * as noteService from '../services/noteService.js';

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

function summarizeNotes(notes, limit = 6) {
  return notes.slice(0, limit).map((n) => ({
    content: n.content.length > 120 ? `${n.content.slice(0, 117)}...` : n.content,
    tags: n.tags,
  }));
}

export function buildNoteTools(userId, room) {
  return {
    create_note: llm.tool({
      description: 'Save a note for the user.',
      parameters: z.object({
        content: z.string().describe('Note content'),
        tags: z.array(z.string()).optional().describe('Optional tags'),
      }),
      execute: async ({ content, tags }) =>
        runTool('create_note', async () => {
          const note = await noteService.createNote(userId, { content, tags });
          publishAction(room, { action: 'note_created', data: note });
          return { success: true, note: { content: note.content.slice(0, 120) } };
        }),
    }),

    list_notes: llm.tool({
      description: 'List recent notes for the user.',
      parameters: z.object({
        limit: z.number().optional().describe('Max notes to return'),
      }),
      execute: async ({ limit = 10 }) =>
        runTool('list_notes', async () => {
          const notes = await noteService.listNotes(userId, { limit });
          return { success: true, count: notes.length, notes: summarizeNotes(notes) };
        }),
    }),

    search_notes: llm.tool({
      description: 'Search notes by keyword.',
      parameters: z.object({
        query: z.string().describe('Search keyword'),
        limit: z.number().optional().describe('Max results'),
      }),
      execute: async ({ query, limit = 10 }) =>
        runTool('search_notes', async () => {
          const notes = await noteService.searchNotes(userId, query, { limit });
          return { success: true, count: notes.length, notes: summarizeNotes(notes) };
        }),
    }),
  };
}
