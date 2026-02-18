import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: any;
}

// Convert Supabase user to our app's user format for compatibility
function formatUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

async function signInWithOAuth(provider: 'google' | 'github') {
  const redirectTo = `${window.location.origin}/portal`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });
  
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ? formatUser(session.user) : null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ? formatUser(session.user) : null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    logout,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    isLoggingOut: false, // TODO: Add loading state if needed
  };
}
