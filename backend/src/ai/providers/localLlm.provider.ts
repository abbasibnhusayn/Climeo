import type { AiGenerateOptions, AiProvider } from '../aiProvider.interface.js';

/**
 * Talks to an Ollama-compatible /api/chat endpoint. Lets Climeo run fully
 * offline/self-hosted for privacy-sensitive deployments (e.g. enterprise
 * or government customers who can't send data to a third-party AI API).
 */
export class LocalLlmProvider implements AiProvider {
  readonly name = 'local-llm';
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async generate(options: AiGenerateOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.4,
          num_predict: options.maxTokens ?? 400,
        },
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Local LLM request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { message: { content: string } };
    if (!data.message?.content) {
      throw new Error('Local LLM response contained no content');
    }
    return data.message.content;
  }
}
