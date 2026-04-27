import { LLMProvider, FrontmatterSuggestion, parseJsonResponse } from "./provider";
import { requestUrl } from "obsidian";

/** Ollama local model adapter — no auth required */
export class OllamaProvider implements LLMProvider {
  constructor(
    private model: string = "llama3.2",
    private baseUrl: string = "http://localhost:11434"
  ) {}

  async suggest(prompt: string): Promise<FrontmatterSuggestion> {
    const response = await requestUrl({
      url: `${this.baseUrl}/api/generate`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Ollama error ${response.status}: ${response.text}`);
    }

    const raw = response.json?.response ?? "";
    return parseJsonResponse(raw);
  }
}
