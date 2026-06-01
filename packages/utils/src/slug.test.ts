import { describe, expect, it } from 'vitest';
import { slugify, withSlugSuffix } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates latin text', () => {
    expect(slugify('Acme Services')).toBe('acme-services');
  });

  it('preserves arabic characters', () => {
    expect(slugify('شركة النور')).toBe('شركة-النور');
  });

  it('strips special characters', () => {
    expect(slugify('Hello!!! World???')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Test--  ')).toBe('test');
  });
});

describe('withSlugSuffix', () => {
  it('returns base when attempt is 0', () => {
    expect(withSlugSuffix('acme', 0)).toBe('acme');
  });

  it('appends numeric suffix', () => {
    expect(withSlugSuffix('acme', 2)).toBe('acme-2');
  });
});
