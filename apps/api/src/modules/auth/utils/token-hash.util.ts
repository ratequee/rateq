import { createHash, randomBytes } from 'crypto';

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
