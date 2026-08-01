import type { AiGenerateOptions, AiProvider } from '../aiProvider.interface.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(options: AiGenerateOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: options.userPrompt }] }],
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 400,
          temperature: options.temperature ?? 0.4,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text?: string }> } }>;
    };

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini response contained no text');
    }
    return text;
  }
}
