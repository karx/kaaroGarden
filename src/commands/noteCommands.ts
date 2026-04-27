import { App, Notice, TFile } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { loadSkillPrompt, buildFrontmatterPrompt } from "../skill/prompt";
import { FrontmatterDiffModal, applyFrontmatter } from "../ui/FrontmatterDiff";
import { GeminiProvider } from "../llm/gemini";
import { OpenAIProvider, AnthropicProvider } from "../llm/openai";
import { OllamaProvider } from "../llm/ollama";
import { LLMProvider } from "../llm/provider";
import { GardenSidebarView } from "../views/GardenSidebar";

async function buildProvider(plugin: EBrainGardenerPlugin): Promise<LLMProvider> {
  const { provider, model, ollamaBaseUrl } = plugin.settings;

  if (provider === "ollama") {
    return new OllamaProvider(model, ollamaBaseUrl);
  }

  const key = await plugin.secrets.getApiKey(provider);
  if (!key) {
    throw new Error(`No API key found for ${provider}. Go to Settings → eBrain Gardener to add one.`);
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
    new Notice("⚠️ No active note. Open a note first.");
    return null;
  }
  return file;
}

/**
 * Stage 1: PROCESS — Score + Classify + Suggest Frontmatter + WikiLinks
 */
export async function processNoteCommand(plugin: EBrainGardenerPlugin): Promise<void> {
  const file = getActiveFile(plugin.app);
  if (!file) return;

  new Notice(`🌱 Processing "${file.basename}"…`);

  try {
    const llm = await buildProvider(plugin);
    const skillPrompt = await loadSkillPrompt(plugin.app);
    const content = await plugin.app.vault.read(file);
    const today = new Date().toISOString().split("T")[0];

    // Gather vault note names as WikiLink candidates
    const existingNotes = plugin.app.vault
      .getMarkdownFiles()
      .map((f) => f.basename)
      .filter((n) => n !== file.basename)
      .slice(0, 100);

    const prompt = buildFrontmatterPrompt(skillPrompt, content, file.name, today, existingNotes);
    const suggestion = await llm.suggest(prompt);

    // Show diff modal for user approval
    new FrontmatterDiffModal(plugin.app, plugin, file, suggestion, async (accepted) => {
      await applyFrontmatter(plugin.app, file, accepted);
      // Refresh sidebar
      const sidebar = plugin.app.workspace
        .getLeavesOfType("ebrain-garden-sidebar")
        .find((l) => l.view instanceof GardenSidebarView);
      if (sidebar) await (sidebar.view as GardenSidebarView).refresh();
    }).open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    new Notice(`❌ Process failed: ${msg}`, 8000);
    console.error("[eBrain Gardener] processNote error:", err);
  }
}

/**
 * Stage 3: PUBLISH ACTION — Enrich + Set published: true
 */
export async function publishNoteCommand(plugin: EBrainGardenerPlugin): Promise<void> {
  const file = getActiveFile(plugin.app);
  if (!file) return;

  new Notice(`🌿 Preparing publish for "${file.basename}"…`);

  try {
    const llm = await buildProvider(plugin);
    const skillPrompt = await loadSkillPrompt(plugin.app);
    const content = await plugin.app.vault.read(file);
    const today = new Date().toISOString().split("T")[0];
    const { buildPublishPrompt } = await import("../skill/prompt");

    const existingNotes = plugin.app.vault
      .getMarkdownFiles()
      .map((f) => f.basename)
      .filter((n) => n !== file.basename)
      .slice(0, 100);

    const prompt = buildPublishPrompt(skillPrompt, content, file.name, today, existingNotes);
    const suggestion = await llm.suggest(prompt);
    suggestion.published = true; // Enforce Stage 3 gate

    new FrontmatterDiffModal(plugin.app, plugin, file, suggestion, async (accepted) => {
      await applyFrontmatter(plugin.app, file, accepted);
      new Notice(`🌿 "${file.basename}" marked as published!`);
      const sidebar = plugin.app.workspace
        .getLeavesOfType("ebrain-garden-sidebar")
        .find((l) => l.view instanceof GardenSidebarView);
      if (sidebar) await (sidebar.view as GardenSidebarView).refresh();
    }).open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    new Notice(`❌ Publish failed: ${msg}`, 8000);
    console.error("[eBrain Gardener] publishNote error:", err);
  }
}
