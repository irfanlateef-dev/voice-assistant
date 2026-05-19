import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

import { signToken } from './lib/auth.js';
import { authMiddleware } from './middleware/auth.js';
import * as noteService from './services/noteService.js';
import * as taskService from './services/taskService.js';
import { findOrCreateUser } from './services/userService.js';

dotenv.config();

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body ?? {};

  if (!email?.trim()) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  try {
    const user = await findOrCreateUser(email, name);
    const token = await signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/token', authMiddleware, async (req, res) => {
  const { room } = req.query;
  const user = req.user;

  if (!room) {
    res.status(400).json({ error: 'room is required' });
    return;
  }

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: user.id,
      name: user.name || user.email,
      ttl: 3600,
      metadata: JSON.stringify({ email: user.email, name: user.name }),
    },
  );

  token.addGrant({
    roomJoin: true,
    room: String(room),
    canPublish: true,
    canSubscribe: true,
  });

  res.json({ token: await token.toJwt() });
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const tasks = await taskService.listTasks(req.user.id, { status });
    res.json({ tasks });
  } catch (err) {
    console.error('List tasks failed:', err);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  const { title, description, dueAt } = req.body ?? {};

  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  try {
    const task = await taskService.createTask(req.user.id, {
      title,
      description,
      dueAt,
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task failed:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  try {
    const result = await taskService.completeTask(req.user.id, {
      taskId: req.params.id,
    });
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json({ task: result.task });
  } catch (err) {
    console.error('Complete task failed:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const notes = await noteService.listNotes(req.user.id, { limit });
    res.json({ notes });
  } catch (err) {
    console.error('List notes failed:', err);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  const { content, tags } = req.body ?? {};

  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  try {
    const note = await noteService.createNote(req.user.id, { content, tags });
    res.status(201).json({ note });
  } catch (err) {
    console.error('Create note failed:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/api/config', (_req, res) => {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  res.json(config);
});

const PORT = 8000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
