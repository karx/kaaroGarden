# Changelog

All notable changes to this project will be documented in this file.

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
