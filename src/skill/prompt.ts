import { App, TFile } from "obsidian";

/**
 * Loads the SKILL.md file from the vault at runtime.
 * Falls back to a built-in prompt if no path is configured or the file is not found.
 */
export async function loadSkillPrompt(app: App, skillPath?: string): Promise<string> {
  const resolvedPath = skillPath?.trim();
  if (!resolvedPath) return FALLBACK_SKILL_PROMPT;

  const file = app.vault.getAbstractFileByPath(resolvedPath);

  if (file instanceof TFile) {
    const raw = await app.vault.read(file);
    return raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
  }

  return FALLBACK_SKILL_PROMPT;
}

const FALLBACK_SKILL_PROMPT = `
You are a Digital Garden maintainer for an Obsidian vault using the PARA framework.
Your job is to help process, triage, and publish notes following these principles:

- Topology over Timeline: graph position > creation date
- Connections over Containers: WikiLinks > folder hierarchy
- Zero Authority: propose changes, never apply without approval
- Atomic Suggestions: one suggestion at a time
- Isolation Zero: every note needs ≥ 2 WikiLinks

When suggesting frontmatter, use this schema:
  title: clear, searchable title
  tags: taxonomy tags
  description: 1–3 sentences
  date: YYYY-MM-DD (today)
  layer: L4-Identity | L3-Principle | L2-System | L1-Instance
  maturity: STUB | SEED | BUDDING | EVERGREEN
  para: Pipeline | Area | SkillSurface | Crystallized
  published: false (only set to true in Stage 3)

WikiLinks use [[NoteTitle]] syntax. Links must resolve to real notes in the vault.
`.trim();

// ── Suggestion prompts ────────────────────────────────────────────────────────

export function buildFrontmatterPrompt(
  skillPrompt: string,
  noteContent: string,
  noteFilename: string,
  today: string,
  existingNotes: string[]
): string {
  const candidates = existingNotes.slice(0, 50).join(", ");
  return `${skillPrompt}

---

## Task: Stage 1 PROCESS — Suggest Frontmatter + WikiLinks

Note filename: ${noteFilename}
Today's date: ${today}
Existing vault notes (for WikiLink candidates): ${candidates}

Note content:
\`\`\`
${noteContent.slice(0, 3000)}
\`\`\`

Respond with a JSON object only (no markdown, no explanation), matching this schema:
{
  "title": "string",
  "tags": ["string"],
  "description": "string",
  "date": "YYYY-MM-DD",
  "layer": "L4-Identity|L3-Principle|L2-System|L1-Instance",
  "maturity": "STUB|SEED|BUDDING|EVERGREEN",
  "para": "Pipeline|Area|SkillSurface|Crystallized",
  "published": false,
  "wikilinks": ["NoteTitle1", "NoteTitle2"],
  "rationale": "string",
  "suggestedFolder": "string"
}`;
}

export function buildPublishPrompt(
  skillPrompt: string,
  noteContent: string,
  noteFilename: string,
  today: string,
  existingNotes: string[]
): string {
  const candidates = existingNotes.slice(0, 50).join(", ");
  return `${skillPrompt}

---

## Task: Stage 3 PUBLISH ACTION — Enrich and Mark Ready

Note filename: ${noteFilename}
Today's date: ${today}
Existing vault notes (for WikiLink candidates): ${candidates}

Note content:
\`\`\`
${noteContent.slice(0, 3000)}
\`\`\`

Respond with a JSON object only (no markdown, no explanation), matching this schema:
{
  "title": "string",
  "tags": ["string"],
  "description": "string",
  "date": "YYYY-MM-DD",
  "layer": "L4-Identity|L3-Principle|L2-System|L1-Instance",
  "maturity": "STUB|SEED|BUDDING|EVERGREEN",
  "para": "Pipeline|Area|SkillSurface|Crystallized",
  "published": true,
  "wikilinks": ["NoteTitle1", "NoteTitle2"],
  "rationale": "string"
}`;
}
