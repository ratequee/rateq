import { describe, expect, it } from 'vitest';
import { levenshteinDistance, textSimilarityRatio } from './similarity';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('counts single character edits', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });
});

describe('textSimilarityRatio', () => {
  it('returns 1 for identical normalized strings', () => {
    expect(textSimilarityRatio('Hello World', 'hello world')).toBe(1);
  });

  it('returns 0 when one string is empty', () => {
    expect(textSimilarityRatio('', 'hello')).toBe(0);
  });

  it('detects high similarity for near-duplicate text', () => {
    const a = 'This company provided excellent service and fast delivery';
    const b = 'This company provided excellent service and quick delivery';
    expect(textSimilarityRatio(a, b)).toBeGreaterThan(0.85);
  });

  it('returns low similarity for different text', () => {
    expect(textSimilarityRatio('great food', 'terrible experience')).toBeLessThan(0.5);
  });
});
