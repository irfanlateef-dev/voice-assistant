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

export function getSttSettings(cfg) {
  const listen = cfg.agent.listen.provider;
  const audioIn = cfg.audio.input;
  return {
    model: listen.model,
    version: listen.version ?? 'v2',
    encoding: audioIn.encoding,
    sample_rate: audioIn.sample_rate,
    language: 'en',
    eager_eot_threshold: listen.eager_eot_threshold ?? 0.5,
    eot_threshold: listen.eot_threshold ?? 0.6,
    eot_timeout_ms: listen.eot_timeout_ms ?? 1500,
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
