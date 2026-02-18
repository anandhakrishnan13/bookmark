'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'

interface UseRealtimeBookmarksProps {
  userId: string | null
  onRefetch: () => void
}

export function useRealtimeBookmarks({
  userId,
  onRefetch,
}: UseRealtimeBookmarksProps) {
  // Use a ref to always have the latest onRefetch without re-subscribing
  const onRefetchRef = useRef(onRefetch)
  onRefetchRef.current = onRefetch

  // Track whether realtime is actually connected
  const realtimeConnectedRef = useRef(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stop fallback polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // Start fallback polling (every 5 seconds) when realtime fails
  const startPolling = useCallback(() => {
    stopPolling()
    pollIntervalRef.current = setInterval(() => {
      onRefetchRef.current()
    }, 5000)
    console.log('[Realtime] Fallback polling started (every 5s)')
  }, [stopPolling])

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const channel = supabase
      .channel(`bookmarks-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!mounted) return
          console.log('[Realtime] Bookmark change detected:', payload.eventType)
          onRefetchRef.current()
        }
      )
      .subscribe((status, err) => {
        if (!mounted) return

        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Connected - listening for bookmark changes')
          realtimeConnectedRef.current = true
          // Realtime is working, stop any fallback polling
          stopPolling()
        }

        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error:', err?.message ?? 'unknown')
          realtimeConnectedRef.current = false
          // Start fallback polling since realtime failed
          startPolling()
        }

        if (status === 'TIMED_OUT') {
          console.warn('[Realtime] Subscription timed out, starting fallback polling')
          realtimeConnectedRef.current = false
          startPolling()
        }

        if (status === 'CLOSED') {
          console.log('[Realtime] Channel closed')
          realtimeConnectedRef.current = false
        }
      })

    // Safety: if realtime hasn't connected within 10 seconds, start polling
    const connectionTimeout = setTimeout(() => {
      if (!realtimeConnectedRef.current && mounted) {
        console.warn('[Realtime] No connection after 10s, starting fallback polling')
        startPolling()
      }
    }, 10000)

    return () => {
      mounted = false
      clearTimeout(connectionTimeout)
      stopPolling()
      supabase.removeChannel(channel)
    }
  }, [userId, startPolling, stopPolling])

  // Refetch on tab visibility change (covers cases where realtime misses events)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User switched back to this tab - refetch to catch any missed changes
        onRefetchRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
