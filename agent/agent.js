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
import { resolveParticipantContext } from './lib/room.js';
import { formatDateContext } from './lib/parseDueDate.js';
import { buildResumeContext, buildResumeGreeting } from './lib/resumeContext.js';

import { getUserById } from './services/userService.js';
import { getSessionById } from './services/cookingSessionService.js';
import { buildCookingTools } from './tools/cooking.js';
import { GRACE_SYSTEM_PROMPT } from './prompts/grace.js';
import { clearAllTimers } from './lib/cookingTimers.js';

dotenv.config();

const cfg = loadConfig();
const sttCfg = getSttSettings(cfg);
const ttsCfg = getTtsSettings(cfg);
const llmCfg = getLlmSettings(cfg);
const greeting = getGreeting(cfg);

// config.json agent.think.prompt overrides; otherwise prompts/grace.js
const systemPrompt = llmCfg.system_prompt?.trim() || GRACE_SYSTEM_PROMPT;

function buildAssistantPrompt(userContext = '') {
  const parts = [systemPrompt, `Current date and time: ${formatDateContext()}.`];
  if (userContext) parts.push(userContext);
  return parts.join('\n\n');
}

function buildUserContext(user, userId) {
  const label = user?.name || user?.email || 'the user';
  return `Current session user: ${label} (id: ${userId}). All cooking tools are scoped to this user only.`;
}

function buildStt() {
  if (sttCfg.version === 'v2') {
    const opts = {
      model: sttCfg.model,
      sampleRate: sttCfg.sample_rate,
      eotThreshold: sttCfg.eot_threshold,
      eotTimeoutMs: sttCfg.eot_timeout_ms,
    };
    if (sttCfg.eager_eot_threshold != null) {
      opts.eagerEotThreshold = sttCfg.eager_eot_threshold;
    }
    return new deepgram.STTv2(opts);
  }

  return new deepgram.STT({
    model: sttCfg.model,
    language: sttCfg.language,
    sampleRate: sttCfg.sample_rate,
  });
}

function buildLlm() {
  const { provider_type: provider, model, max_completion_tokens } = llmCfg;
  const maxTokensOpt = max_completion_tokens ? { max_tokens: max_completion_tokens } : {};

  if (provider === 'google') {
    return import('@livekit/agents-plugin-google').then(
      (google) => new google.LLM({ model }),
    );
  }

  if (provider === 'openai') {
    return new openai.LLM({
      model,
      apiKey: process.env.OPENAI_API_KEY,
      ...maxTokensOpt,
    });
  }

  if (provider === 'openrouter') {
    return new openai.LLM({
      model,
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      ...maxTokensOpt,
    });
  }

  if (provider === 'deepgram') {
    return new openai.LLM({
      model,
      baseURL: 'https://api.deepgram.com/v1/openai',
      apiKey: process.env.DEEPGRAM_API_KEY,
      ...maxTokensOpt,
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
      minSpeechDuration: 0.05,
      minSilenceDuration: 0.3,
      prefixPaddingDuration: 0.1,
      activationThreshold: 0.3,
    });
  },

  entry: async (ctx) => {
    await ctx.connect();

    console.log('[session] resolving participant context...');
    const { userId, cookingSessionId } = await resolveParticipantContext(ctx.room);
    console.log(
      `[session] resolved: userId=${userId}, cookingSessionId=${cookingSessionId}`,
    );
    const user = await getUserById(userId);
    console.log(
      `[session] user connected: ${userId} (${user?.email ?? 'unknown'})` +
        (cookingSessionId ? ` resume=${cookingSessionId}` : ' new session'),
    );

    let resumeContext = '';
    let openingGreeting = greeting;

    if (cookingSessionId) {
      const cookingSession = await getSessionById(cookingSessionId, userId);
      if (
        cookingSession &&
        ['gathering_prefs', 'confirmed', 'cooking'].includes(cookingSession.status)
      ) {
        resumeContext = buildResumeContext(cookingSession);
        openingGreeting = buildResumeGreeting(cookingSession);
        console.log(`[session] resuming "${cookingSession.dishName}" at step ${cookingSession.currentStep}`);
      }
    }

    // Tools are constructed BEFORE the AgentSession exists, but background
    // step timers need to invoke session.generateReply() when they fire. We
    // pass a mutable holder and wire the live session into it once created.
    const sessionHolder = { session: null };

    const tools = {
      ...buildCookingTools(userId, ctx.room, sessionHolder),
    };

    const userContext = [buildUserContext(user, userId), resumeContext].filter(Boolean).join('\n\n');

    const agent = new voice.Agent({
      instructions: buildAssistantPrompt(userContext),
      tools,
    });

    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad,
      stt: buildStt(),
      llm: await buildLlm(),
      tts: new deepgram.TTS({
        model: ttsCfg.model,
        encoding: ttsCfg.encoding,
        sampleRate: ttsCfg.sample_rate,
      }),
      voiceOptions: {
        allowInterruptions: true,
        minInterruptionDuration: 0,
        minInterruptionWords: 0,
        aecWarmupDuration: 0,
        discardAudioIfUninterruptible: true,
        preemptiveGeneration: false,
        minEndpointingDelay: 0,
        maxEndpointingDelay: 500,
      },
      turnHandling: {
        turnDetection: 'stt',
      },
      connOptions: {
        llmConnOptions: {
          maxRetry: 1,
          timeoutMs: 60_000,
        },
        ttsConnOptions: {
          timeoutMs: 60_000,
        },
      },
    });

    sessionHolder.session = session;

    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error('[session] error:', ev.error);
    });

    session.on(voice.AgentSessionEventTypes.Close, () => {
      console.log('[session] closed — clearing cooking timers');
      clearAllTimers();
      sessionHolder.session = null;
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
      for (const output of ev.functionOutputs ?? []) {
        const preview = JSON.stringify(output.output ?? output).slice(0, 120);
        console.log(`[session] tool output: ${preview}`);
      }
    });

    await session.start({
      agent,
      room: ctx.room,
      outputOptions: {
        transcriptionEnabled: true,
        syncTranscription: true,
      },
    });

    session.say(openingGreeting, { allowInterruptions: true });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
