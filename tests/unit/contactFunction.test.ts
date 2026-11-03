/** /api/contact: the "I am" options and the optional offering of interest (Phase 8). */
import { describe, expect, it, beforeEach, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
const sendEmail = vi.hoisted(() => vi.fn());
vi.mock('../../server/db', () => ({ query }));
vi.mock('../../server/email', () => ({ sendEmail }));
vi.mock('../../server/auth', () => ({ auth: { api: { getSession: async () => null } } }));

import { POST } from '../../api/contact';

const valid = { name: 'Thandi', email: 't@example.com', company: 'Acme', audienceType: 'esd', message: 'We run an ESD cohort of 40.' };

const call = (body: unknown) =>
  POST(new Request('http://localhost/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));

beforeEach(() => {
  query.mockReset().mockResolvedValue([{ id: 'c1', created_at: '2026-11-03T10:00:00Z' }]);
  sendEmail.mockReset().mockResolvedValue(undefined);
});

describe('POST /api/contact', () => {
  it('saves a new "I am" value and emails its label and the offering', async () => {
    const res = await call({ ...valid, offering: 'impact-reporting' });
    expect(res.status).toBe(201);
    expect(query.mock.calls[0][1]).toEqual(['Thandi', 't@example.com', 'Acme', 'esd', 'We run an ESD cohort of 40.']);
    const html = sendEmail.mock.calls[0][2] as string;
    expect(html).toContain('An ESD or supplier development programme');
    expect(html).toContain('Offering of interest');
    expect(html).toContain('Impact Reporting');
  });

  it('treats the offering as optional', async () => {
    const res = await call(valid);
    expect(res.status).toBe(201);
    expect((await res.json()).offering).toBeNull();
  });

  it('still accepts the earlier audience values', async () => {
    expect((await call({ ...valid, audienceType: 'programme' })).status).toBe(201);
  });

  it('rejects an unknown audience or offering without saving', async () => {
    expect((await call({ ...valid, audienceType: 'investor' })).status).toBe(400);
    expect((await call({ ...valid, offering: 'unlimited-plan' })).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});
