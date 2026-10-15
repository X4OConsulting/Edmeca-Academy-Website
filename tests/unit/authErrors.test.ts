/** Every sign-in failure maps to a message that says what happened and what to do. */
import { describe, expect, it } from 'vitest';
import { friendlyAuthError, friendlyOAuthError } from '@/lib/auth-errors';

describe('friendlyAuthError', () => {
  it.each([
    ['INVALID_OTP', /code is not right/],
    ['OTP_EXPIRED', /expired/],
    ['TOO_MANY_ATTEMPTS', /too many wrong codes/i],
    ['INVALID_EMAIL_OR_PASSWORD', /google or a code/i],
    ['CREDENTIAL_ACCOUNT_NOT_FOUND', /has no password/],
    ['EMAIL_NOT_VERIFIED', /email code/],
    ['USER_ALREADY_EXISTS', /already exists.*sign in instead/i],
  ])('%s', (code, expected) => {
    expect(friendlyAuthError({ code })).toMatch(expected);
  });

  it('rate limiting (429) asks the user to wait', () => {
    expect(friendlyAuthError({ status: 429, message: 'Too many requests' })).toMatch(/wait a minute/);
  });

  it('a network failure says so', () => {
    expect(friendlyAuthError({ message: 'Failed to fetch' })).toMatch(/internet connection/);
  });

  it('an unknown error falls back instead of showing a developer message', () => {
    expect(friendlyAuthError({ code: 'SOMETHING_NEW', message: 'Internal' }, 'Fallback')).toBe('Fallback');
  });
});

describe('friendlyOAuthError', () => {
  it('maps known Google errors and covers unknown ones', () => {
    expect(friendlyOAuthError('access_denied')).toMatch(/cancelled/);
    expect(friendlyOAuthError('weird_error')).toMatch(/did not complete/);
    expect(friendlyOAuthError(null)).toBeNull();
  });
});
