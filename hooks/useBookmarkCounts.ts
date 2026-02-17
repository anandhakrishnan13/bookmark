'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/utils/supabaseClient'

interface BookmarkCounts {
  all: number
  favorites: number
  recent: number
  trash: number
}

export function useBookmarkCounts(userId: string | null) {
  const [counts, setCounts] = useState<BookmarkCounts>({
    all: 0,
    favorites: 0,
    recent: 0,
    trash: 0,
  })

  const fetchCounts = useCallback(async () => {
    if (!userId) {
      setCounts({ all: 0, favorites: 0, recent: 0, trash: 0 })
      return
    }

    const supabase = getSupabase()

    // Fetch all counts in parallel
    const [allResult, favResult, trashResult] = await Promise.all([
      supabase
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_deleted', false),
      supabase
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .eq('is_deleted', false),
      supabase
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_deleted', true),
    ])

    setCounts({
      all: allResult.count ?? 0,
      favorites: favResult.count ?? 0,
      recent: Math.min(allResult.count ?? 0, 10), // Recent is capped at 10
      trash: trashResult.count ?? 0,
    })
  }, [userId])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  return { counts, refetchCounts: fetchCounts }
}
