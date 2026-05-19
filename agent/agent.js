import {
  cli,
  defineAgent,
  ServerOptions,
  voice,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as google from '@livekit/agents-plugin-google';
import * as openai from '@livekit/agents-plugin-openai';
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
- If the user message is empty, reply with an empty message.`;

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
    ...(isFlux ? { turnDetection: 'stt' } : {}),
    interruption: {
      enabled: true,
      minDuration: 0,
      minWords: 0,
    },
    endpointing: {
      minDelay: isFlux ? 0 : 300,
      maxDelay: isFlux ? 800 : 2000,
    },
    preemptiveGeneration: {
      enabled: isFlux,
      preemptiveTts: false,
    },
  };
}

function buildLlm() {
  const { provider_type: provider, model } = llmCfg;

  if (provider === 'google') {
    return new google.LLM({ model });
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
  entry: async (ctx) => {
    await ctx.connect();

    const userId = await resolveUserId(ctx.room);
    console.log(`[session] user connected: ${userId}`);

    const tools = {
      ...buildTaskTools(userId, ctx.room),
      ...buildNoteTools(userId, ctx.room),
    };

    const agent = new voice.Agent({
      instructions: llmCfg.system_prompt?.trim() || ASSISTANT_PROMPT,
      tools,
    });

    const session = new voice.AgentSession({
      stt: buildStt(),
      llm: buildLlm(),
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
