import { describe, it, expect, vi } from 'vitest'
import type { App, TFile } from 'obsidian'
import { buildFrontmatterYAML, applyFrontmatter } from './FrontmatterDiff'
import type { FrontmatterSuggestion } from '../llm/provider'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const base: FrontmatterSuggestion = {
  title: 'My Note',
  tags: [],
  description: 'A test note.',
  date: '2025-01-15',
  layer: 'L2-System',
  maturity: 'BUDDING',
  para: 'Area',
  published: false,
  wikilinks: [],
  rationale: 'Good.',
}

function mockFile(name: string): TFile {
  return { name, path: name, basename: name.replace(/\.md$/, '') } as unknown as TFile
}

function mockApp(existingContent: string): { app: App; written: () => string } {
  let written = ''
  const app = {
    vault: {
      read: vi.fn().mockResolvedValue(existingContent),
      modify: vi.fn().mockImplementation((_f: unknown, text: string) => {
        written = text
        return Promise.resolve()
      }),
    },
  } as unknown as App
  return { app, written: () => written }
}

// ── buildFrontmatterYAML ──────────────────────────────────────────────────────

describe('buildFrontmatterYAML', () => {
  it('wraps output in --- delimiters', () => {
    const yaml = buildFrontmatterYAML(base)
    expect(yaml.startsWith('---')).toBe(true)
    expect(yaml.endsWith('---')).toBe(true)
  })

  it('does not include a trailing newline', () => {
    expect(buildFrontmatterYAML(base).endsWith('\n')).toBe(false)
  })

  it('renders published: false', () => {
    expect(buildFrontmatterYAML({ ...base, published: false })).toContain('published: false')
  })

  it('renders published: true', () => {
    expect(buildFrontmatterYAML({ ...base, published: true })).toContain('published: true')
  })

  it('renders empty tags as tags: []', () => {
    expect(buildFrontmatterYAML({ ...base, tags: [] })).toContain('tags: []')
  })

  it('renders a single tag as an inline list item', () => {
    const yaml = buildFrontmatterYAML({ ...base, tags: ['reference'] })
    expect(yaml).toContain('tags:\n  - reference')
  })

  it('renders multiple tags as a YAML list', () => {
    const yaml = buildFrontmatterYAML({ ...base, tags: ['a', 'b', 'c'] })
    expect(yaml).toContain('tags:\n  - a\n  - b\n  - c')
  })

  it('double-quotes the title', () => {
    expect(buildFrontmatterYAML({ ...base, title: 'Hello' })).toContain('title: "Hello"')
  })

  it('double-quotes the description', () => {
    expect(buildFrontmatterYAML({ ...base, description: 'Desc' })).toContain('description: "Desc"')
  })

  it('renders date, layer, maturity, para without quotes', () => {
    const yaml = buildFrontmatterYAML(base)
    expect(yaml).toContain('date: 2025-01-15')
    expect(yaml).toContain('layer: L2-System')
    expect(yaml).toContain('maturity: BUDDING')
    expect(yaml).toContain('para: Area')
  })

  it('does not include wikilinks (handled separately)', () => {
    const yaml = buildFrontmatterYAML({ ...base, wikilinks: ['Alpha', 'Beta'] })
    expect(yaml).not.toContain('Alpha')
    expect(yaml).not.toContain('wikilinks')
  })
})

// ── applyFrontmatter ──────────────────────────────────────────────────────────

describe('applyFrontmatter — FM replacement', () => {
  it('replaces existing frontmatter', async () => {
    const existing = '---\ntitle: Old\n---\n\nBody text here.'
    const { app, written } = mockApp(existing)
    await applyFrontmatter(app, mockFile('note.md'), { ...base, title: 'New' })
    expect(written()).toContain('title: "New"')
    expect(written()).not.toContain('title: Old')
  })

  it('preserves the body when replacing frontmatter', async () => {
    const existing = '---\ntitle: Old\n---\n\nBody text here.'
    const { app, written } = mockApp(existing)
    await applyFrontmatter(app, mockFile('note.md'), base)
    expect(written()).toContain('Body text here.')
  })

  it('prepends frontmatter when none exists', async () => {
    const { app, written } = mockApp('Just a plain body.')
    await applyFrontmatter(app, mockFile('note.md'), base)
    expect(written().startsWith('---')).toBe(true)
    expect(written()).toContain('Just a plain body.')
  })
})

describe('applyFrontmatter — WikiLink injection', () => {
  it('appends new WikiLinks in a Related section', async () => {
    const { app, written } = mockApp('Some body.')
    await applyFrontmatter(app, mockFile('note.md'), { ...base, wikilinks: ['Alpha', 'Beta'] })
    expect(written()).toContain('[[Alpha]]')
    expect(written()).toContain('[[Beta]]')
    expect(written()).toContain('*Related:*')
  })

  it('does not duplicate WikiLinks already present in the body', async () => {
    const existing = 'Text that already links [[Alpha]] here.'
    const { app, written } = mockApp(existing)
    await applyFrontmatter(app, mockFile('note.md'), { ...base, wikilinks: ['Alpha', 'Beta'] })
    const body = written()
    expect(body.match(/\[\[Alpha\]\]/g)?.length).toBe(1)
    expect(body).toContain('[[Beta]]')
  })

  it('adds no Related section when all WikiLinks are already present', async () => {
    const existing = 'Already has [[Alpha]] and [[Beta]].'
    const { app, written } = mockApp(existing)
    await applyFrontmatter(app, mockFile('note.md'), { ...base, wikilinks: ['Alpha', 'Beta'] })
    expect(written()).not.toContain('*Related:*')
  })

  it('adds no Related section when wikilinks is empty', async () => {
    const { app, written } = mockApp('Body.')
    await applyFrontmatter(app, mockFile('note.md'), { ...base, wikilinks: [] })
    expect(written()).not.toContain('*Related:*')
  })
})
