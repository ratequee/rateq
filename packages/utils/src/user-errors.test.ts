import { describe, expect, it } from 'vitest';
import { resolveUserErrorKey } from './user-errors';

describe('resolveUserErrorKey', () => {
  it('maps firebase email already in use', () => {
    expect(resolveUserErrorKey({ code: 'auth/email-already-in-use' })).toBe('emailAlreadyInUse');
  });

  it('maps wrong password separately from invalid email', () => {
    expect(resolveUserErrorKey({ code: 'auth/wrong-password' })).toBe('incorrectPassword');
    expect(resolveUserErrorKey({ code: 'auth/invalid-email' })).toBe('invalidEmail');
    expect(resolveUserErrorKey({ code: 'auth/user-not-found' })).toBe('noAccountForEmail');
  });

  it('maps API phone conflict', () => {
    expect(
      resolveUserErrorKey({
        message: 'Phone number is already linked to another account, use another',
        statusCode: 409,
      }),
    ).toBe('phoneAlreadyLinked');
  });

  it('maps review conflicts', () => {
    expect(
      resolveUserErrorKey({ message: 'You already have a published review for this company' }),
    ).toBe('reviewAlreadyPublished');
  });

  it('maps deactivated account', () => {
    expect(resolveUserErrorKey({ message: 'Account has been deactivated', statusCode: 401 })).toBe(
      'accountDeactivated',
    );
  });
});
