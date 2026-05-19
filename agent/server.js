import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

import { signToken } from './lib/auth.js';
import { loginSchema, signupSchema } from './lib/authSchemas.js';
import { authMiddleware } from './middleware/auth.js';
import * as noteService from './services/noteService.js';
import * as taskService from './services/taskService.js';
import { authenticateUser, createUser, toPublicUser } from './services/userService.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'config.json');
const FRONTEND_DIST = join(ROOT, 'frontend', 'dist');
const SERVE_FRONTEND =
  process.env.SERVE_FRONTEND === '1' || process.env.NODE_ENV === 'production';

const defaultOrigins = SERVE_FRONTEND
  ? ['http://localhost:8000']
  : ['http://localhost:5173', 'http://localhost:4173'];

const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    return;
  }

  const { name, email, password } = parsed.data;
  try {
    const result = await createUser({ name, email, password });
    if (result.error) {
      res.status(409).json({ error: result.error });
      return;
    }
    const user = toPublicUser(result.user);
    const token = await signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup failed:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;
  try {
    const result = await authenticateUser(email, password);
    if (result.error) {
      res.status(401).json({ error: result.error });
      return;
    }
    const user = toPublicUser(result.user);
    const token = await signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ── LiveKit token ─────────────────────────────────────────────────────────────

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
  token.addGrant({ roomJoin: true, room: String(room), canPublish: true, canSubscribe: true });
  res.json({ token: await token.toJwt() });
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await taskService.listTasks(req.user.id, { status: req.query.status || 'pending' });
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
    const task = await taskService.createTask(req.user.id, { title, description, dueAt });
    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task failed:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  try {
    const result = await taskService.completeTask(req.user.id, { taskId: req.params.id });
    if (result.error) { res.status(404).json({ error: result.error }); return; }
    res.json({ task: result.task });
  } catch (err) {
    console.error('Complete task failed:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// ── Notes ─────────────────────────────────────────────────────────────────────

app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await noteService.listNotes(req.user.id, { limit: Number(req.query.limit) || 20 });
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

// ── Misc ──────────────────────────────────────────────────────────────────────

app.get('/api/config', (_req, res) => {
  res.json(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')));
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, serveFrontend: SERVE_FRONTEND, timestamp: new Date().toISOString() });
});

if (SERVE_FRONTEND) {
  if (!existsSync(FRONTEND_DIST)) {
    console.error(`[server] frontend dist missing at ${FRONTEND_DIST}. Build the frontend first.`);
    process.exit(1);
  }
  app.use(express.static(FRONTEND_DIST, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) { next(); return; }
    res.sendFile(join(FRONTEND_DIST, 'index.html'));
  });
  console.log(`[server] serving frontend from ${FRONTEND_DIST}`);
}

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT}`);
  if (SERVE_FRONTEND) console.log(`App available at http://localhost:${PORT}`);
});
