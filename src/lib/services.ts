/**
 * Supabase-based data persistence layer (optional).
 *
 * When Supabase is not configured, all service calls return safe defaults
 * so the app works fully offline with localStorage + exports.
 */

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

// ---------------------------------------------------------------------------
// PROFILE SERVICE
// ---------------------------------------------------------------------------

export const profileService = {
  async getUserProfile(): Promise<any | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data ?? null;
    } catch {
      return null;
    }
  },

  async upsertUserProfile(profile: Record<string, any>): Promise<any | null> {
    if (!supabase) return null;
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },
};
