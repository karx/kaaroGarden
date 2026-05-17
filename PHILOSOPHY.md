# Core Philosophy of ebrain-gardener

## The Gardening Metaphor

Knowledge does not arrive fully formed. It begins as a fragment — a half-thought, a clipped article, a rough idea captured before it evaporates. The challenge of personal knowledge management is not capture but cultivation: the patient, ongoing work of returning to raw material and growing it into something useful.

ebrain-gardener treats your vault as a living garden. Notes are not files to be filed; they are organisms at different stages of growth. A note is born in the inbox as a seed, and through deliberate tending — enriching its metadata, connecting it to adjacent ideas, revisiting and expanding it — it matures into a stable, evergreen piece of knowledge.

This is not a metaphor imposed for aesthetic reasons. It reflects a real epistemological claim: **knowledge compounds through connection and revisitation, not through storage and retrieval**. The garden model keeps that claim visible in your daily workflow.

---

## Principles

### 1. Topology over Timeline

The location of a note in your knowledge graph matters more than when it was created or where it lives in a folder tree. A note written three years ago that is densely connected to your current thinking is more alive than a note written yesterday that sits in isolation.

This principle shapes every design decision in the plugin. The scoring algorithm weights WikiLinks. The sidebar surfaces notes ready to be connected. The LLM is prompted to find existing vault notes to link to before suggesting any structural changes.

Creation date is metadata. Graph position is destiny.

### 2. Connections over Containers

Folders are a convenience, not a cognitive structure. Organizing notes into deeply nested hierarchies gives an illusion of order while hiding the actual shape of your thinking. Real knowledge structure is a graph, not a tree.

WikiLinks — `[[NoteTitle]]` references between notes — are the primary unit of organization in this plugin. Every note is expected to have at least two outgoing links (the Isolation Zero rule). A note without connections is a note not yet integrated into your knowledge system, regardless of how neatly it is named or filed.

The PARA categories (Pipeline, Area, SkillSurface, Crystallized) and the layer taxonomy (L1-Instance through L4-Identity) are lenses for understanding a note's role, not a replacement for connections. They help you navigate; links are what make the garden grow.

### 3. Zero Authority

The LLM is a gardening assistant, not the gardener.

Every suggestion the plugin generates — frontmatter fields, tags, WikiLinks, folder moves — is presented in a diff view for explicit human approval. Nothing is written to disk without the user's decision. This is not a usability constraint; it is a design principle.

Automated systems that apply changes silently erode your understanding of your own vault. When you approve a suggested WikiLink, you are making an epistemic claim: *yes, this note connects to that one.* That act of judgment is the tending. It is where the thinking happens. The plugin's role is to reduce the friction of that judgment, not to bypass it.

### 4. Isolation Zero

No note in your garden should be an island. A note without connections to the rest of the vault exists only in your short-term memory — as soon as you stop thinking about it, it becomes invisible.

The Isolation Zero rule (every processed note must receive at least two WikiLinks) enforces this structurally. It is a minimum viable integration threshold. A note with two links has a place in the graph. It can be found by traversal, not just by search. It begins to belong.

### 5. Maturity as a Lifecycle, not a Judgment

Notes progress through four stages:

- **STUB** — A raw fragment, under 50 words. A captured idea, not yet developed.
- **SEED** — A young note with enough substance to have a direction (50–249 words).
- **BUDDING** — A developing note with real content, still growing (250–699 words).
- **EVERGREEN** — A mature, stable note that has reached its natural size (700+ words).

These stages are descriptive, not evaluative. A STUB is not a failure; it is a note at the beginning of its life. Many valuable ideas live permanently at SEED maturity — not every thought needs to become an essay. Maturity classification tells you where a note is in its lifecycle so you can tend it appropriately, not rank it against other notes.

The scoring algorithm uses maturity as one signal among three: name quality, frontmatter completeness, and content length together determine how ready a note is for structured enrichment. The score is a readiness indicator for the triage queue, not a measure of a note's worth.

---

## The Scoring System as a Health Signal

The inbox score formula — `name quality (0.4) + frontmatter completeness (0.3) + maturity (0.3)` — answers one question: *is this note ready to be processed?*

A well-named note with no frontmatter and 300 words scores around 0.7. A note called "Untitled" with no metadata scores near 0. The score is not about the note's ideas; it is about the note's structural health. Notes scoring above 0.7 are surfaced in the sidebar as processing candidates.

This continuous background scoring means the plugin functions as a passive garden monitor. It notices which notes have been tended and which remain raw, without requiring you to manually audit your inbox. The sidebar is a live readout of your garden's health.

---

## PARA as Soil

The PARA framework (Projects, Areas, Resources, Archives) — adapted here as Pipeline, Area, SkillSurface, Crystallized — provides the semantic soil in which notes grow. It answers a different question than maturity: not *how developed is this note?* but *what is this note for?*

- **Pipeline** notes are active. They belong to work in progress.
- **Area** notes define ongoing responsibilities and interests.
- **SkillSurface** notes are reference material — things you return to.
- **Crystallized** notes are complete. The thinking is done; the note is an archive.

PARA classification is optional frontmatter, not a required stage in the workflow. But it integrates naturally with the layer taxonomy (L1 through L4), providing two axes of organization: *what kind of knowledge is this?* (layer) and *what role does it play in my work?* (PARA category).

---

## The Role of the LLM

Language models are pattern matchers trained on vast amounts of human writing. This makes them useful for:

- Suggesting tags from an existing taxonomy
- Inferring a concise description from note content
- Identifying existing vault notes that a new note likely connects to
- Classifying notes into PARA and maturity categories

It does not make them useful for deciding what matters. The LLM does not know your goals, your context, or the history of your thinking. It can propose connections; it cannot validate them. That validation — the act of accepting or rejecting a suggested WikiLink — is where your judgment operates, and it is where the value of the garden accrues.

The plugin is deliberately LLM-agnostic. Gemini, OpenAI, Anthropic, Ollama — the choice of model should be driven by your cost and privacy constraints, not by lock-in. The gardening philosophy does not depend on any particular model's capabilities.

---

## What the Plugin Automates and What It Does Not

**Automated:**
- Continuous inbox scoring and maturity classification
- Surfacing processing candidates in the sidebar
- Fetching WikiLink candidates from the vault (up to 100 per call)
- Building and sending the enrichment prompt to the LLM
- Parsing the LLM response into a structured diff

**Not automated:**
- Accepting or rejecting any suggestion
- Writing to your notes without approval
- Deciding which notes are worth developing
- Thinking

The boundary between automated and non-automated is not arbitrary. Everything automated is mechanical and reversible. Everything non-automated requires judgment. The plugin is designed so that automation handles the friction of the tending workflow, leaving the thinking — the actual gardening — to you.

---

## Why "eBrain"

The prefix reflects the broader project context: an externalized brain built in Obsidian. The plugin is one component in a larger practice of treating a personal vault as a second cognitive system — a place where ideas are not just stored but processed, connected, and allowed to develop over time.

The gardener metaphor extends naturally here. You do not outsource your thinking to your garden; you use your garden to think better. The tool supports the practice. The practice is yours.
