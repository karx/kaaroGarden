# eBrain Gardener

> **Obsidian Plugin** — A PROCESS → TRIAGE → PUBLISH pipeline for digital garden vaults.

Bring your digital gardening workflow natively into Obsidian. Inbox scoring, LLM-powered frontmatter enrichment, and WikiLink suggestions — no terminal, no Python, no manual copy-paste.

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

## Concepts

Notes in your inbox folders are automatically scored using three signals:

```
score = name_quality (×0.4) + frontmatter_completeness (×0.3) + maturity (×0.3)
```

| Maturity | Word count | Score |
|---|---|---|
| 🪨 STUB | < 50 words | 0.1 |
| 🌱 SEED | 50–249 words | 0.4 |
| 🌿 BUDDING | 250–699 words | 0.7 |
| 🌳 EVERGREEN | 700+ words | 1.0 |

Notes with a total score ≥ 0.7 appear highlighted in the sidebar as ready to process.

---

## Installation

### Via BRAT (recommended — gets updates automatically)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian community plugins
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `karx/kaaroGarden`
4. Enable **eBrain Gardener** in Settings → Community Plugins

### Manual install

1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/karx/kaaroGarden/releases/latest)
2. Copy them to `.obsidian/plugins/ebrain-gardener/` in your vault
3. Enable **eBrain Gardener** in Settings → Community Plugins → Reload plugins

---

## Quick Start

1. Open **Settings → eBrain Gardener**
2. Choose your LLM provider and paste your API key
3. Set your inbox folder names (default: `Inbox`, `0_Inbox`)
4. Click the 🌱 ribbon icon to open the Garden Sidebar
5. Open any inbox note → press `Mod+Shift+G` to process it
6. Review the suggested frontmatter in the diff modal → accept changes

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| Provider | `gemini` | LLM provider for AI suggestions |
| Model | `gemini-2.0-flash` | Model (options update per provider) |
| API Key | — | Stored in `data.json` — never sent to Anthropic/the plugin's servers |
| Ollama Base URL | `http://localhost:11434` | Only needed for local Ollama models |
| Inbox Folders | `Inbox, 0_Inbox` | Comma-separated folders to score |
| Triage Report Path | `Garden Triage Report.md` | Where to write the scored queue markdown report |
| Skill Prompt Path | _(empty)_ | Optional vault path to a custom system prompt file |

### API Key Security

API keys are stored in `.obsidian/plugins/ebrain-gardener/data.json`. If you sync your vault to the cloud, add `.obsidian/plugins/ebrain-gardener/data.json` to your sync exclusion list — or use Ollama for a fully local, key-free setup.

---

## LLM Providers

| Provider | Notes |
|---|---|
| **Google Gemini** | Default. `gemini-2.0-flash` — fast and cheap. |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| **Anthropic** | `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307` |
| **Ollama** | Local models — no API key needed. Install [Ollama](https://ollama.ai) first. |

---

## Commands

| Command | Default Shortcut |
|---|---|
| Process active note (Stage 1) | `Mod+Shift+G` |
| Publish active note (Stage 3) | — |
| Open triage queue | — |
| Score inbox & refresh sidebar | — |
| Open Garden Sidebar | — |

All commands are accessible via the Command Palette (`Mod+P`).

---

## Custom Skill Prompt

By default, the plugin uses a built-in system prompt based on the PARA framework and digital gardening conventions. You can override it with your own:

1. Create a markdown file anywhere in your vault (e.g., `Resources/SKILL.md`)
2. Write your custom system prompt — YAML frontmatter is automatically stripped
3. Set **Skill Prompt Path** in settings to the vault-relative path

This lets you tune the LLM's tagging taxonomy, frontmatter schema, or writing style to match your vault's conventions.

---

## Developer Setup

### Clone & install

```bash
git clone https://github.com/karx/kaaroGarden.git
cd ebrain-gardener
npm install
```

### Configure vault path (optional — for auto-deploy on build)

```bash
cp .env.example .env
# Edit .env: VAULT_PATH=/path/to/your/vault
```

### Dev mode (watch + auto-copy to vault)

```bash
npm run dev
```

Builds in watch mode and copies `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/ebrain-gardener/` on every change. Reload Obsidian with `Ctrl+R`.

### Production build

```bash
npm run build
```

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
    scoring.ts                 Inbox scoring engine
    settings/
      types.ts                 Settings interface + defaults
      secrets.ts               API key storage
      SettingsTab.ts           Settings UI
    llm/
      provider.ts              Vendor-agnostic LLM interface
      gemini.ts                Gemini adapter
      openai.ts                OpenAI + Anthropic adapter
      ollama.ts                Ollama adapter
    skill/
      prompt.ts                Skill prompt loader + prompt builders
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

- [ ] WikiLink validation against real vault files
- [ ] Garden Log auto-update after session
- [ ] Optional git commit after Stage 3 publish
- [ ] Guided one-by-one Process Session mode
- [ ] Vault Health Dashboard

---

## License

MIT © [karx](https://github.com/karx)
