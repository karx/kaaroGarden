import { describe, it, expect } from 'vitest'
import { parseJsonResponse } from './provider'

// ── parseJsonResponse ─────────────────────────────────────────────────────────

const FULL_VALID = {
  title: 'My Note',
  tags: ['knowledge-graph', 'reference'],
  description: 'A well-formed note.',
  date: '2025-01-15',
  layer: 'L2-System',
  maturity: 'BUDDING',
  para: 'Area',
  published: false,
  wikilinks: ['NoteA', 'NoteB'],
  rationale: 'Good structure.',
  suggestedFolder: '2 Resources/Dev Tools',
}

describe('parseJsonResponse — valid input', () => {
  it('parses a raw JSON string', () => {
    const result = parseJsonResponse(JSON.stringify(FULL_VALID))
    expect(result.title).toBe('My Note')
    expect(result.tags).toEqual(['knowledge-graph', 'reference'])
    expect(result.wikilinks).toEqual(['NoteA', 'NoteB'])
    expect(result.published).toBe(false)
    expect(result.suggestedFolder).toBe('2 Resources/Dev Tools')
  })

  it('strips ```json ... ``` fences', () => {
    const raw = '```json\n' + JSON.stringify(FULL_VALID) + '\n```'
    const result = parseJsonResponse(raw)
    expect(result.title).toBe('My Note')
  })

  it('strips bare ``` ... ``` fences', () => {
    const raw = '```\n' + JSON.stringify(FULL_VALID) + '\n```'
    const result = parseJsonResponse(raw)
    expect(result.title).toBe('My Note')
  })
})

describe('parseJsonResponse — defaults for missing fields', () => {
  it('defaults title to empty string', () => {
    expect(parseJsonResponse('{}').title).toBe('')
  })

  it('defaults tags to empty array', () => {
    expect(parseJsonResponse('{}').tags).toEqual([])
  })

  it('defaults wikilinks to empty array', () => {
    expect(parseJsonResponse('{}').wikilinks).toEqual([])
  })

  it('defaults layer to L1-Instance', () => {
    expect(parseJsonResponse('{}').layer).toBe('L1-Instance')
  })

  it('defaults maturity to SEED', () => {
    expect(parseJsonResponse('{}').maturity).toBe('SEED')
  })

  it('defaults para to Pipeline', () => {
    expect(parseJsonResponse('{}').para).toBe('Pipeline')
  })

  it('defaults description to empty string', () => {
    expect(parseJsonResponse('{}').description).toBe('')
  })

  it('defaults rationale to empty string', () => {
    expect(parseJsonResponse('{}').rationale).toBe('')
  })

  it('defaults suggestedFolder to undefined', () => {
    expect(parseJsonResponse('{}').suggestedFolder).toBeUndefined()
  })
})

describe('parseJsonResponse — published field coercion', () => {
  it('is true only when explicitly true', () => {
    expect(parseJsonResponse('{"published": true}').published).toBe(true)
  })

  it('is false for published: false', () => {
    expect(parseJsonResponse('{"published": false}').published).toBe(false)
  })

  it('is false for published: "yes" (string)', () => {
    expect(parseJsonResponse('{"published": "yes"}').published).toBe(false)
  })

  it('is false when field is absent', () => {
    expect(parseJsonResponse('{}').published).toBe(false)
  })

  it('is false for published: 1 (number)', () => {
    expect(parseJsonResponse('{"published": 1}').published).toBe(false)
  })
})

describe('parseJsonResponse — array field coercion', () => {
  it('defaults tags to [] when value is a string', () => {
    expect(parseJsonResponse('{"tags": "streaming"}').tags).toEqual([])
  })

  it('defaults wikilinks to [] when value is a number', () => {
    expect(parseJsonResponse('{"wikilinks": 42}').wikilinks).toEqual([])
  })

  it('preserves a valid tags array', () => {
    expect(parseJsonResponse('{"tags": ["a", "b"]}').tags).toEqual(['a', 'b'])
  })
})

describe('parseJsonResponse — error handling', () => {
  it('throws SyntaxError on invalid JSON', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow(SyntaxError)
  })

  it('throws on empty string', () => {
    expect(() => parseJsonResponse('')).toThrow()
  })
})
