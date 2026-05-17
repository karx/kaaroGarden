import { describe, it, expect } from 'vitest'
import { interpolateTemplate, buildFrontmatterPrompt, buildPublishPrompt } from './prompt'

// ── interpolateTemplate ───────────────────────────────────────────────────────

describe('interpolateTemplate', () => {
  it('replaces a known variable', () => {
    expect(interpolateTemplate('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('leaves unknown variables intact as {{key}}', () => {
    expect(interpolateTemplate('Hello {{unknown}}!', {})).toBe('Hello {{unknown}}!')
  })

  it('handles multiple distinct variables', () => {
    expect(interpolateTemplate('{{a}} and {{b}}', { a: 'foo', b: 'bar' })).toBe('foo and bar')
  })

  it('replaces repeated occurrences of the same variable', () => {
    expect(interpolateTemplate('{{x}} {{x}}', { x: 'hi' })).toBe('hi hi')
  })

  it('returns template unchanged when vars is empty', () => {
    const t = 'No placeholders here'
    expect(interpolateTemplate(t, {})).toBe(t)
  })

  it('handles empty string template', () => {
    expect(interpolateTemplate('', { key: 'val' })).toBe('')
  })
})

// ── buildFrontmatterPrompt ────────────────────────────────────────────────────

describe('buildFrontmatterPrompt', () => {
  const base = (overrides?: Partial<Parameters<typeof buildFrontmatterPrompt>>) => {
    const [skill, content, filename, date, notes] = [
      'SKILL_CONTENT',
      'Note body text.',
      'My Note.md',
      '2025-01-15',
      ['NoteA', 'NoteB'],
      ...(overrides ?? []),
    ]
    return buildFrontmatterPrompt(skill, content, filename, date, notes)
  }

  it('includes the skill prompt at the top', () => {
    expect(buildFrontmatterPrompt('MY_SKILL', 'body', 'note.md', '2025-01-15', [])).toContain('MY_SKILL')
  })

  it('includes the note filename', () => {
    expect(buildFrontmatterPrompt('s', 'body', 'My Note.md', '2025-01-15', [])).toContain('My Note.md')
  })

  it('includes today\'s date', () => {
    expect(buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', [])).toContain('2025-01-15')
  })

  it('includes "Stage 1 PROCESS" label', () => {
    expect(buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', [])).toContain('Stage 1 PROCESS')
  })

  it('specifies published: false in schema', () => {
    expect(buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', [])).toContain('"published": false')
  })

  it('truncates note content to 3000 characters', () => {
    const longContent = 'x'.repeat(5000)
    const prompt = buildFrontmatterPrompt('s', longContent, 'note.md', '2025-01-15', [])
    const bodySection = prompt.split('Note content:')[1] ?? ''
    expect(bodySection).not.toContain('x'.repeat(3001))
    expect(bodySection).toContain('x'.repeat(3000))
  })

  it('includes WikiLink candidates in the prompt', () => {
    const prompt = buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', ['Alpha', 'Beta'])
    expect(prompt).toContain('Alpha')
    expect(prompt).toContain('Beta')
  })

  it('limits WikiLink candidates to 50', () => {
    const notes = Array.from({ length: 100 }, (_, i) => `Note${i}`)
    const prompt = buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', notes)
    expect(prompt).toContain('Note49')
    expect(prompt).not.toContain('Note50')
  })

  it('includes the JSON schema fields', () => {
    const prompt = buildFrontmatterPrompt('s', 'body', 'note.md', '2025-01-15', [])
    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"tags"')
    expect(prompt).toContain('"wikilinks"')
    expect(prompt).toContain('"rationale"')
    expect(prompt).toContain('"suggestedFolder"')
  })
})

// ── buildPublishPrompt ────────────────────────────────────────────────────────

describe('buildPublishPrompt', () => {
  it('includes "Stage 3 PUBLISH" label', () => {
    const prompt = buildPublishPrompt('s', 'body', 'note.md', '2025-01-15', [])
    expect(prompt).toContain('Stage 3 PUBLISH')
  })

  it('specifies published: true in schema', () => {
    const prompt = buildPublishPrompt('s', 'body', 'note.md', '2025-01-15', [])
    expect(prompt).toContain('"published": true')
  })

  it('does NOT include suggestedFolder in publish schema', () => {
    const prompt = buildPublishPrompt('s', 'body', 'note.md', '2025-01-15', [])
    expect(prompt).not.toContain('"suggestedFolder"')
  })

  it('truncates content to 3000 chars', () => {
    const prompt = buildPublishPrompt('s', 'x'.repeat(5000), 'note.md', '2025-01-15', [])
    const bodySection = prompt.split('Note content:')[1] ?? ''
    expect(bodySection).not.toContain('x'.repeat(3001))
  })
})
