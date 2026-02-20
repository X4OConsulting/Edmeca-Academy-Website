/**
 * useRealtimeSync — subscribes to Supabase Realtime for the current user's
 * artifacts and progress_entries, and automatically invalidates React Query
 * cache whenever the server pushes an INSERT, UPDATE, or DELETE event.
 *
 * Usage: call once near the top of any portal-level component (e.g. Dashboard).
 * The subscription is automatically cleaned up when the component unmounts.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from './use-auth';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`portal-sync-${user.id}`)
      // Artifacts: any change for this user invalidates the full artifact cache
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artifacts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate broad list
          queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.all });
          // Also invalidate the specific tool-type key if we can identify it
          const toolType = (payload.new as any)?.tool_type ?? (payload.old as any)?.tool_type;
          if (toolType) {
            queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.byType(toolType) });
          }
        }
      )
      // Progress entries: any change for this user refreshes milestones
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
