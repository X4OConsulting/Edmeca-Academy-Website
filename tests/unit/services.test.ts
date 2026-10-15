/**
 * The service layer against a recording fetch (the /api routes).
 *
 * The tool tests mock the services wholesale, which is how a camelCase
 * payload (`toolType` for the `tool_type` column) once shipped: every save for
 * SWOT, Value Proposition, Pitch and the business profile was rejected while
 * all tool tests passed. These tests assert what actually reaches the API, and
 * the field names pages read back.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

type Call = { method: string; url: string; body?: Record<string, unknown> };
const calls: Call[] = [];
let reply: { status: number; body: unknown } = { status: 200, body: null };

beforeEach(() => {
  calls.length = 0;
  reply = { status: 200, body: null };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ method: init.method ?? 'GET', url, body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(reply.status === 204 ? null : JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

import { artifactsService, profileService, progressService, toColumns, withAliases } from '@/lib/services';

const camelKeys = (payload: unknown) => Object.keys(payload as Record<string, unknown>).filter((key) => /[A-Z]/.test(key));

describe('artifactsService writes use database column names', () => {
  const payload = { toolType: 'swot_pestle' as const, title: 'Acme — SWOT', content: { swot: {} }, status: 'in_progress' as const };

  it('creates a new artifact with tool_type and never sends a user_id', async () => {
    reply = { status: 201, body: { id: 'new-id' } };
    expect(await artifactsService.saveArtifact(null, payload)).toBe('new-id');
    const [call] = calls;
    expect(call).toMatchObject({ method: 'POST', url: '/api/artifacts' });
    expect(call.body).toMatchObject({ tool_type: 'swot_pestle', title: 'Acme — SWOT', status: 'in_progress' });
    expect(call.body).not.toHaveProperty('user_id');
    expect(camelKeys(call.body)).toEqual([]);
  });

  it('updates an existing artifact by id with tool_type', async () => {
    reply = { status: 200, body: { id: 'existing-id' } };
    await artifactsService.saveArtifact('existing-id', payload);
    const [call] = calls;
    expect(call).toMatchObject({ method: 'PATCH', url: '/api/artifacts?id=existing-id' });
    expect(call.body).toMatchObject({ tool_type: 'swot_pestle' });
    expect(camelKeys(call.body)).toEqual([]);
  });

  it('rethrows the server error instead of reporting success', async () => {
    reply = { status: 400, body: { error: 'toolType and title are required.' } };
    await expect(artifactsService.saveArtifact(null, payload)).rejects.toThrow('toolType and title are required.');
  });

  it('renames without touching updated_at', async () => {
    reply = { status: 200, body: { id: 'a1' } };
    await artifactsService.retitleArtifact('a1', 'Acme — Pitch Deck');
    expect(calls[0]).toMatchObject({ method: 'PATCH', url: '/api/artifacts?id=a1&touch=0', body: { title: 'Acme — Pitch Deck' } });
  });
});

describe('artifactsService reads expose both spellings', () => {
  it('gives each row toolType and tool_type, createdAt and created_at', async () => {
    reply = { status: 200, body: [{ id: 'a1', tool_type: 'bmc', created_at: '2026-09-29T10:00:00Z', updated_at: '2026-09-29T11:00:00Z' }] };
    const [row] = await artifactsService.getArtifacts() as unknown as Record<string, unknown>[];
    expect(row).toMatchObject({ tool_type: 'bmc', toolType: 'bmc', created_at: '2026-09-29T10:00:00Z', createdAt: '2026-09-29T10:00:00Z', updatedAt: '2026-09-29T11:00:00Z' });
  });

  it('returns null when there is no artifact of that type yet', async () => {
    reply = { status: 200, body: null };
    expect(await artifactsService.getLatestArtifactByType('pitch_builder')).toBeNull();
    expect(calls[0].url).toBe('/api/artifacts?toolType=pitch_builder');
  });
});

describe('profileService', () => {
  it('upserts business_name and business_description', async () => {
    reply = { status: 200, body: { user_id: 'user-1', business_name: 'Acme', business_description: 'Widgets' } };
    const profile = await profileService.upsertUserProfile({ businessName: 'Acme', businessDescription: 'Widgets' });
    expect(calls[0]).toMatchObject({ method: 'PUT', url: '/api/profile' });
    expect(calls[0].body).toEqual({ business_name: 'Acme', business_description: 'Widgets' });
    expect(profile).toMatchObject({ businessName: 'Acme', businessDescription: 'Widgets', business_name: 'Acme' });
  });

  it('reads the profile back under the names Profile.tsx uses', async () => {
    reply = { status: 200, body: { business_name: 'Acme', business_description: 'Widgets' } };
    expect(await profileService.getUserProfile()).toMatchObject({ businessName: 'Acme', businessDescription: 'Widgets' });
  });
});

describe('progressService', () => {
  it('sends the evidence, which the server stores in notes', async () => {
    reply = { status: 201, body: { id: 'p1', milestone: 'First sale', notes: 'Invoice #1', completed_at: '2026-09-29T10:00:00Z' } };
    const entry = await progressService.createProgressEntry({ milestone: 'First sale', evidence: 'Invoice #1', completedAt: '2026-09-29T10:00:00Z' });
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/api/progress' });
    expect(calls[0].body).toEqual({ milestone: 'First sale', evidence: 'Invoice #1', completedAt: '2026-09-29T10:00:00Z' });
    expect(entry).toMatchObject({ evidence: 'Invoice #1', completedAt: '2026-09-29T10:00:00Z' });
  });

  it('reads completion and evidence back so completed milestones show as done', async () => {
    reply = { status: 200, body: [{ id: 'p1', notes: 'Invoice #1', completed_at: '2026-09-29T10:00:00Z', created_at: '2026-09-28T10:00:00Z' }, { id: 'p2', notes: null, completed_at: null, created_at: '2026-09-28T10:00:00Z' }] };
    const [done, open] = await progressService.getProgressEntries();
    expect(done).toMatchObject({ completedAt: '2026-09-29T10:00:00Z', createdAt: '2026-09-28T10:00:00Z', evidence: 'Invoice #1' });
    expect(open.completedAt).toBeNull();
  });

  it('toggles completion', async () => {
    reply = { status: 200, body: { id: 'p1', completed_at: null } };
    await progressService.toggleComplete('p1', false);
    expect(calls[0]).toMatchObject({ method: 'PATCH', url: '/api/progress?id=p1', body: { completed: false } });
  });

  it('deletes, accepting the empty 204 reply', async () => {
    reply = { status: 204, body: null };
    await expect(progressService.deleteProgressEntry('p1')).resolves.toBeUndefined();
    expect(calls[0]).toMatchObject({ method: 'DELETE', url: '/api/progress?id=p1' });
  });
});

describe('helpers', () => {
  it('toColumns renames camelCase keys and drops undefined values', () => {
    expect(toColumns({ toolType: 'bmc', businessName: undefined, title: 'x' })).toEqual({ tool_type: 'bmc', title: 'x' });
  });

  it('withAliases keeps an existing camelCase value rather than overwriting it', () => {
    expect(withAliases({ tool_type: 'bmc', toolType: 'kept' })).toEqual({ tool_type: 'bmc', toolType: 'kept' });
  });
});
