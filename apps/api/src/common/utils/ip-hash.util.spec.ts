import { hashIp } from './ip-hash.util';

describe('hashIp', () => {
  it('returns deterministic sha256 hex', () => {
    const hash1 = hashIp('192.168.1.1', 'secret');
    const hash2 = hashIp('192.168.1.1', 'secret');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different IPs', () => {
    const a = hashIp('1.1.1.1', 'secret');
    const b = hashIp('2.2.2.2', 'secret');
    expect(a).not.toBe(b);
  });

  it('produces different hashes for different secrets', () => {
    const a = hashIp('1.1.1.1', 'secret-a');
    const b = hashIp('1.1.1.1', 'secret-b');
    expect(a).not.toBe(b);
  });
});
