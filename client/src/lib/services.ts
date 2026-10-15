/**
 * Data persistence layer: typed calls to the site's own /api routes.
 *
 * All database interactions go through these typed service objects.
 * Consistent error handling: a failed request throws an Error carrying the
 * server's message, so React Query surfaces it through isError / error states.
 *
 * The server scopes every query to the signed-in user (session cookie), the
 * job Supabase's row-level security did before the move to Neon.
 */

import { queryClient } from '@/lib/queryClient';
import type {
  Artifact,
  InsertArtifact,
  ProgressEntry,
  UserProfile,
  InsertUserProfile,
  ContactSubmission,
} from '@shared/schema';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * The app's types (shared/schema.ts) use camelCase; the database columns are
 * snake_case. Writes go out snake_case (the API also accepts camelCase).
 */
const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function toColumns(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined).map(([key, value]) => [snake(key), value]),
  );
}

/**
 * Rows come back snake_case. Pages written at different times read either
 * spelling (`tool_type` and `toolType`), so each row carries both.
 */
export function withAliases<T>(row: unknown): T {
  if (!row || typeof row !== 'object') return row as T;
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    const alias = camel(key);
    if (alias !== key && !(alias in out)) out[alias] = value;
  }
  return out as T;
}

const withAliasesAll = <T,>(rows: unknown): T[] => ((rows as unknown[] | null) ?? []).map((row) => withAliases<T>(row));

/** Every tool's save refreshes the Dashboard's list, which otherwise stays stale for 5 minutes. */
function artifactsChanged() {
  queryClient.invalidateQueries({ queryKey: ['artifacts'] });
}

/** Calls an /api route and returns its JSON (null for 204); throws with the server's message. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (response.status === 204) return null as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && typeof data === 'object' && 'error' in data && String(data.error)) || `Request failed (${response.status})`);
  }
  return data as T;
}

const qs = (params: Record<string, string>) => `?${new URLSearchParams(params)}`;

// ---------------------------------------------------------------------------
// ARTIFACTS SERVICE
// ---------------------------------------------------------------------------

export const artifactsService = {
  /** Fetch all artifacts for the current user, newest first. */
  async getArtifacts(): Promise<Artifact[]> {
    return withAliasesAll<Artifact>(await api('/api/artifacts'));
  },

  /** Fetch a single artifact by its ID. */
  async getArtifactById(id: string): Promise<Artifact | null> {
    const data = await api<unknown>(`/api/artifacts${qs({ id })}`);
    return data ? withAliases<Artifact>(data) : null;
  },

  /**
   * Fetch the most recently saved artifact of a specific tool type.
   * Returns null when no artifact of that type exists yet.
   */
  async getLatestArtifactByType(toolType: string): Promise<Artifact | null> {
    const data = await api<unknown>(`/api/artifacts${qs({ toolType })}`);
    return data ? withAliases<Artifact>(data) : null;
  },

  /** Insert a new artifact row and return the saved record. */
  async createArtifact(
    artifact: Omit<InsertArtifact, 'userId'>
  ): Promise<Artifact> {
    return withAliases<Artifact>(await api('/api/artifacts', { method: 'POST', body: toColumns(artifact) }));
  },

  /** Partial-update an artifact by ID. Always stamps updated_at. */
  async updateArtifact(
    id: string,
    updates: Partial<Omit<InsertArtifact, 'userId'>>
  ): Promise<Artifact> {
    return withAliases<Artifact>(await api(`/api/artifacts${qs({ id })}`, { method: 'PATCH', body: toColumns(updates) }));
  },

  /** Rename an artifact without touching updated_at, so the activity feed stays truthful. */
  async retitleArtifact(id: string, title: string): Promise<void> {
    await api(`/api/artifacts${qs({ id, touch: '0' })}`, { method: 'PATCH', body: { title } });
  },

  /** Delete a single artifact by ID. */
  async deleteArtifact(id: string): Promise<void> {
    await api(`/api/artifacts${qs({ id })}`, { method: 'DELETE' });
  },

  /**
   * Upsert helper used by tool pages.
   * If existingId is provided, UPDATEs that row.
   * Otherwise INSERTs a new row and returns the new ID.
   */
  async saveArtifact(
    existingId: string | null,
    payload: Omit<InsertArtifact, 'userId'>
  ): Promise<string> {
    if (existingId) {
      await api(`/api/artifacts${qs({ id: existingId })}`, { method: 'PATCH', body: toColumns(payload) });
      artifactsChanged();
      return existingId;
    }
    const created = await api<{ id: string }>('/api/artifacts', { method: 'POST', body: toColumns(payload) });
    artifactsChanged();
    return created.id;
  },
};

// ---------------------------------------------------------------------------
// PROGRESS SERVICE
// ---------------------------------------------------------------------------

/** A progress entry with its notes column exposed as the evidence the Progress Tracker shows. */
export type ProgressEntryView = ProgressEntry & { evidence: string | null };
const withEvidence = (entry: ProgressEntry): ProgressEntryView => ({ ...entry, evidence: entry.notes ?? null });

export const progressService = {
  /** All progress entries for the current user, newest first. */
  async getProgressEntries(): Promise<ProgressEntryView[]> {
    return withAliasesAll<ProgressEntry>(await api('/api/progress')).map(withEvidence);
  },

  /** Insert a new progress entry. */
  async createProgressEntry(
    entry: { milestone: string; evidence?: string | null; completedAt?: string | null }
  ): Promise<ProgressEntryView> {
    const data = await api('/api/progress', {
      method: 'POST',
      body: { milestone: entry.milestone, evidence: entry.evidence ?? null, completedAt: entry.completedAt ?? null },
    });
    return withEvidence(withAliases<ProgressEntry>(data));
  },

  /** Toggle the completed_at timestamp on a progress entry. */
  async toggleComplete(id: string, completed: boolean): Promise<void> {
    await api(`/api/progress${qs({ id })}`, { method: 'PATCH', body: { completed } });
  },

  /** Delete a progress entry by ID. */
  async deleteProgressEntry(id: string): Promise<void> {
    await api(`/api/progress${qs({ id })}`, { method: 'DELETE' });
  },
};

// ---------------------------------------------------------------------------
// PROFILE SERVICE
// ---------------------------------------------------------------------------

export const profileService = {
  /** Fetch the current user's profile row, or null if not yet created. */
  async getUserProfile(): Promise<UserProfile | null> {
    const data = await api<unknown>('/api/profile');
    return data ? withAliases<UserProfile>(data) : null;
  },

  /** Create the initial profile row for a new user. */
  async createUserProfile(
    profile: Omit<InsertUserProfile, 'userId'>
  ): Promise<UserProfile> {
    return this.upsertUserProfile(profile);
  },

  /** Partial-update the current user's profile. */
  async updateUserProfile(
    updates: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    return this.upsertUserProfile(updates);
  },

  /** Insert or update the current user's profile (safe idempotent write). */
  async upsertUserProfile(
    profile: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    return withAliases<UserProfile>(await api('/api/profile', { method: 'PUT', body: toColumns(profile) }));
  },
};

// ---------------------------------------------------------------------------
// CONTACT SERVICE
// ---------------------------------------------------------------------------

export const contactService = {
  /** Persist a contact form submission (anyone may submit; no sign-in needed). */
  async submitContactForm(
    submission: Omit<ContactSubmission, 'id' | 'createdAt'>
  ): Promise<ContactSubmission> {
    return withAliases<ContactSubmission>(await api('/api/contact', { method: 'POST', body: submission }));
  },
};
