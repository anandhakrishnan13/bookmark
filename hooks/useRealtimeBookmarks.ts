'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'

interface UseRealtimeBookmarksProps {
  userId: string | null
  onRefetch: () => void
}

export function useRealtimeBookmarks({ userId, onRefetch }: UseRealtimeBookmarksProps) {
  // Store callback in ref so the subscription never needs to be recreated
  const onRefetchRef = useRef(onRefetch)
  onRefetchRef.current = onRefetch

  // Stable callback that always calls latest onRefetch
  const stableRefetch = useCallback(() => {
    onRefetchRef.current()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channelName = `bookmarks-realtime-${userId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        stableRefetch
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, stableRefetch])
}
