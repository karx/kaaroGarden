import { LLMProvider, FrontmatterSuggestion, parseJsonResponse } from "./provider";
import { requestUrl } from "obsidian";

/**
 * OpenAI-compatible adapter.
 * Works for: OpenAI (api.openai.com), Anthropic (via openai-compatible endpoint),
 * and any other OpenAI-compatible API.
 */
export class OpenAIProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string = "gpt-4o",
    private baseUrl: string = "https://api.openai.com/v1"
  ) {}

  async suggest(prompt: string): Promise<FrontmatterSuggestion> {
    const response = await requestUrl({
      url: `${this.baseUrl}/chat/completions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (response.status !== 200) {
      throw new Error(`OpenAI API error ${response.status}: ${response.text}`);
    }

    const raw = response.json?.choices?.[0]?.message?.content ?? "";
    return parseJsonResponse(raw);
  }
}

/** Anthropic adapter — uses messages API */
export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string = "claude-3-5-sonnet-20241022"
  ) {}

  async suggest(prompt: string): Promise<FrontmatterSuggestion> {
    const response = await requestUrl({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Anthropic API error ${response.status}: ${response.text}`);
    }

    const raw = response.json?.content?.[0]?.text ?? "";
    return parseJsonResponse(raw);
  }
}
