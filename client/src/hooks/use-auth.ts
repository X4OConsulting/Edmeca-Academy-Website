import { useCallback, useEffect, useRef } from 'react';
import { authClient, unwrap } from '@/lib/auth-client';
import { queryClient } from '@/lib/queryClient';

interface AuthUser {
  id: string;
  email?: string;
  // Kept in the shape Supabase used, so pages reading user_metadata work unchanged.
  user_metadata?: { full_name?: string; avatar_url?: string };
}

async function signInWithEmail(email: string, password: string) {
  return unwrap(await authClient.signIn.email({ email, password }));
}

/** Emails a 6-digit sign-in code. Answers the same whether or not the email has an account. */
async function requestSignInCode(email: string) {
  return unwrap(await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }));
}

/**
 * Signs in with the emailed code; an unknown email gets a new account. One email
 * is one account, so this can never create a duplicate: an email that already
 * has an account (password, Google or code) signs in to that account.
 * `existing` tells the page whether to say "welcome back".
 */
async function signInWithCode(email: string, otp: string): Promise<{ existing: boolean }> {
  const data = unwrap(await authClient.signIn.emailOtp({
    email,
    otp,
    // Only used when this creates the account; Profile can change it.
    name: email.split('@')[0],
  }));
  const createdAt = Date.parse(String((data as { user?: { createdAt?: string | Date } })?.user?.createdAt ?? ''));
  return { existing: Number.isFinite(createdAt) && Date.now() - createdAt > 60_000 };
}

async function signInWithOAuth(provider: 'google') {
  // Navigates away to Google, then back to /portal.
  return unwrap(await authClient.signIn.social({ provider, callbackURL: '/portal', errorCallbackURL: '/login' }));
}

export function useAuth() {
  const { data, isPending, refetch } = authClient.useSession();
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

  // Better Auth refreshes the session store by itself only after some routes
  // (not /sign-in/email-otp), and even then without waiting. Navigating to the
  // portal before the store knows about the session sent users back to /login,
  // so each sign-in waits for the refreshed session before resolving.
  const signInWithCodeAndLoad = useCallback(async (email: string, otp: string) => {
    const result = await signInWithCode(email, otp);
    await refetch();
    return result;
  }, [refetch]);

  const signInWithEmailAndLoad = useCallback(async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    await refetch();
    return result;
  }, [refetch]);

  return {
    user,
    session: data?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!user,
    logout,
    signInWithEmail: signInWithEmailAndLoad,
    requestSignInCode,
    signInWithCode: signInWithCodeAndLoad,
    signInWithOAuth,
    isLoggingOut: false,
  };
}
