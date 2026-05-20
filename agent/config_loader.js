import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json');

export function loadConfig() {
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  if (cfg.type !== 'Settings') {
    throw new Error('config.json must have type=Settings');
  }
  return cfg;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getSttSettings(cfg) {
  const listen = cfg.agent.listen.provider;
  const audioIn = cfg.audio.input;
  const isFlux = (listen.version ?? 'v2') === 'v2';

  // Deepgram Flux v2 rejects out-of-range params with HTTP 400 and closes the stream.
  // Valid ranges: eot_threshold 0.5–0.9, eager_eot_threshold 0.3–0.9, eot_timeout_ms 500–10000
  // eager_eot_threshold is optional — only set it in config.json when you want
  // speculative LLM starts before the user fully finishes speaking. With tool
  // calling it creates parallel speech handles and can orphan tool results.
  const eagerEot = listen.eager_eot_threshold ?? null;
  const eot = listen.eot_threshold ?? 0.6;
  const eotTimeout = listen.eot_timeout_ms ?? 2000;

  return {
    model: listen.model,
    version: listen.version ?? 'v2',
    encoding: audioIn.encoding,
    sample_rate: audioIn.sample_rate,
    language: 'en',
    eager_eot_threshold:
      eagerEot != null && isFlux ? clamp(eagerEot, 0.3, 0.9) : null,
    eot_threshold: isFlux ? clamp(eot, 0.5, 0.9) : eot,
    eot_timeout_ms: isFlux ? clamp(eotTimeout, 500, 10000) : eotTimeout,
  };
}

export function getTtsSettings(cfg) {
  const speak = cfg.agent.speak.provider;
  const audioOut = cfg.audio.output;
  return {
    model: speak.model,
    encoding: audioOut.encoding,
    sample_rate: audioOut.sample_rate,
    container: audioOut.container ?? 'none',
  };
}

export function getLlmSettings(cfg) {
  const think = cfg.agent.think;
  const provider = think.provider;
  return {
    provider_type: provider.type,
    model: provider.model,
    system_prompt: think.prompt ?? '',
  };
}

export function getGreeting(cfg) {
  return cfg.agent.greeting ?? 'Hello!';
}
