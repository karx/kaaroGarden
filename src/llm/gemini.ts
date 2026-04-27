import { LLMProvider, FrontmatterSuggestion, parseJsonResponse } from "./provider";
import { requestUrl } from "obsidian";

export class GeminiProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string = "gemini-2.0-flash"
  ) {}

  async suggest(prompt: string): Promise<FrontmatterSuggestion> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await requestUrl({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Gemini API error ${response.status}: ${response.text}`);
    }

    const json = response.json;
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseJsonResponse(raw);
  }
}
