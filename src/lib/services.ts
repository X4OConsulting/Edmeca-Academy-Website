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
    return data as Artifact[];
  },

  /** Fetch a single artifact by its ID. */
  async getArtifactById(id: string): Promise<Artifact | null> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return (data as Artifact) ?? null;
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
    return (data as Artifact) ?? null;
  },

  /** Insert a new artifact row and return the saved record. */
  async createArtifact(
    artifact: Omit<InsertArtifact, 'userId'>
  ): Promise<Artifact> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...artifact, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Artifact;
  },

  /** Partial-update an artifact by ID. Always stamps updated_at. */
  async updateArtifact(
    id: string,
    updates: Partial<Omit<InsertArtifact, 'userId'>>
  ): Promise<Artifact> {
    const { data, error } = await supabase
      .from('artifacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Artifact;
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
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existingId);
      if (error) throw error;
      return existingId;
    }
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...payload, user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  },
};

// ---------------------------------------------------------------------------
// PROGRESS SERVICE
// ---------------------------------------------------------------------------

export const progressService = {
  /** All progress entries for the current user, newest first. */
  async getProgressEntries(): Promise<ProgressEntry[]> {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ProgressEntry[];
  },

  /** Insert a new progress entry. */
  async createProgressEntry(
    entry: { milestone: string; evidence?: string | null; completedAt?: string | null }
  ): Promise<ProgressEntry> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        user_id: userId,
        milestone: entry.milestone,
        evidence: entry.evidence ?? null,
        completed_at: entry.completedAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ProgressEntry;
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
    return (data as UserProfile) ?? null;
  },

  /** Create the initial profile row for a new user. */
  async createUserProfile(
    profile: Omit<InsertUserProfile, 'userId'>
  ): Promise<UserProfile> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ ...profile, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  /** Partial-update the current user's profile. */
  async updateUserProfile(
    updates: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  /** Insert or update the current user's profile (safe idempotent write). */
  async upsertUserProfile(
    profile: Partial<Omit<InsertUserProfile, 'userId'>>
  ): Promise<UserProfile> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
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
      .insert(submission)
      .select()
      .single();
    if (error) throw error;
    return data as ContactSubmission;
  },
};