// Settings types shared across the plugin
export type LLMProvider = "gemini" | "openai" | "anthropic" | "ollama";

export interface EBrainSettings {
  provider: LLMProvider;
  model: string;
  ollamaBaseUrl: string;
  triageReportPath: string;
  inboxFolders: string[];
  skillPath: string;
  processPromptPath: string;
  publishPromptPath: string;
  // Note: API keys are NOT stored here — they go to data.json under _keys
}

export const DEFAULT_SETTINGS: EBrainSettings = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  ollamaBaseUrl: "http://localhost:11434",
  triageReportPath: "Garden Triage Report.md",
  inboxFolders: ["Inbox", "0_Inbox"],
  skillPath: "",
  processPromptPath: "",
  publishPromptPath: "",
};

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  gemini: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  openai: ["gpt-4.1", "gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"],
  ollama: ["llama3.2", "mistral", "phi3"],
};
