import { useCallback, useEffect, useRef } from 'react';
import { authClient, AuthError, unwrap } from '@/lib/auth-client';
import { queryClient } from '@/lib/queryClient';

interface AuthUser {
  id: string;
  email?: string;
  // Kept in the shape Supabase used, so pages reading user_metadata work unchanged.
  user_metadata?: { full_name?: string; avatar_url?: string };
}

async function signInWithEmail(email: string, password: string) {
  const result = await authClient.signIn.email({ email, password });
  if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
    // Login.tsx offers "resend confirmation" on this code (Supabase's name for it).
    throw new AuthError('Email not confirmed', 'email_not_confirmed');
  }
  return unwrap(result);
}

async function signUpWithEmail(email: string, password: string) {
  return unwrap(await authClient.signUp.email({
    email,
    password,
    // The form asks for no name; the email's local part stands in until Profile sets one.
    name: email.split('@')[0],
    // Back to this site (staging or production) once the email is confirmed.
    callbackURL: '/portal',
  }));
}

async function signInWithOAuth(provider: 'google') {
  // Navigates away to Google, then back to /portal.
  return unwrap(await authClient.signIn.social({ provider, callbackURL: '/portal', errorCallbackURL: '/login' }));
}

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  const user: AuthUser | null = data?.user
    ? { id: data.user.id, email: data.user.email, user_metadata: { full_name: data.user.name, avatar_url: data.user.image ?? undefined } }
    : null;

  // Clear all cached query data on sign-out so the next user never sees stale data.
  const previousId = useRef<string | null>(null);
  useEffect(() => {
    if (previousId.current && !user) {
      queryClient.clear();
      localStorage.removeItem('business-model-canvas');
    }
    previousId.current = user?.id ?? null;
  }, [user?.id]);

  const logout = useCallback(async () => {
    try {
      unwrap(await authClient.signOut());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return {
    user,
    session: data?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!user,
    logout,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    isLoggingOut: false,
  };
}
