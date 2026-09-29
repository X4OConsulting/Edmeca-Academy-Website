/**
 * Supabase-based data persistence layer.
 *
 * All database interactions go through these typed service objects.
 * Consistent error handling: PostgreSQL errors are rethrown so React Query
 * can catch them and surface them through isError / error states.
 *
 * RLS is enforced at the database level — every query automatically scopes
 * to the authenticated user via auth.uid() policies.
 */

import { supabase } from '@/lib/supabase';
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
 * snake_case, and PostgREST does not translate. Spreading a camelCase payload
 * straight into insert/update sends `toolType` for `tool_type`, which the
 * database rejects, so every write goes through toColumns().
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

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return user.id;
}

// ---------------------------------------------------------------------------
// ARTIFACTS SERVICE
// ---------------------------------------------------------------------------

export const artifactsService = {
  /** Fetch all artifacts for the current user, newest first. */
  async getArtifacts(): Promise<Artifact[]> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return withAliasesAll<Artifact>(data);
  },

  /** Fetch a single artifact by its ID. */
  async getArtifactById(id: string): Promise<Artifact | null> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? withAliases<Artifact>(data) : null;
  },

  /**
   * Fetch the most recently saved artifact of a specific tool type.
   * Returns null when no artifact of that type exists yet (PGRST116).
   */
  async getLatestArtifactByType(toolType: string): Promise<Artifact | null> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('tool_type', toolType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? withAliases<Artifact>(data) : null;
  },

  /** Insert a new artifact row and return the saved record. */
  async createArtifact(
    artifact: Omit<InsertArtifact, 'userId'>
  ): Promise<Artifact> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...toColumns(artifact), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return withAliases<Artifact>(data);
  },

  /** Partial-update an artifact by ID. Always stamps updated_at. */
  async updateArtifact(
    id: string,
    updates: Partial<Omit<InsertArtifact, 'userId'>>
  ): Promise<Artifact> {
    const { data, error } = await supabase
      .from('artifacts')
      .update({ ...toColumns(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return withAliases<Artifact>(data);
  },

  /** Delete a single artifact by ID. */
  async deleteArtifact(id: string): Promise<void> {
    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
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
    const userId = await getCurrentUserId();
    if (existingId) {
      const { error } = await supabase
        .from('artifacts')
        .update({ ...toColumns(payload), updated_at: new Date().toISOString() })
        .eq('id', existingId);
      if (error) throw error;
      artifactsChanged();
      return existingId;
    }
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...toColumns(payload), user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    artifactsChanged();
    return (data as { id: string }).id;
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
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return withAliasesAll<ProgressEntry>(data).map(withEvidence);
  },

  /** Insert a new progress entry. */
  async createProgressEntry(
    entry: { milestone: string; evidence?: string | null; completedAt?: string | null }
  ): Promise<ProgressEntryView> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        user_id: userId,
        milestone: entry.milestone,
        // The table has no evidence column; the evidence text lives in notes.
        notes: entry.evidence ?? null,
        completed_at: entry.completedAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return withEvidence(withAliases<ProgressEntry>(data));
  },

  /** Toggle the completed_at timestamp on a progress entry. */
  async toggleComplete(id: string, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from('progress_entries')
      .update({ completed_at: completed ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) throw error;
  },

  /** Delete a progress entry by ID. */
  async deleteProgressEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('progress_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// PROFILE SERVICE
// ---------------------------------------------------------------------------

export const profileService = {
  /** Fetch the current user's profile row, or null if not yet created. */
  async getUserProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? withAliases<UserProfile>(data) : null;
  },

  /** Create the initial profile row for a new user. */
  async createUserProfile(
    profile: Omit<InsertUserProfile, 'userId'>
  ): Promise<UserProfile> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ ...toColumns(profile), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return withAliases<UserProfile>(data);
  },

  /** Partial-update the current user's profile. */
  async updateUserProfile(
    updates: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...toColumns(updates), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return withAliases<UserProfile>(data);
  },

  /** Insert or update the current user's profile (safe idempotent write). */
  async upsertUserProfile(
    profile: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ ...toColumns(profile), user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return withAliases<UserProfile>(data);
  },
};

// ---------------------------------------------------------------------------
// CONTACT SERVICE
// ---------------------------------------------------------------------------

export const contactService = {
  /** Persist a contact form submission (no RLS — anonymous inserts allowed). */
  async submitContactForm(
    submission: Omit<ContactSubmission, 'id' | 'createdAt'>
  ): Promise<ContactSubmission> {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(toColumns(submission))
      .select()
      .single();
    if (error) throw error;
    return withAliases<ContactSubmission>(data);
  },
};