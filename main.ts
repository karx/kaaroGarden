import {
  Plugin,
  WorkspaceLeaf,
  Notice,
} from "obsidian";

import { EBrainSettings, DEFAULT_SETTINGS } from "./src/settings/types";
import { EBrainSettingsTab } from "./src/settings/SettingsTab";
import { SecretsManager } from "./src/settings/secrets";
import { GardenSidebarView, GARDEN_SIDEBAR_VIEW_TYPE } from "./src/views/GardenSidebar";
import { TriageModal } from "./src/views/TriageModal";
import { processNoteCommand, publishNoteCommand } from "./src/commands/noteCommands";
import { scoreInboxNotes } from "./src/scoring";

export default class EBrainGardenerPlugin extends Plugin {
  settings: EBrainSettings = DEFAULT_SETTINGS;
  secrets!: SecretsManager;
  private ribbonBadge: HTMLElement | null = null;
  private statusBarItem: HTMLElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.secrets = new SecretsManager(this);
    await this.secrets.load(); // initialize in-memory key cache from data.json

    // ── Register sidebar view ─────────────────────────────────────────────────
    this.registerView(GARDEN_SIDEBAR_VIEW_TYPE, (leaf) => new GardenSidebarView(leaf, this));

    // ── Ribbon button ─────────────────────────────────────────────────────────
    const ribbonIcon = this.addRibbonIcon("sprout", "Open eBrain Garden", () => {
      this.activateSidebar();
    });
    this.ribbonBadge = ribbonIcon.createSpan({ cls: "ebrain-ribbon-badge", text: "" });
    ribbonIcon.appendChild(this.ribbonBadge);

    // ── Status bar ────────────────────────────────────────────────────────────
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("ebrain-status");
    this.statusBarItem.setText("🌱");
    this.statusBarItem.title = "eBrain Garden — click to open";
    this.statusBarItem.addEventListener("click", () => this.activateSidebar());

    // ── Commands ──────────────────────────────────────────────────────────────
    this.addCommand({
      id: "processNote",
      name: "eBrain: Process active note (Stage 1)",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "g" }],
      callback: () => processNoteCommand(this),
    });

    this.addCommand({
      id: "publishNote",
      name: "eBrain: Publish active note (Stage 3)",
      callback: () => publishNoteCommand(this),
    });

    this.addCommand({
      id: "openTriage",
      name: "eBrain: Open triage queue",
      callback: () => new TriageModal(this.app, this).open(),
    });

    this.addCommand({
      id: "scoreInbox",
      name: "eBrain: Score inbox & refresh sidebar",
      callback: async () => {
        await this.refreshSidebar();
        new Notice("🌱 Inbox scored — sidebar refreshed");
      },
    });

    this.addCommand({
      id: "openSidebar",
      name: "eBrain: Open Garden Sidebar",
      callback: () => this.activateSidebar(),
    });

    // ── Settings tab ──────────────────────────────────────────────────────────
    this.addSettingTab(new EBrainSettingsTab(this.app, this));

    // ── Active file watcher → update status bar maturity ─────────────────────
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.updateStatusBar())
    );

    // ── Initial sidebar open on first load ────────────────────────────────────
    this.app.workspace.onLayoutReady(() => {
      this.activateSidebar();
      this.updateRibbonBadge();
    });

    console.log("[eBrain Gardener] loaded ✅");
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(GARDEN_SIDEBAR_VIEW_TYPE);
    console.log("[eBrain Gardener] unloaded");
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) ?? {};
    // Strip _keys so they don't pollute the settings object
    const { _keys, ...rest } = raw as Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rest) as EBrainSettings;
  }

  async saveSettings(): Promise<void> {
    // Preserve _keys when saving settings — do NOT overwrite with saveData(this.settings)
    const existing = (await this.loadData()) ?? {};
    const keys = (existing as Record<string, unknown>)['_keys'];
    const toSave: Record<string, unknown> = { ...this.settings };
    if (keys !== undefined) toSave['_keys'] = keys;
    await this.saveData(toSave);
  }

  // ── Sidebar management ────────────────────────────────────────────────────

  async activateSidebar(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(GARDEN_SIDEBAR_VIEW_TYPE);

    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const rightLeaf = this.app.workspace.getRightLeaf(false);
    if (rightLeaf) {
      await rightLeaf.setViewState({ type: GARDEN_SIDEBAR_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(rightLeaf);
    }
  }

  async refreshSidebar(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(GARDEN_SIDEBAR_VIEW_TYPE)) {
      if (leaf.view instanceof GardenSidebarView) {
        await leaf.view.refresh();
      }
    }
  }

  // ── Status bar: maturity of active note ──────────────────────────────────

  private async updateStatusBar(): Promise<void> {
    if (!this.statusBarItem) return;

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      this.statusBarItem.setText("🌱");
      return;
    }

    const content = await this.app.vault.cachedRead(file);
    const { scoreNote } = await import("./src/scoring");
    const { MATURITY_ICON } = await import("./src/scoring");
    const score = scoreNote(file, content);
    this.statusBarItem.setText(`${MATURITY_ICON[score.maturity]} ${score.maturity}`);
    this.statusBarItem.title = `Score: ${score.total.toFixed(2)} · ${score.words}w`;
  }

  // ── Ribbon badge: count of ready-to-review notes ─────────────────────────

  private async updateRibbonBadge(): Promise<void> {
    if (!this.ribbonBadge) return;

    const scores = await scoreInboxNotes(this.app.vault, this.settings.inboxFolders);
    const ready = scores.filter((s) => s.total >= 0.7 && !s.hasPublished).length;

    this.ribbonBadge.setText(ready > 0 ? String(ready) : "");
    this.ribbonBadge.style.display = ready > 0 ? "block" : "none";
  }
}
