// Vendor-agnostic LLM abstraction

export interface FrontmatterSuggestion {
  title: string;
  tags: string[];
  description: string;
  date: string;
  layer: string;
  maturity: string;
  para: string;
  published: boolean;
  wikilinks: string[];
  rationale: string;
  suggestedFolder?: string;
}

export interface LLMProvider {
  /**
   * Suggest frontmatter + WikiLinks for a note (Stage 1 / Stage 3).
   */
  suggest(prompt: string): Promise<FrontmatterSuggestion>;
}

/**
 * Parse an LLM JSON response, stripping markdown fences if present.
 */
export function parseJsonResponse(raw: string): FrontmatterSuggestion {
  // Strip ```json ... ``` or bare ``` fences
  const stripped = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const parsed = JSON.parse(stripped);

  return {
    title: parsed.title ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    description: parsed.description ?? "",
    date: parsed.date ?? new Date().toISOString().split("T")[0],
    layer: parsed.layer ?? "L1-Instance",
    maturity: parsed.maturity ?? "SEED",
    para: parsed.para ?? "Pipeline",
    published: parsed.published === true,
    wikilinks: Array.isArray(parsed.wikilinks) ? parsed.wikilinks : [],
    rationale: parsed.rationale ?? "",
    suggestedFolder: parsed.suggestedFolder,
  };
}
