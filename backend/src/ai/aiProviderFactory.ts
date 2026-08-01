import type { AiProvider } from './aiProvider.interface.js';
import { AnthropicAiProvider } from './providers/anthropic.provider.js';
import { OpenAiProvider } from './providers/openai.provider.js';
import { GeminiAiProvider } from './providers/gemini.provider.js';
import { LocalLlmProvider } from './providers/localLlm.provider.js';

export type AiProviderName = 'anthropic' | 'openai' | 'gemini' | 'local-llm';

let cachedProvider: AiProvider | null = null;

/**
 * Reads AI_PROVIDER from env and constructs the matching implementation.
 * This is the ONLY place provider selection happens — swapping providers
 * in production is an env var change, not a code change.
 */
export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER ?? 'anthropic') as AiProviderName;

  switch (providerName) {
    case 'anthropic': {
      const key = requireEnv('ANTHROPIC_API_KEY');
      cachedProvider = new AnthropicAiProvider(key, process.env.ANTHROPIC_MODEL);
      break;
    }
    case 'openai': {
      const key = requireEnv('OPENAI_API_KEY');
      cachedProvider = new OpenAiProvider(key, process.env.OPENAI_MODEL);
      break;
    }
    case 'gemini': {
      const key = requireEnv('GEMINI_API_KEY');
      cachedProvider = new GeminiAiProvider(key, process.env.GEMINI_MODEL);
      break;
    }
    case 'local-llm': {
      const baseUrl = process.env.LOCAL_LLM_URL ?? 'http://localhost:11434';
      const model = process.env.LOCAL_LLM_MODEL ?? 'llama3.1';
      cachedProvider = new LocalLlmProvider(baseUrl, model);
      break;
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
  }

  return cachedProvider;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Test-only: clears the cached provider so tests can swap AI_PROVIDER. */
export function _resetAiProviderCache(): void {
  cachedProvider = null;
}
