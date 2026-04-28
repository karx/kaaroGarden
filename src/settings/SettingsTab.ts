import { App, PluginSettingTab, Setting, DropdownComponent, TextComponent, Notice } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { EBrainSettings, LLMProvider, PROVIDER_MODELS } from "./types";

export class EBrainSettingsTab extends PluginSettingTab {
  plugin: EBrainGardenerPlugin;

  constructor(app: App, plugin: EBrainGardenerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "eBrain Gardener Settings" });

    // ── LLM Provider ──────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "LLM Provider" });

    let providerDropdown: DropdownComponent;
    let modelDropdown: DropdownComponent;
    let keyField: TextComponent;

    new Setting(containerEl)
      .setName("Provider")
      .setDesc("Which LLM provider to use for frontmatter and WikiLink suggestions.")
      .addDropdown((dropdown) => {
        providerDropdown = dropdown;
        dropdown
          .addOption("gemini", "Google Gemini")
          .addOption("openai", "OpenAI")
          .addOption("anthropic", "Anthropic")
          .addOption("ollama", "Ollama (local)");

        dropdown.setValue(this.plugin.settings.provider);
        dropdown.onChange(async (value: string) => {
          this.plugin.settings.provider = value as LLMProvider;
          await this.plugin.saveSettings();
          this.updateModelDropdown(modelDropdown, value as LLMProvider);
          this.updateKeyFieldVisibility(keyField, value as LLMProvider);
        });
      });

    // ── Model ────────────────────────────────────────────────────────────────
    new Setting(containerEl)
      .setName("Model")
      .setDesc("Model to use. Options depend on provider.")
      .addDropdown((dropdown) => {
        modelDropdown = dropdown;
        this.updateModelDropdown(dropdown, this.plugin.settings.provider);
        dropdown.onChange(async (value: string) => {
          this.plugin.settings.model = value;
          await this.plugin.saveSettings();
        });
      });

    // ── API Key ───────────────────────────────────────────────────────────────
    const keySetting = new Setting(containerEl)
      .setName("API Key")
      .setDesc("Stored securely in your OS keychain — never saved to disk.");

    keySetting.addText((text) => {
      keyField = text;
      text.inputEl.type = "password";
      text.inputEl.placeholder = "Paste your API key here…";
      text.inputEl.style.width = "100%";

      // Load current key masked display
      this.plugin.secrets.getApiKey(this.plugin.settings.provider).then((key) => {
        if (key) text.inputEl.placeholder = "••••••••••••• (stored)";
      });

      text.onChange(async (value) => {
        if (value.trim()) {
          await this.plugin.secrets.setApiKey(this.plugin.settings.provider, value.trim());
          new Notice("✅ API key saved to keychain");
          text.setValue("");
          text.inputEl.placeholder = "••••••••••••• (stored)";
        }
      });
    });

    keySetting.addButton((btn) => {
      btn.setButtonText("Clear")
        .setWarning()
        .onClick(async () => {
          await this.plugin.secrets.clearApiKey(this.plugin.settings.provider);
          if (keyField) keyField.inputEl.placeholder = "Paste your API key here…";
          new Notice("🗑️ API key cleared from keychain");
        });
    });

    // Hide key field for Ollama
    this.updateKeyFieldVisibility(keyField!, this.plugin.settings.provider);

    // ── Ollama Base URL ───────────────────────────────────────────────────────
    new Setting(containerEl)
      .setName("Ollama Base URL")
      .setDesc("Only used when provider is set to Ollama.")
      .addText((text) => {
        text.setValue(this.plugin.settings.ollamaBaseUrl);
        text.onChange(async (value) => {
          this.plugin.settings.ollamaBaseUrl = value;
          await this.plugin.saveSettings();
        });
      });

    // ── Pipeline Paths ────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Pipeline Paths" });

    new Setting(containerEl)
      .setName("Triage Report Path")
      .setDesc("Where to write the generated triage report (relative to vault root).")
      .addText((text) => {
        text.setValue(this.plugin.settings.triageReportPath);
        text.onChange(async (value) => {
          this.plugin.settings.triageReportPath = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Inbox Folders")
      .setDesc("Comma-separated list of inbox folder names to score.")
      .addText((text) => {
        text.setValue(this.plugin.settings.inboxFolders.join(", "));
        text.onChange(async (value) => {
          this.plugin.settings.inboxFolders = value.split(",").map((s) => s.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Skill Prompt Path")
      .setDesc("Vault-relative path to a custom SKILL.md system prompt (e.g. Resources/SKILL.md). Leave empty to use the built-in prompt.")
      .addText((text) => {
        text.setPlaceholder("Resources/SKILL.md");
        text.setValue(this.plugin.settings.skillPath);
        text.onChange(async (value) => {
          this.plugin.settings.skillPath = value.trim();
          await this.plugin.saveSettings();
        });
      });
  }

  private updateModelDropdown(dropdown: DropdownComponent, provider: LLMProvider): void {
    if (!dropdown) return;
    dropdown.selectEl.empty();
    const models = PROVIDER_MODELS[provider] ?? [];
    models.forEach((m) => dropdown.addOption(m, m));
    const current = this.plugin.settings.model;
    dropdown.setValue(models.includes(current) ? current : models[0]);
  }

  private updateKeyFieldVisibility(keyField: TextComponent, provider: LLMProvider): void {
    if (!keyField) return;
    const show = provider !== "ollama";
    keyField.inputEl.closest(".setting-item")?.setAttribute(
      "style",
      show ? "" : "display:none"
    );
  }
}
