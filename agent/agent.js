import {
  cli,
  defineAgent,
  ServerOptions,
  voice,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

import {
  getGreeting,
  getLlmSettings,
  getSttSettings,
  getTtsSettings,
  loadConfig,
} from './config_loader.js';
import { resolveUserId } from './lib/room.js';
import { formatDateContext } from './lib/parseDueDate.js';
import { getUserById } from './services/userService.js';
import { buildNoteTools } from './tools/notes.js';
import { buildTaskTools } from './tools/tasks.js';

dotenv.config();

const cfg = loadConfig();
const sttCfg = getSttSettings(cfg);
const ttsCfg = getTtsSettings(cfg);
const llmCfg = getLlmSettings(cfg);
const greeting = getGreeting(cfg);

const ASSISTANT_PROMPT = `You are a personal task and notes assistant. You help users create tasks, list pending work, mark tasks done, save notes, and search notes.

Rules:
- Keep spoken replies to 1-2 short sentences (under 120 characters, max 300).
- No markdown. Responses are spoken aloud.
- Use tools whenever the user wants to create, list, complete, delete, or search tasks or notes.
- Confirm what you did after every tool action.
- Ask for clarification if the request is ambiguous.
- Ask for verbal confirmation before deleting or cancelling a task.
- If the user message is empty, reply with an empty message.
- For task due dates, pass due_at as a relative phrase (today, tomorrow, next_friday, in_2_days). Never guess ISO timestamps.
- You only have access to the current logged-in user's tasks and notes. Never reference or modify another user's data.`;

function buildAssistantPrompt(customPrompt, userContext = '') {
  const base = customPrompt?.trim() || ASSISTANT_PROMPT;
  const parts = [base, `Current date and time: ${formatDateContext()}.`];
  if (userContext) parts.push(userContext);
  return parts.join('\n\n');
}

function buildUserContext(user, userId) {
  const label = user?.name || user?.email || 'the user';
  return `Current session user: ${label} (id: ${userId}). All task and note tools are scoped to this user only.`;
}

function buildStt() {
  if (sttCfg.version === 'v2') {
    return new deepgram.STTv2({
      model: sttCfg.model,
      sampleRate: sttCfg.sample_rate,
      eagerEotThreshold: sttCfg.eager_eot_threshold,
      eotThreshold: sttCfg.eot_threshold,
      eotTimeoutMs: sttCfg.eot_timeout_ms,
    });
  }

  return new deepgram.STT({
    model: sttCfg.model,
    language: sttCfg.language,
    sampleRate: sttCfg.sample_rate,
  });
}

function buildTurnHandling() {
  const isFlux = sttCfg.version === 'v2';

  return {
    // Flux v2 sends linguistically-aware end-of-utterance signals — let it
    // decide when the user's turn is over (not raw silence timers).
    ...(isFlux ? { turnDetection: 'stt' } : {}),

    interruption: {
      enabled: true,
      minDuration: 0,
      minWords: 0,
      // When the VAD fires during agent speech, stop immediately.
      // If it turns out to be a false interruption (background noise / very
      // short sound), automatically resume the agent's speech.
      resumeFalseInterruption: true,
      falseInterruptionTimeout: 1500,
      mode: 'adaptive',
    },

    endpointing: {
      // Dynamic mode learns the user's natural pause rhythm instead of using
      // a fixed timeout — avoids cutting off slow speakers or waiting too long.
      mode: 'dynamic',
      minDelay: 0,
      maxDelay: isFlux ? 600 : 1500,
    },

    preemptiveGeneration: {
      enabled: isFlux,
      // Start TTS synthesis as soon as the first LLM sentence arrives — cuts
      // perceived latency by 300-800 ms vs waiting for the full response.
      preemptiveTts: isFlux,
    },
  };
}

function buildLlm() {
  const { provider_type: provider, model } = llmCfg;

  if (provider === 'google') {
    return import('@livekit/agents-plugin-google').then(
      (google) => new google.LLM({ model }),
    );
  }

  if (provider === 'openai') {
    return new openai.LLM({
      model,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  if (provider === 'openrouter') {
    return new openai.LLM({
      model,
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  if (provider === 'deepgram') {
    return new openai.LLM({
      model,
      baseURL: 'https://api.deepgram.com/v1/openai',
      apiKey: process.env.DEEPGRAM_API_KEY,
    });
  }

  throw new Error(`Unsupported LLM provider in config.json: ${provider}`);
}

function publishData(room, payload) {
  room.localParticipant
    .publishData(Buffer.from(JSON.stringify(payload)), { reliable: true })
    .catch((err) => console.error('Failed to publish data:', err));
}

export default defineAgent({
  // prewarm: runs once when the worker process starts, before any job is
  // assigned. Loading the Silero ONNX model here means it is already in memory
  // when a user connects — zero cold-start delay on first session.
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load({
      // Trigger interruption after just 50 ms of detected speech — near-instant.
      minSpeechDuration: 0.05,
      // 150 ms of silence marks the end of the user's utterance for VAD.
      // Flux v2's EOT signals will further refine this.
      minSilenceDuration: 0.15,
      // Capture 150 ms of audio before the VAD fires so we never miss the
      // start of a word.
      prefixPaddingDuration: 0.15,
      // Standard sensitivity — detects real speech without firing on noise.
      activationThreshold: 0.5,
    });
  },

  entry: async (ctx) => {
    await ctx.connect();

    const userId = await resolveUserId(ctx.room);
    const user = await getUserById(userId);
    console.log(`[session] user connected: ${userId} (${user?.email ?? 'unknown'})`);

    const tools = {
      ...buildTaskTools(userId, ctx.room),
      ...buildNoteTools(userId, ctx.room),
    };

    const agent = new voice.Agent({
      instructions: buildAssistantPrompt(
        llmCfg.system_prompt,
        buildUserContext(user, userId),
      ),
      tools,
    });

    const session = new voice.AgentSession({
      // The VAD gives the agent ears at the audio level — it detects the
      // exact millisecond the user starts speaking and fires the interruption
      // signal immediately, without waiting for a network round-trip to
      // Deepgram. Without this, the agent can only know the user spoke AFTER
      // the STT has already buffered and processed audio, which is too late.
      vad: ctx.proc.userData.vad,
      stt: buildStt(),
      llm: await buildLlm(),
      tts: new deepgram.TTS({
        model: ttsCfg.model,
        encoding: ttsCfg.encoding,
        sampleRate: ttsCfg.sample_rate,
      }),
      turnHandling: buildTurnHandling(),
    });

    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error('[session] error:', ev.error);
    });

    session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
      for (const call of ev.functionCalls) {
        console.log(`[session] tool called: ${call.name}`);
        publishData(ctx.room, {
          type: 'action',
          action: 'tool_called',
          data: { name: call.name },
        });
      }
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      const { item } = ev;
      if (item.role !== 'user' && item.role !== 'assistant') return;

      const text = item.textContent?.trim();
      if (!text) return;

      publishData(ctx.room, { type: 'transcript', role: item.role, text });
    });

    await session.start({ agent, room: ctx.room });

    session.say(greeting, { allowInterruptions: true });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
