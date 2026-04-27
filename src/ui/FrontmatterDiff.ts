import { App, Modal, Notice, TFile } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { FrontmatterSuggestion } from "../llm/provider";

/**
 * Shows a diff-style preview of proposed frontmatter changes.
 * User can accept all, reject, or edit individual fields before applying.
 */
export class FrontmatterDiffModal extends Modal {
  private suggestion: FrontmatterSuggestion;
  private file: TFile;
  private plugin: EBrainGardenerPlugin;
  private onAccept: (accepted: FrontmatterSuggestion) => void;

  constructor(
    app: App,
    plugin: EBrainGardenerPlugin,
    file: TFile,
    suggestion: FrontmatterSuggestion,
    onAccept: (accepted: FrontmatterSuggestion) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.file = file;
    this.suggestion = suggestion;
    this.onAccept = onAccept;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("ebrain-diff-modal");

    const header = contentEl.createDiv({ cls: "ebrain-modal-header" });
    header.createEl("h2", { text: `🌱 Process Suggestion` });
    header.createEl("p", { text: this.file.path, cls: "ebrain-file-path" });

    // Rationale
    if (this.suggestion.rationale) {
      const rationale = contentEl.createDiv({ cls: "ebrain-rationale" });
      rationale.createEl("strong", { text: "Rationale: " });
      rationale.createSpan({ text: this.suggestion.rationale });
    }

    // Suggested folder
    if (this.suggestion.suggestedFolder) {
      const folderRow = contentEl.createDiv({ cls: "ebrain-suggestion-row" });
      folderRow.createEl("span", { text: "📁 Move to: ", cls: "ebrain-label" });
      folderRow.createEl("code", { text: this.suggestion.suggestedFolder });
    }

    // Frontmatter preview
    contentEl.createEl("h3", { text: "Frontmatter to inject" });
    const fmBlock = contentEl.createEl("pre", { cls: "ebrain-fm-preview" });
    fmBlock.createEl("code", { text: this.buildFrontmatterYAML(this.suggestion) });

    // WikiLinks
    if (this.suggestion.wikilinks.length > 0) {
      contentEl.createEl("h3", { text: "WikiLinks to add" });
      const chips = contentEl.createDiv({ cls: "ebrain-wikilink-chips" });
      this.suggestion.wikilinks.forEach((link) => {
        const chip = chips.createEl("span", { cls: "ebrain-chip", text: `[[${link}]]` });
        chip.setAttribute("title", "Click to remove");
        chip.addEventListener("click", () => {
          this.suggestion.wikilinks = this.suggestion.wikilinks.filter((l) => l !== link);
          chip.remove();
        });
      });
    }

    // Buttons
    const actions = contentEl.createDiv({ cls: "ebrain-modal-actions" });

    const acceptBtn = actions.createEl("button", {
      cls: "mod-cta",
      text: "✅ Accept & Apply",
    });
    acceptBtn.addEventListener("click", () => {
      this.onAccept(this.suggestion);
      this.close();
    });

    const rejectBtn = actions.createEl("button", {
      text: "❌ Reject",
    });
    rejectBtn.addEventListener("click", () => {
      new Notice("Suggestion rejected — no changes made.");
      this.close();
    });
  }

  private buildFrontmatterYAML(s: FrontmatterSuggestion): string {
    const tags = s.tags.length > 0 ? `\n  - ${s.tags.join("\n  - ")}` : " []";
    return [
      "---",
      `published: ${s.published}`,
      `title: "${s.title}"`,
      `tags:${tags}`,
      `description: "${s.description}"`,
      `date: ${s.date}`,
      `layer: ${s.layer}`,
      `maturity: ${s.maturity}`,
      `para: ${s.para}`,
      "---",
    ].join("\n");
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * Applies a frontmatter suggestion to a file in the vault.
 * If frontmatter already exists, it replaces it. Otherwise prepends it.
 */
export async function applyFrontmatter(
  app: App,
  file: TFile,
  suggestion: FrontmatterSuggestion
): Promise<void> {
  const content = await app.vault.read(file);

  const tags = suggestion.tags.length > 0
    ? `\n  - ${suggestion.tags.join("\n  - ")}`
    : " []";

  const fm = [
    "---",
    `published: ${suggestion.published}`,
    `title: "${suggestion.title}"`,
    `tags:${tags}`,
    `description: "${suggestion.description}"`,
    `date: ${suggestion.date}`,
    `layer: ${suggestion.layer}`,
    `maturity: ${suggestion.maturity}`,
    `para: ${suggestion.para}`,
    "---",
    "",
  ].join("\n");

  // Remove existing frontmatter if present
  const stripped = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");

  // Add WikiLinks at end if not already present
  let body = stripped;
  if (suggestion.wikilinks.length > 0) {
    const newLinks = suggestion.wikilinks
      .filter((link) => !body.includes(`[[${link}]]`))
      .map((l) => `[[${l}]]`)
      .join(" · ");
    if (newLinks) {
      body = body.trimEnd() + `\n\n---\n\n*Related:* ${newLinks}\n`;
    }
  }

  await app.vault.modify(file, fm + body);
  new Notice(`✅ Frontmatter applied to ${file.name}`);
}
