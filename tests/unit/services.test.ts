/**
 * The service layer against a recording Supabase client.
 *
 * The tool tests mock the services wholesale, which is how a camelCase
 * payload (`toolType` for the `tool_type` column) shipped: every save for
 * SWOT, Value Proposition, Pitch and the business profile was rejected by
 * PostgREST while all tool tests passed. These tests assert the column names
 * that actually reach the database, and the field names pages read back.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';

type Call = { table: string; op: string; payload?: unknown };
const calls: Call[] = [];
let response: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@/lib/supabase', () => {
  const builder = (table: string) => {
    const chain: Record<string, unknown> = {};
    const record = (op: string) => (payload?: unknown) => { calls.push({ table, op, payload }); return chain; };
    for (const op of ['insert', 'update', 'upsert', 'delete']) chain[op] = record(op);
    for (const op of ['select', 'eq', 'order', 'limit']) chain[op] = () => chain;
    chain.single = () => Promise.resolve(response);
    chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(response).then(resolve, reject);
    return chain;
  };
  return {
    supabase: {
      from: (table: string) => builder(table),
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }) },
    },
  };
});

import { artifactsService, profileService, progressService, toColumns, withAliases } from '@/lib/services';

const writes = () => calls.filter((c) => ['insert', 'update', 'upsert'].includes(c.op));
const keysOf = (payload: unknown) => Object.keys(payload as Record<string, unknown>);
const camelKeys = (payload: unknown) => keysOf(payload).filter((key) => /[A-Z]/.test(key));

beforeEach(() => {
  calls.length = 0;
  response = { data: null, error: null };
});

describe('artifactsService writes use database column names', () => {
  const payload = { toolType: 'swot_pestle' as const, title: 'Acme — SWOT', content: { swot: {} }, status: 'in_progress' as const };

  it('inserts a new artifact with tool_type and user_id', async () => {
    response = { data: { id: 'new-id' }, error: null };
    expect(await artifactsService.saveArtifact(null, payload)).toBe('new-id');
    const [insert] = writes();
    expect(insert.table).toBe('artifacts');
    expect(insert.payload).toMatchObject({ tool_type: 'swot_pestle', user_id: 'user-1', title: 'Acme — SWOT', status: 'in_progress' });
    expect(camelKeys(insert.payload)).toEqual([]);
  });

  it('updates an existing artifact with tool_type and updated_at', async () => {
    await artifactsService.saveArtifact('existing-id', payload);
    const [update] = writes();
    expect(update.op).toBe('update');
    expect(update.payload).toMatchObject({ tool_type: 'swot_pestle' });
    expect(keysOf(update.payload)).toContain('updated_at');
    expect(camelKeys(update.payload)).toEqual([]);
  });

  it('rethrows a database error instead of reporting success', async () => {
    response = { data: null, error: { code: 'PGRST204', message: "Could not find the 'toolType' column" } };
    await expect(artifactsService.saveArtifact(null, payload)).rejects.toMatchObject({ code: 'PGRST204' });
  });
});

describe('artifactsService reads expose both spellings', () => {
  it('gives each row toolType and tool_type, createdAt and created_at', async () => {
    response = { data: [{ id: 'a1', tool_type: 'bmc', created_at: '2026-09-29T10:00:00Z', updated_at: '2026-09-29T11:00:00Z' }], error: null };
    const [row] = await artifactsService.getArtifacts() as unknown as Record<string, unknown>[];
    expect(row).toMatchObject({ tool_type: 'bmc', toolType: 'bmc', created_at: '2026-09-29T10:00:00Z', createdAt: '2026-09-29T10:00:00Z', updatedAt: '2026-09-29T11:00:00Z' });
  });

  it('returns null when there is no artifact of that type yet', async () => {
    response = { data: null, error: { code: 'PGRST116' } };
    expect(await artifactsService.getLatestArtifactByType('pitch_builder')).toBeNull();
  });
});

describe('profileService', () => {
  it('upserts business_name and business_description', async () => {
    response = { data: { user_id: 'user-1', business_name: 'Acme', business_description: 'Widgets' }, error: null };
    const profile = await profileService.upsertUserProfile({ businessName: 'Acme', businessDescription: 'Widgets' });
    const [upsert] = writes();
    expect(upsert.payload).toEqual({ business_name: 'Acme', business_description: 'Widgets', user_id: 'user-1' });
    expect(profile).toMatchObject({ businessName: 'Acme', businessDescription: 'Widgets', business_name: 'Acme' });
  });

  it('reads the profile back under the names Profile.tsx uses', async () => {
    response = { data: { business_name: 'Acme', business_description: 'Widgets' }, error: null };
    expect(await profileService.getUserProfile()).toMatchObject({ businessName: 'Acme', businessDescription: 'Widgets' });
  });
});

describe('progressService', () => {
  it('stores evidence in the notes column, which is the one that exists', async () => {
    response = { data: { id: 'p1', milestone: 'First sale', notes: 'Invoice #1', completed_at: '2026-09-29T10:00:00Z' }, error: null };
    const entry = await progressService.createProgressEntry({ milestone: 'First sale', evidence: 'Invoice #1', completedAt: '2026-09-29T10:00:00Z' });
    const [insert] = writes();
    expect(insert.payload).toEqual({ user_id: 'user-1', milestone: 'First sale', notes: 'Invoice #1', completed_at: '2026-09-29T10:00:00Z' });
    expect(entry).toMatchObject({ evidence: 'Invoice #1', completedAt: '2026-09-29T10:00:00Z' });
  });

  it('reads completion and evidence back so completed milestones show as done', async () => {
    response = { data: [{ id: 'p1', notes: 'Invoice #1', completed_at: '2026-09-29T10:00:00Z', created_at: '2026-09-28T10:00:00Z' }, { id: 'p2', notes: null, completed_at: null, created_at: '2026-09-28T10:00:00Z' }], error: null };
    const [done, open] = await progressService.getProgressEntries();
    expect(done).toMatchObject({ completedAt: '2026-09-29T10:00:00Z', createdAt: '2026-09-28T10:00:00Z', evidence: 'Invoice #1' });
    expect(open.completedAt).toBeNull();
  });

  it('toggles completion through completed_at', async () => {
    await progressService.toggleComplete('p1', false);
    expect(writes()[0].payload).toEqual({ completed_at: null });
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
