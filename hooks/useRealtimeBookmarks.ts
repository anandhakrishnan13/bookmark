'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeBookmarksProps {
  userId: string | null
  onRefetch: () => void
}

export function useRealtimeBookmarks({
  userId,
  onRefetch,
}: UseRealtimeBookmarksProps) {
  const subscribeToBookmarks = useCallback(() => {
    if (!userId) return null

    const channel: RealtimeChannel = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // On any change (INSERT, UPDATE, DELETE), refetch bookmarks
          onRefetch()
        }
      )
      .subscribe()

    return channel
  }, [userId, onRefetch])

  useEffect(() => {
    const channel = subscribeToBookmarks()

    // Cleanup: unsubscribe on unmount or when dependencies change
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [subscribeToBookmarks])
}
