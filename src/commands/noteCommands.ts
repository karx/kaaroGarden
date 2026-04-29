import { App, Notice, TFile } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { loadSkillPrompt, buildFrontmatterPrompt, buildPublishPrompt, loadPromptTemplate, interpolateTemplate } from "../skill/prompt";
import { FrontmatterDiffModal, applyFrontmatter } from "../ui/FrontmatterDiff";
import { GeminiProvider } from "../llm/gemini";
import { OpenAIProvider, AnthropicProvider } from "../llm/openai";
import { OllamaProvider } from "../llm/ollama";
import { LLMProvider } from "../llm/provider";
import { GardenSidebarView } from "../views/GardenSidebar";

// ── LLM progress reporter ─────────────────────────────────────────────────────

class LLMProgress {
  private notice: Notice;
  private start: number;
  private label: string;

  constructor(provider: string, model: string) {
    this.label = `${provider} / ${model}`;
    this.start = Date.now();
    this.notice = new Notice(`[${this.label}] Connecting...`, 0);
  }

  step(msg: string): void {
    const elapsed = ((Date.now() - this.start) / 1000).toFixed(1);
    this.notice.setMessage(`[${this.label}] ${msg} (${elapsed}s)`);
  }

  finish(): void {
    this.notice.hide();
  }

  fail(msg: string): void {
    const elapsed = ((Date.now() - this.start) / 1000).toFixed(1);
    this.notice.setMessage(`[${this.label}] Failed after ${elapsed}s: ${msg}`);
    window.setTimeout(() => this.notice.hide(), 8000);
  }
}

// ── Provider factory ──────────────────────────────────────────────────────────

async function buildProvider(plugin: EBrainGardenerPlugin): Promise<LLMProvider> {
  const { provider, model, ollamaBaseUrl } = plugin.settings;

  if (provider === "ollama") {
    return new OllamaProvider(model, ollamaBaseUrl);
  }

  const key = await plugin.secrets.getApiKey(provider);
  if (!key) {
    throw new Error(`No API key found for ${provider}. Go to Settings > eBrain Gardener to add one.`);
  }

  switch (provider) {
    case "gemini":
      return new GeminiProvider(key, model);
    case "openai":
      return new OpenAIProvider(key, model);
    case "anthropic":
      return new AnthropicProvider(key, model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getActiveFile(app: App): TFile | null {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new Notice("No active note. Open a note first.");
    return null;
  }
  return file;
}

function refreshSidebar(plugin: EBrainGardenerPlugin): void {
  const leaf = plugin.app.workspace
    .getLeavesOfType("ebrain-garden-sidebar")
    .find((l) => l.view instanceof GardenSidebarView);
  if (leaf) (leaf.view as GardenSidebarView).refresh();
}

// ── Stage 1: PROCESS ─────────────────────────────────────────────────────────

export async function processNoteCommand(plugin: EBrainGardenerPlugin): Promise<void> {
  const file = getActiveFile(plugin.app);
  if (!file) return;

  const { provider, model } = plugin.settings;
  const progress = new LLMProgress(provider, model);

  try {
    progress.step("Building provider...");
    const llm = await buildProvider(plugin);

    progress.step("Loading prompt...");
    const skillPrompt = await loadSkillPrompt(plugin.app, plugin.settings.skillPath);
    const content = await plugin.app.vault.read(file);
    const today = new Date().toISOString().split("T")[0];

    const existingNotes = plugin.app.vault
      .getMarkdownFiles()
      .map((f) => f.basename)
      .filter((n) => n !== file.basename)
      .slice(0, 100);

    const customTemplate = await loadPromptTemplate(plugin.app, plugin.settings.processPromptPath);
    const prompt = customTemplate
      ? interpolateTemplate(customTemplate, {
          skill: skillPrompt,
          content: content.slice(0, 3000),
          filename: file.name,
          date: today,
          candidates: existingNotes.slice(0, 50).join(", "),
        })
      : buildFrontmatterPrompt(skillPrompt, content, file.name, today, existingNotes);

    progress.step("Waiting for LLM response...");
    const suggestion = await llm.suggest(prompt);

    progress.step("Parsing suggestion...");
    progress.finish();

    new FrontmatterDiffModal(plugin.app, plugin, file, suggestion, async (accepted) => {
      await applyFrontmatter(plugin.app, file, accepted);
      refreshSidebar(plugin);
    }).open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    progress.fail(msg);
    console.error("[eBrain Gardener] processNote error:", err);
  }
}

// ── Stage 3: PUBLISH ─────────────────────────────────────────────────────────

export async function publishNoteCommand(plugin: EBrainGardenerPlugin): Promise<void> {
  const file = getActiveFile(plugin.app);
  if (!file) return;

  const { provider, model } = plugin.settings;
  const progress = new LLMProgress(provider, model);

  try {
    progress.step("Building provider...");
    const llm = await buildProvider(plugin);

    progress.step("Loading prompt...");
    const skillPrompt = await loadSkillPrompt(plugin.app, plugin.settings.skillPath);
    const content = await plugin.app.vault.read(file);
    const today = new Date().toISOString().split("T")[0];

    const existingNotes = plugin.app.vault
      .getMarkdownFiles()
      .map((f) => f.basename)
      .filter((n) => n !== file.basename)
      .slice(0, 100);

    const customTemplate = await loadPromptTemplate(plugin.app, plugin.settings.publishPromptPath);
    const prompt = customTemplate
      ? interpolateTemplate(customTemplate, {
          skill: skillPrompt,
          content: content.slice(0, 3000),
          filename: file.name,
          date: today,
          candidates: existingNotes.slice(0, 50).join(", "),
        })
      : buildPublishPrompt(skillPrompt, content, file.name, today, existingNotes);

    progress.step("Waiting for LLM response...");
    const suggestion = await llm.suggest(prompt);
    suggestion.published = true;

    progress.step("Parsing suggestion...");
    progress.finish();

    new FrontmatterDiffModal(plugin.app, plugin, file, suggestion, async (accepted) => {
      await applyFrontmatter(plugin.app, file, accepted);
      new Notice(`"${file.basename}" marked as published.`);
      refreshSidebar(plugin);
    }).open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    progress.fail(msg);
    console.error("[eBrain Gardener] publishNote error:", err);
  }
}
