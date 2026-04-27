# ebrain-gardener

> **Obsidian Plugin** — PROCESS → TRIAGE → PUBLISH pipeline for the eBrain Digital Garden vault.

Brings the eBrain Digital Gardening pipeline natively into Obsidian. No terminal. No Python. No manual copy-paste.

---

## Features

| Component | What it does |
|---|---|
| 🌱 **Garden Sidebar** | Live scored inbox queue · maturity stats · stage buttons |
| ⚙️ **Settings Tab** | Provider (Gemini / OpenAI / Anthropic / Ollama) · model · API key |
| 📋 **Process Command** | `Mod+Shift+G` → LLM suggests frontmatter + WikiLinks → diff modal |
| 🌿 **Publish Command** | Enriches note + sets `published: true` with approval gate |
| 📊 **Triage Modal** | Sortable full-queue table · per-row actions · save report |
| 🪨🌱🌿🌳 **Status Bar** | Maturity icon for the active note |
| 🍃 **Ribbon Badge** | Count of high-score notes not yet published |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/karx/ebrain-gardener.git
cd ebrain-gardener
npm install
```

### 2. Configure vault path

Copy the example env file and set your vault path:

```bash
cp .env.example .env
# Edit .env: VAULT_PATH=D:/src/ebrain
```

### 3. Dev mode (watch + auto-copy to vault)

```bash
npm run dev
```

Builds in watch mode and copies `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/ebrain-gardener/` on every change. Reload Obsidian with Ctrl+R to pick up changes.

### 4. Production build

```bash
npm run build
```

---

## Installing in Obsidian

1. Copy the built files to your vault:
   ```
   .obsidian/plugins/ebrain-gardener/main.js
   .obsidian/plugins/ebrain-gardener/manifest.json
   .obsidian/plugins/ebrain-gardener/styles.css
   ```
2. In Obsidian: **Settings → Community Plugins → Enable** `eBrain Gardener`
3. Go to **Settings → eBrain Gardener** → pick your LLM provider → paste API key

---

## LLM Providers

| Provider | Notes |
|---|---|
| **Google Gemini** | Default. Gemini Flash recommended. |
| **OpenAI** | gpt-4o, gpt-4o-mini |
| **Anthropic** | claude-3-5-sonnet |
| **Ollama** | Local models — no API key needed |

API keys are stored in the plugin's `data.json` (inside `.obsidian/plugins/ebrain-gardener/`). Exclude this from cloud sync if security is a concern.

---

## Commands

| Command | Shortcut |
|---|---|
| Process active note (Stage 1) | `Mod+Shift+G` |
| Publish active note (Stage 3) | — |
| Open triage queue | — |
| Score inbox & refresh sidebar | — |
| Open Garden Sidebar | — |

---

## Project Structure

```
ebrain-gardener/
  main.ts                      Plugin entry point
  styles.css                   Plugin styles
  manifest.json                Obsidian plugin metadata
  esbuild.config.mjs           Build config
  scripts/
    deploy.mjs                 Auto-copy to vault after build
  src/
    scoring.ts                 Inbox scoring engine (port of inbox_score.py)
    settings/
      types.ts                 Settings interface
      secrets.ts               API key storage
      SettingsTab.ts           Settings UI
    llm/
      provider.ts              Vendor-agnostic LLM interface
      gemini.ts                Gemini adapter
      openai.ts                OpenAI + Anthropic adapter
      ollama.ts                Ollama adapter
    skill/
      prompt.ts                SKILL.md loader + prompt builders
    views/
      GardenSidebar.ts         Sidebar ItemView
      TriageModal.ts           Triage queue modal
    ui/
      FrontmatterDiff.ts       Diff modal + WikiLink chips
    commands/
      noteCommands.ts          Process + Publish handlers
```

---

## Roadmap

- [ ] Garden Log auto-update after session (SOP-1 step 6)
- [ ] WikiLink validation against real vault files
- [ ] Optional git commit after Stage 3 publish
- [ ] Guided one-by-one Process Session mode
- [ ] Vault Health Dashboard (Isolation Zero violations)
- [ ] Community plugin submission

---

## Related

- [SKILL.md](https://karx.github.io/ebrain-pipeline/SKILL.md) — the gardening skill that powers the LLM prompts
- [karx/ebrain](https://github.com/karx/ebrain) — the vault this plugin was built for
