import { App, ItemView, WorkspaceLeaf, Notice, TFile, setIcon } from "obsidian";
import type EBrainGardenerPlugin from "../../main";
import { NoteScore, scoreInboxNotes, MATURITY_ICON } from "../scoring";

export const GARDEN_SIDEBAR_VIEW_TYPE = "ebrain-garden-sidebar";

export class GardenSidebarView extends ItemView {
  plugin: EBrainGardenerPlugin;
  private scores: NoteScore[] = [];
  private loadingEl: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: EBrainGardenerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return GARDEN_SIDEBAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "eBrain Garden";
  }

  getIcon(): string {
    return "sprout";
  }

  async onOpen(): Promise<void> {
    this.renderSkeleton();
    await this.refresh();
  }

  private renderSkeleton(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("ebrain-sidebar");

    // Header
    const header = containerEl.createDiv({ cls: "ebrain-sidebar-header" });
    header.createEl("h3", { text: "🌱 eBrain Garden" });

    const refreshBtn = header.createEl("button", { cls: "ebrain-icon-btn", title: "Refresh scores" });
    setIcon(refreshBtn, "refresh-cw");
    refreshBtn.addEventListener("click", () => this.refresh());

    // Stats row
    containerEl.createDiv({ cls: "ebrain-stats-row", attr: { id: "ebrain-stats" } });

    // Stage buttons
    const actions = containerEl.createDiv({ cls: "ebrain-stage-actions" });
    this.makeStageButton(actions, "▶ Process Note", "Process active note with LLM", "processNote");
    this.makeStageButton(actions, "▶ Triage", "Open full triage report", "openTriage");
    this.makeStageButton(actions, "▶ Publish", "Publish active note", "publishNote");

    // Queue
    containerEl.createEl("h4", { text: "Inbox Queue", cls: "ebrain-section-title" });
    this.loadingEl = containerEl.createDiv({ cls: "ebrain-loading", text: "Scoring inbox…" });
    containerEl.createDiv({ cls: "ebrain-queue", attr: { id: "ebrain-queue" } });
  }

  private makeStageButton(parent: HTMLElement, label: string, title: string, commandId: string): void {
    const btn = parent.createEl("button", { cls: "ebrain-stage-btn", text: label, title });
    btn.addEventListener("click", () => {
      // @ts-ignore
      this.plugin.app.commands.executeCommandById(`ebrain-gardener:${commandId}`);
    });
  }

  async refresh(): Promise<void> {
    const { containerEl } = this;
    if (this.loadingEl) {
      this.loadingEl.textContent = "Scoring inbox…";
      this.loadingEl.style.display = "block";
    }

    this.scores = await scoreInboxNotes(
      this.app.vault,
      this.plugin.settings.inboxFolders
    );

    // Update stats
    const statsEl = containerEl.querySelector("#ebrain-stats") as HTMLElement;
    if (statsEl) this.renderStats(statsEl);

    // Update queue
    const queueEl = containerEl.querySelector("#ebrain-queue") as HTMLElement;
    if (queueEl) this.renderQueue(queueEl);

    if (this.loadingEl) this.loadingEl.style.display = "none";
  }

  private renderStats(el: HTMLElement): void {
    el.empty();

    const dist: Record<string, number> = { EVERGREEN: 0, BUDDING: 0, SEED: 0, STUB: 0 };
    this.scores.forEach((s) => dist[s.maturity]++);

    const total = this.scores.length;
    const published = this.scores.filter((s) => s.hasPublished).length;
    const isolated = this.scores.filter((s) => !s.hasFrontmatter).length;

    const stats = [
      { label: "Total", value: total, cls: "" },
      { label: "Published", value: published, cls: "stat-good" },
      { label: "No FM", value: isolated, cls: isolated > 0 ? "stat-warn" : "stat-good" },
    ];

    stats.forEach(({ label, value, cls }) => {
      const chip = el.createDiv({ cls: `ebrain-stat-chip ${cls}` });
      chip.createEl("span", { cls: "stat-val", text: String(value) });
      chip.createEl("span", { cls: "stat-lbl", text: label });
    });

    // Maturity bar
    const bar = el.createDiv({ cls: "ebrain-maturity-bar" });
    [
      { label: "EVERGREEN", icon: "🌳" },
      { label: "BUDDING", icon: "🌿" },
      { label: "SEED", icon: "🌱" },
      { label: "STUB", icon: "🪨" },
    ].forEach(({ label, icon }) => {
      bar.createSpan({
        title: label,
        text: `${icon} ${dist[label] ?? 0}`,
        cls: `mat-${label.toLowerCase()}`,
      });
    });
  }

  private renderQueue(el: HTMLElement): void {
    el.empty();

    if (this.scores.length === 0) {
      el.createDiv({ cls: "ebrain-empty", text: "Inbox is empty 🎉" });
      return;
    }

    this.scores.slice(0, 20).forEach((score) => {
      const row = el.createDiv({ cls: "ebrain-queue-row" });

      const scoreEl = row.createSpan({
        cls: `ebrain-score score-${this.scoreClass(score.total)}`,
        text: score.total.toFixed(2),
      });

      const icon = MATURITY_ICON[score.maturity];
      row.createSpan({ cls: "ebrain-maturity-icon", text: icon });

      const name = row.createSpan({
        cls: "ebrain-note-name",
        text: score.file.basename,
        title: score.file.path,
      });

      row.createSpan({ cls: "ebrain-word-count", text: `${score.words}w` });

      // Click to open note
      row.addEventListener("click", () => {
        this.app.workspace.openLinkText(score.file.path, "", false);
      });

      // Right-click to process
      row.addEventListener("contextmenu", (e: MouseEvent) => {
        e.preventDefault();
        this.app.workspace.openLinkText(score.file.path, "", false).then(() => {
          // @ts-ignore
          this.plugin.app.commands.executeCommandById("ebrain-gardener:processNote");
        });
      });
    });
  }

  private scoreClass(score: number): string {
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "mid";
    return "low";
  }

  async onClose(): Promise<void> {}
}
