/**
 * useRealtimeSync — keeps the Dashboard current with changes made elsewhere
 * (another tab or device). Supabase Realtime pushed every change; Neon has no
 * push channel, so this refreshes the user's artifacts and milestones whenever
 * the page becomes visible again. Saves made in this tab already refresh the
 * lists directly (services.ts).
 *
 * Usage: call once near the top of any portal-level component (e.g. Dashboard).
 * The listener is removed when the component unmounts.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from './use-auth';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [user?.id, queryClient]);
}
