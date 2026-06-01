import { createHash } from 'crypto';

/**
 * Hashes client IP with server secret — never store raw IPs.
 */
export function hashIp(ip: string, secret: string): string {
  return createHash('sha256').update(`${ip}:${secret}`).digest('hex');
}
