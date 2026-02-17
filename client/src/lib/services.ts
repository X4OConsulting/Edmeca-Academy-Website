// Supabase-based API services to replace Express.js routes
import { supabase } from '@/lib/supabase';

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// ------------------
// ARTIFACTS SERVICES
// ------------------

export const artifactsService = {
  // Get all artifacts for the current user
  async getArtifacts() {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get latest artifact by tool type for current user
  async getLatestArtifactByType(toolType: string) {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('tool_type', toolType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  },

  // Create new artifact
  async createArtifact(artifact: any) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...artifact, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update artifact
  async updateArtifact(id: string, updates: any) {
    const { data, error } = await supabase
      .from('artifacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete artifact
  async deleteArtifact(id: string) {
    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ------------------
// PROGRESS SERVICES
// ------------------

export const progressService = {
  // Get all progress entries for current user
  async getProgressEntries() {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create progress entry
  async createProgressEntry(entry: any) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({ ...entry, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// ------------------
// PROFILE SERVICES
// ------------------

export const profileService = {
  // Get user profile
  async getUserProfile() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  },

  // Create user profile
  async createUserProfile(profile: any) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ ...profile, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Upsert user profile (create or update)
  async upsertUserProfile(profile: any) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// ------------------
// CONTACT SERVICES  
// ------------------

export const contactService = {
  // Submit contact form
  async submitContactForm(submission: any) {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(submission)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};