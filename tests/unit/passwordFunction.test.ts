/** /api/password: code/Google accounts can add a password; plain messages for Better Auth's errors. */
import { describe, expect, it, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({ signedIn: true }));
const setPassword = vi.hoisted(() => vi.fn());
vi.mock('../../server/auth', () => ({
  auth: { api: {
    getSession: async () => (state.signedIn ? { user: { id: 'u1', email: 'a@b.co', name: 'A' } } : null),
    setPassword,
  } },
}));

import { POST } from '../../api/password';

const call = (body: unknown) =>
  POST(new Request('http://localhost/api/password', { method: 'POST', headers: { cookie: 's=1', 'content-type': 'application/json' }, body: JSON.stringify(body) }));

beforeEach(() => {
  state.signedIn = true;
  setPassword.mockReset().mockResolvedValue({ status: true });
});

describe('POST /api/password', () => {
  it('sets the password with the caller\'s session headers', async () => {
    const res = await call({ newPassword: 'New-Pass-2026!' });
    expect(res.status).toBe(200);
    const [arg] = setPassword.mock.calls[0];
    expect(arg.body).toEqual({ newPassword: 'New-Pass-2026!' });
    expect(arg.headers.get('cookie')).toBe('s=1');
  });

  it('explains when the account already has a password', async () => {
    setPassword.mockRejectedValue({ body: { code: 'PASSWORD_ALREADY_SET' } });
    const res = await call({ newPassword: 'New-Pass-2026!' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already has a password/);
  });

  it('needs a password and a signed-in user', async () => {
    expect((await call({})).status).toBe(400);
    state.signedIn = false;
    expect((await call({ newPassword: 'New-Pass-2026!' })).status).toBe(401);
    expect(setPassword).not.toHaveBeenCalled();
  });
});
