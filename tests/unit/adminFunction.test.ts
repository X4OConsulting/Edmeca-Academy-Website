/** /api/admin: admins only; invites go to our own site; only unused invites can be cancelled. */
import { describe, expect, it, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({ role: 'admin' as string | null, pendingUser: true }));
const queries = vi.hoisted(() => [] as { sql: string; params: unknown[] }[]);
const invite = vi.hoisted(() => vi.fn());
const sendInvite = vi.hoisted(() => vi.fn());

vi.mock('../../server/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'admin-1', email: 'a@x4o.co.za', name: 'A' } }) } } }));
vi.mock('../../server/invites', () => ({ invite, sendInvite }));
vi.mock('../../server/db', () => ({
  query: async (sql: string, params: unknown[] = []) => {
    queries.push({ sql, params });
    if (sql.includes('from public.user_profiles where user_id')) return state.role ? [{ role: state.role }] : [];
    if (sql.includes('i.accepted_at is null') && sql.includes('where u.id')) return state.pendingUser ? [{ email: 'new@example.com', name: 'New' }] : [];
    if (sql.includes("from public.signup_applications where id")) return [{ email: 'app@example.com', name: 'Applicant' }];
    return [];
  },
}));

import { GET, POST } from '../../api/admin';

const ID = '7d3c1a2b-1234-4abc-8def-0123456789ab';
const post = (body: unknown, origin = 'https://edmeca-academy-website-staging.vercel.app') =>
  POST(new Request('http://internal/api/admin', { method: 'POST', headers: { cookie: 's=1', origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }));

beforeEach(() => {
  state.role = 'admin';
  state.pendingUser = true;
  queries.length = 0;
  invite.mockReset().mockResolvedValue({ userId: 'u-new' });
  sendInvite.mockReset().mockResolvedValue(undefined);
});

describe('/api/admin', () => {
  it('refuses anyone who is not an admin', async () => {
    state.role = 'entrepreneur';
    expect((await GET(new Request('http://internal/api/admin', { headers: { cookie: 's=1' } }))).status).toBe(403);
    expect((await post({ action: 'invite', email: 'x@example.com' })).status).toBe(403);
    expect(invite).not.toHaveBeenCalled();
  });

  it('invites with a link to the site the admin is using', async () => {
    expect((await post({ action: 'invite', email: 'x@example.com', name: 'X' })).status).toBe(201);
    expect(invite).toHaveBeenCalledWith(expect.objectContaining({ email: 'x@example.com', invitedBy: 'admin-1', origin: 'https://edmeca-academy-website-staging.vercel.app' }));
  });

  it('never puts a foreign site in an invite link', async () => {
    await post({ action: 'invite', email: 'x@example.com' }, 'https://evil.example');
    expect(invite).toHaveBeenCalledWith(expect.objectContaining({ origin: 'https://edmeca.co.za' }));
  });

  it('approving an application invites the applicant and marks it approved', async () => {
    expect((await post({ action: 'approve', applicationId: ID })).status).toBe(201);
    expect(invite).toHaveBeenCalledWith(expect.objectContaining({ email: 'app@example.com', applicationId: ID }));
    expect(queries.some((q) => q.sql.includes("status = 'approved'"))).toBe(true);
  });

  it('cancels only an invite nobody has used', async () => {
    expect((await post({ action: 'revoke', userId: ID })).status).toBe(200);
    expect(queries.some((q) => q.sql.startsWith('delete from "user"'))).toBe(true);
    queries.length = 0;
    state.pendingUser = false;
    expect((await post({ action: 'revoke', userId: ID })).status).toBe(404);
    expect(queries.some((q) => q.sql.startsWith('delete from "user"'))).toBe(false);
  });

  it('rejects bad ids and unknown actions', async () => {
    expect((await post({ action: 'approve', applicationId: 'nope' })).status).toBe(400);
    expect((await post({ action: 'drop-table' })).status).toBe(400);
  });
});
