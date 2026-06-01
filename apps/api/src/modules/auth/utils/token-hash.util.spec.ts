import { addHours, generateSecureToken, hashToken } from './token-hash.util';

describe('token-hash.util', () => {
  it('hashes tokens consistently', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('xyz'));
  });

  it('generates 64-char hex tokens', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('addHours offsets date correctly', () => {
    const base = new Date('2024-01-01T00:00:00Z');
    const result = addHours(base, 24);
    expect(result.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });
});
