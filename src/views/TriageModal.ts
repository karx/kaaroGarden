import { App, Modal, Notice, TFile } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { NoteScore, scoreInboxNotes } from "../scoring";

/**
 * Full scored inbox table modal with sortable columns and direct action buttons.
 */
export class TriageModal extends Modal {
  private plugin: EBrainGardenerPlugin;
  private scores: NoteScore[] = [];
  private sortKey: keyof NoteScore = "total";
  private sortAsc = false;

  constructor(app: App, plugin: EBrainGardenerPlugin) {
    super(app);
    this.plugin = plugin;
    this.modalEl.addClass("ebrain-triage-modal");
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Inbox Triage Queue" });

    const loading = contentEl.createDiv({ text: "Scoring inbox notes…", cls: "ebrain-loading" });

    this.scores = await scoreInboxNotes(
      this.app.vault,
      this.plugin.settings.inboxFolders
    );
    loading.remove();

    this.renderTable(contentEl);

    // Save report button
    const btnRow = contentEl.createDiv({ cls: "ebrain-modal-actions" });
    const saveBtn = btnRow.createEl("button", { cls: "mod-cta", text: "Save Triage Report" });
    saveBtn.addEventListener("click", () => this.saveReport());

    const closeBtn = btnRow.createEl("button", { text: "Close" });
    closeBtn.addEventListener("click", () => this.close());
  }

  private renderTable(container: HTMLElement): void {
    container.querySelector(".ebrain-table-wrapper")?.remove();

    const wrapper = container.createDiv({ cls: "ebrain-table-wrapper" });
    const table = wrapper.createEl("table", { cls: "ebrain-triage-table" });

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    const cols: { key: keyof NoteScore; label: string }[] = [
      { key: "total", label: "Score" },
      { key: "maturity", label: "Maturity" },
      { key: "words", label: "Words" },
      { key: "hasFrontmatter", label: "FM" },
      { key: "hasPublished", label: "Published" },
    ];

    cols.forEach(({ key, label }) => {
      const th = headerRow.createEl("th", { text: label, cls: "sortable" });
      if (this.sortKey === key) th.addClass(this.sortAsc ? "sort-asc" : "sort-desc");
      th.addEventListener("click", () => {
        if (this.sortKey === key) this.sortAsc = !this.sortAsc;
        else { this.sortKey = key; this.sortAsc = false; }
        this.renderTable(container);
      });
    });
    headerRow.createEl("th", { text: "File" });
    headerRow.createEl("th", { text: "Actions" });

    const sorted = [...this.scores].sort((a, b) => {
      const av = a[this.sortKey] as number | string | boolean;
      const bv = b[this.sortKey] as number | string | boolean;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortAsc ? cmp : -cmp;
    });

    const tbody = table.createEl("tbody");
    sorted.forEach((score) => {
      const tr = tbody.createEl("tr");
      const scoreClass = score.total >= 0.7 ? "score-high" : score.total >= 0.4 ? "score-mid" : "score-low";

      tr.createEl("td", { text: score.total.toFixed(2), cls: scoreClass });
      tr.createEl("td", { text: score.maturity });
      tr.createEl("td", { text: String(score.words) });
      tr.createEl("td", { text: score.hasFrontmatter ? "✓" : "✗", cls: score.hasFrontmatter ? "tick" : "cross" });
      tr.createEl("td", { text: score.hasPublished ? "✓" : "✗", cls: score.hasPublished ? "tick" : "cross" });

      const nameTd = tr.createEl("td");
      const nameLink = nameTd.createEl("a", { text: score.file.basename, cls: "ebrain-note-link" });
      nameLink.addEventListener("click", () => {
        this.app.workspace.openLinkText(score.file.path, "", false);
        this.close();
      });

      const actionsTd = tr.createEl("td", { cls: "ebrain-actions-cell" });

      const processBtn = actionsTd.createEl("button", { text: "Process", cls: "ebrain-action-btn" });
      processBtn.addEventListener("click", async () => {
        await this.app.workspace.openLinkText(score.file.path, "", false);
        // @ts-ignore
        this.plugin.app.commands.executeCommandById("ebrain-gardener:processNote");
        this.close();
      });

      if (!score.hasPublished) {
        const publishBtn = actionsTd.createEl("button", { text: "Publish", cls: "ebrain-action-btn mod-cta" });
        publishBtn.addEventListener("click", async () => {
          await this.app.workspace.openLinkText(score.file.path, "", false);
          // @ts-ignore
          this.plugin.app.commands.executeCommandById("ebrain-gardener:publishNote");
          this.close();
        });
      }
    });
  }

  private async saveReport(): Promise<void> {
    const { renderTriageReport } = await import("../scoring");
    const report = renderTriageReport(this.scores, this.app.vault.getName());
    const path = this.plugin.settings.triageReportPath;
    const file = this.app.vault.getAbstractFileByPath(path);

    if (file instanceof TFile) {
      await this.app.vault.modify(file, report);
    } else {
      await this.app.vault.create(path, report);
    }

    new Notice(`Triage report saved: ${path}`);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
