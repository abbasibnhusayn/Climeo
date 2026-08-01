/**
 * Every AI backend (Anthropic, OpenAI, Gemini, local LLM) implements this.
 * Nothing else in the app talks to a specific vendor's SDK or API shape.
 *
 * Hard rule enforced at the call-site (see dailyBrief.service.ts): the AI
 * layer only ever *interprets* forecast numbers that were already computed
 * by the weather provider. It is never asked to produce a temperature,
 * probability, or any other forecast figure itself.
 */
export interface AiGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiProvider {
  readonly name: string;
  generate(options: AiGenerateOptions): Promise<string>;
}
