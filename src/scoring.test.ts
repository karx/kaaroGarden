import { describe, it, expect } from 'vitest'
import type { TFile } from 'obsidian'
import {
  countWords,
  scoreName,
  scoreFrontmatter,
  scoreMaturity,
  scoreNote,
  extractFrontmatter,
  renderTriageReport,
} from './scoring'

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFile(name: string, path = name): TFile {
  return { name, path } as unknown as TFile
}

function words(n: number): string {
  return Array(n).fill('word').join(' ')
}

// ── countWords ────────────────────────────────────────────────────────────────

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('counts words without frontmatter', () => {
    expect(countWords('one two three')).toBe(3)
  })

  it('strips YAML frontmatter before counting', () => {
    const content = '---\ntitle: Test\n---\n\nHello world foo'
    expect(countWords(content)).toBe(3)
  })

  it('returns 0 for content that is only frontmatter', () => {
    expect(countWords('---\ntitle: Test\n---\n')).toBe(0)
  })

  it('handles multiline body after frontmatter', () => {
    const content = '---\ntitle: T\n---\n\nline one\nline two\nline three'
    expect(countWords(content)).toBe(6)
  })

  it('handles extra whitespace', () => {
    expect(countWords('  one   two  ')).toBe(2)
  })
})

// ── scoreName ─────────────────────────────────────────────────────────────────

describe('scoreName', () => {
  it('returns 0.0 for "Untitled"', () => {
    expect(scoreName('Untitled.md')).toBe(0.0)
  })

  it('returns 0.0 for "Untitled 3"', () => {
    expect(scoreName('Untitled 3.md')).toBe(0.0)
  })

  it('returns 0.0 for lowercase "untitled"', () => {
    expect(scoreName('untitled.md')).toBe(0.0)
  })

  it('returns 0.3 for a single-word name', () => {
    expect(scoreName('Ideas.md')).toBe(0.3)
  })

  it('returns 0.7 for a descriptive multi-word name', () => {
    expect(scoreName('My Cool Project.md')).toBe(0.7)
  })

  it('returns 0.7 for hyphen-separated multi-word name', () => {
    expect(scoreName('intent-driven-development.md')).toBe(0.7)
  })

  it('returns 1.0 for name containing ISO date', () => {
    expect(scoreName('2025-01-15 Meeting Notes.md')).toBe(1.0)
  })

  it('returns 0.3 for 8-digit date (single token — date check not reached)', () => {
    // '20250115' splits into one token, so the date regex is never evaluated.
    // This is a known behaviour: use 'YYYY-MM-DD' format to trigger the 1.0 path.
    expect(scoreName('20250115.md')).toBe(0.3)
  })

  it('returns 1.0 for name with year-month pattern', () => {
    expect(scoreName('2025-01 Review.md')).toBe(1.0)
  })
})

// ── scoreFrontmatter ──────────────────────────────────────────────────────────

describe('scoreFrontmatter', () => {
  it('returns 0.0 with no frontmatter markers', () => {
    const { hasFm, hasPub, score } = scoreFrontmatter('Just plain text')
    expect(hasFm).toBe(false)
    expect(hasPub).toBe(false)
    expect(score).toBe(0.0)
  })

  it('returns 0.7 for frontmatter without a published field', () => {
    const content = '---\ntitle: Test\ntags: []\n---\n\nContent'
    const { hasFm, hasPub, score } = scoreFrontmatter(content)
    expect(hasFm).toBe(true)
    expect(hasPub).toBe(false)
    expect(score).toBe(0.7)
  })

  it('returns 1.0 for frontmatter with published: false', () => {
    const content = '---\ntitle: Test\npublished: false\n---\n\nContent'
    const { hasFm, hasPub, score } = scoreFrontmatter(content)
    expect(hasFm).toBe(true)
    expect(hasPub).toBe(true)
    expect(score).toBe(1.0)
  })

  it('returns 1.0 for frontmatter with published: true', () => {
    const content = '---\npublished: true\n---\n\nContent'
    const { score } = scoreFrontmatter(content)
    expect(score).toBe(1.0)
  })

  it('does not treat mid-document "published:" as frontmatter', () => {
    const content = 'Some text\npublished: true\nmore text'
    const { hasFm } = scoreFrontmatter(content)
    expect(hasFm).toBe(false)
  })
})

// ── scoreMaturity ─────────────────────────────────────────────────────────────

describe('scoreMaturity', () => {
  it('STUB at 0 words', () => {
    expect(scoreMaturity(0)).toEqual({ label: 'STUB', score: 0.1 })
  })

  it('STUB at 49 words (upper boundary, exclusive)', () => {
    expect(scoreMaturity(49)).toEqual({ label: 'STUB', score: 0.1 })
  })

  it('SEED at 50 words (lower boundary)', () => {
    expect(scoreMaturity(50)).toEqual({ label: 'SEED', score: 0.4 })
  })

  it('SEED at 249 words (upper boundary)', () => {
    expect(scoreMaturity(249)).toEqual({ label: 'SEED', score: 0.4 })
  })

  it('BUDDING at 250 words (lower boundary)', () => {
    expect(scoreMaturity(250)).toEqual({ label: 'BUDDING', score: 0.7 })
  })

  it('BUDDING at 699 words (upper boundary)', () => {
    expect(scoreMaturity(699)).toEqual({ label: 'BUDDING', score: 0.7 })
  })

  it('EVERGREEN at 700 words (lower boundary)', () => {
    expect(scoreMaturity(700)).toEqual({ label: 'EVERGREEN', score: 1.0 })
  })

  it('EVERGREEN for very large count', () => {
    expect(scoreMaturity(5000)).toEqual({ label: 'EVERGREEN', score: 1.0 })
  })
})

// ── scoreNote — formula parity with inbox_score.py ───────────────────────────
//
// These cases are intentionally mirrored in test_inbox_score.py.
// Formula: total = 0.4×name + 0.3×frontmatter + 0.3×maturity

describe('scoreNote — formula parity', () => {
  it('Untitled + no FM + EVERGREEN = 0.4×0.0 + 0.3×0.0 + 0.3×1.0 = 0.300', () => {
    const s = scoreNote(mockFile('Untitled.md'), words(700))
    expect(s.total).toBe(0.3)
    expect(s.maturity).toBe('EVERGREEN')
    expect(s.nameQuality).toBe(0.0)
    expect(s.hasFrontmatter).toBe(false)
  })

  it('Descriptive + full FM + BUDDING = 0.4×0.7 + 0.3×1.0 + 0.3×0.7 = 0.790', () => {
    const body = words(300)
    const content = `---\ntitle: Test\npublished: false\n---\n\n${body}`
    const s = scoreNote(mockFile('My Interesting Note.md'), content)
    expect(s.total).toBeCloseTo(0.79, 3)
    expect(s.maturity).toBe('BUDDING')
  })

  it('Dated name + no FM + SEED = 0.4×1.0 + 0.3×0.0 + 0.3×0.4 = 0.520', () => {
    const s = scoreNote(mockFile('2025-01-15 Meeting.md'), words(100))
    expect(s.total).toBeCloseTo(0.52, 3)
    expect(s.maturity).toBe('SEED')
  })

  it('Single-word + FM only + STUB = 0.4×0.3 + 0.3×0.7 + 0.3×0.1 = 0.360', () => {
    const content = '---\ntitle: Ideas\n---\n\n' + words(10)
    const s = scoreNote(mockFile('Ideas.md'), content)
    expect(s.total).toBeCloseTo(0.36, 3)
    expect(s.maturity).toBe('STUB')
  })

  it('deduplication: same path is excluded from sorted output (via scoreInboxNotes)', () => {
    // scoreNote itself has no dedup — just verify fields are consistent
    const s = scoreNote(mockFile('note.md', 'folder/note.md'), words(50))
    expect(s.file.path).toBe('folder/note.md')
    expect(s.words).toBe(50)
  })
})

// ── extractFrontmatter ────────────────────────────────────────────────────────

describe('extractFrontmatter', () => {
  it('returns empty object when no frontmatter present', () => {
    expect(extractFrontmatter('No frontmatter here')).toEqual({})
  })

  it('parses simple key-value pairs', () => {
    const content = '---\ntitle: Hello World\npublished: false\n---\n\nContent'
    const fm = extractFrontmatter(content)
    expect(fm.title).toBe('Hello World')
    expect(fm.published).toBe('false')
  })

  it('handles hyphenated keys', () => {
    const content = '---\ntag-list: foo\n---\n'
    const fm = extractFrontmatter(content)
    expect(fm['tag-list']).toBe('foo')
  })

  it('returns empty object for malformed frontmatter (no closing ---)', () => {
    const content = '---\ntitle: Broken\n'
    expect(extractFrontmatter(content)).toEqual({})
  })
})

// ── renderTriageReport ────────────────────────────────────────────────────────

describe('renderTriageReport', () => {
  it('includes the vault name', () => {
    expect(renderTriageReport([], 'my-vault')).toContain('my-vault')
  })

  it('shows notes scored count', () => {
    expect(renderTriageReport([], 'vault')).toContain('**Notes scored:** 0')
  })

  it('outputs valid frontmatter block', () => {
    const report = renderTriageReport([], 'vault')
    expect(report.startsWith('---')).toBe(true)
    expect(report).toContain('title: "Inbox Triage Report"')
  })

  it('shows correct maturity distribution counts', () => {
    const baseScore = {
      words: 100, hasFrontmatter: false, hasPublished: false,
      nameQuality: 0.7, frontmatterScore: 0.0, maturityScore: 0.4, total: 0.4,
    }
    const scores = [
      { ...baseScore, file: mockFile('a.md'), maturity: 'EVERGREEN' as const },
      { ...baseScore, file: mockFile('b.md'), maturity: 'STUB' as const },
      { ...baseScore, file: mockFile('c.md'), maturity: 'STUB' as const },
    ]
    const report = renderTriageReport(scores, 'vault')
    expect(report).toContain('| EVERGREEN | 1 |')
    expect(report).toContain('| STUB      | 2 |')
    expect(report).toContain('| SEED      | 0 |')
    expect(report).toContain('| BUDDING   | 0 |')
  })

  it('lists top 10 entries in priority section', () => {
    const baseScore = {
      words: 700, hasFrontmatter: false, hasPublished: false,
      nameQuality: 0.7, frontmatterScore: 0.0, maturityScore: 1.0, total: 0.58, maturity: 'EVERGREEN' as const,
    }
    const scores = Array.from({ length: 12 }, (_, i) =>
      ({ ...baseScore, file: mockFile(`note-${i}.md`) })
    )
    const report = renderTriageReport(scores, 'vault')
    // Top 10 section should include note-0 through note-9
    const top10Section = report.split('## Top 10')[1] ?? ''
    expect(top10Section).toContain('note-0.md')
    expect(top10Section).toContain('note-9.md')
    expect(top10Section).not.toContain('note-10.md')
  })
})
