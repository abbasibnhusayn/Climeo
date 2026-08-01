import type { AiGenerateOptions, AiProvider } from '../aiProvider.interface.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

export class AnthropicAiProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(options: AiGenerateOptions): Promise<string> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 400,
        temperature: options.temperature ?? 0.4,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: options.userPrompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    const textBlock = data.content.find((block) => block.type === 'text');
    if (!textBlock?.text) {
      throw new Error('Anthropic response contained no text content');
    }
    return textBlock.text;
  }
}
