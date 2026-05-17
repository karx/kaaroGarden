# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] — 2025-05-18

### Added
- `versions.json` mapping all releases to `minAppVersion` (required by Obsidian plugin registry)
- Unit test suite: 101 tests across 4 files (scoring, LLM provider parsing, prompt building, frontmatter YAML + apply)
- `buildFrontmatterYAML` exported as a pure, tested function shared by the diff modal and `applyFrontmatter`

### Changed
- Removed all `@ts-ignore` suppressions — stage buttons and triage actions now call command functions directly instead of dispatching through the internal `app.commands` API
- Corrected API key settings description: accurately states keys are stored in `data.json` inside the plugin folder
- Updated default model lists: Anthropic → Claude 4.x (`claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`); OpenAI → `gpt-4.1`, `gpt-4o`, `gpt-4o-mini` (removed deprecated `gpt-4-turbo`)
- Bumped Anthropic `max_tokens` from 1024 → 2048

### Fixed
- Eliminated duplicate YAML-building logic between `FrontmatterDiffModal` and `applyFrontmatter`
- Removed `console.log` lifecycle calls from production plugin code
- Removed unused variable assignments and empty `onClose` stub in `GardenSidebarView`

## [0.2.0] — 2025-05-18

### Added
- Custom prompt templates: configurable `processPromptPath` and `publishPromptPath` settings point to vault notes used as system prompts
- LLM progress reporting: real-time status notices during processing and publish commands

### Changed
- Removed emoji decorations from UI elements for cleaner, more professional appearance

## [0.1.0] — 2025-04-28

### Added
- Garden Sidebar with live scored inbox queue, maturity stats, and stage buttons
- Settings tab: provider (Gemini / OpenAI / Anthropic / Ollama), model, and API key management
- Process command (`Mod+Shift+G`): LLM suggests frontmatter + WikiLinks with diff approval modal
- Publish command: enriches note and sets `published: true` with approval gate
- Triage Modal: sortable full-queue table with per-row actions and save-report button
- Status bar: maturity icon (🪨🌱🌿🌳) for the active note
- Ribbon badge: count of high-score notes not yet published
- Inbox scoring engine (name quality × 0.4 + frontmatter × 0.3 + maturity × 0.3)
- Support for Google Gemini, OpenAI, Anthropic, and Ollama providers
- Configurable inbox folders, triage report path, and custom skill prompt path
