'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { Bookmark } from '@/utils/types'
import type { Database } from '@/utils/database.types'
import { isDemoMode, mockBookmarks, generateMockId, simulateDelay } from '@/utils/mockData'

interface BookmarksState {
  bookmarks: Bookmark[]
  loading: boolean
  error: string | null
}

export function useBookmarks(userId: string | null) {
  const [state, setState] = useState<BookmarksState>({
    bookmarks: [],
    loading: true,
    error: null,
  })

  // Fetch bookmarks on mount and when userId changes
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      
      // Demo mode - use mock data
      if (isDemoMode()) {
        await simulateDelay(600)
        setState({ bookmarks: [...mockBookmarks], loading: false, error: null })
        return
      }

      // Production mode - use Supabase
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setState({ bookmarks: [], loading: false, error: error.message })
      } else {
        setState({ bookmarks: data || [], loading: false, error: null })
      }
    }

    fetchData()
  }, [userId])

  // Refetch function for manual refresh (e.g., after realtime event)
  const refetch = useCallback(async () => {
    if (!userId) return

    // Demo mode - use mock data
    if (isDemoMode()) {
      await simulateDelay(400)
      setState((prev) => ({ ...prev, loading: false, error: null }))
      return
    }

    // Production mode - use Supabase
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setState({ bookmarks: [], loading: false, error: error.message })
    } else {
      setState({ bookmarks: data || [], loading: false, error: null })
    }
  }, [userId])

  const addBookmark = useCallback(
    async (title: string, url: string) => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }

      // Demo mode - simulate adding bookmark
      if (isDemoMode()) {
        await simulateDelay(500)
        const newBookmark: Bookmark = {
          id: generateMockId(),
          user_id: userId,
          title,
          url,
          created_at: new Date().toISOString(),
        }
        setState((prev) => ({
          ...prev,
          bookmarks: [newBookmark, ...prev.bookmarks],
        }))
        return { success: true, data: newBookmark }
      }

      // Production mode - use Supabase
      const newBookmark: Database['public']['Tables']['bookmarks']['Insert'] = { 
        title, 
        url, 
        user_id: userId 
      }

      // Supabase types will resolve once env vars are configured
      const { data, error } = await supabase
        .from('bookmarks')
        // @ts-expect-error - Type inference requires valid Supabase credentials
        .insert(newBookmark)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      // Optimistically update local state
      setState((prev) => ({
        ...prev,
        bookmarks: [data as Bookmark, ...prev.bookmarks],
      }))

      return { success: true, data: data as Bookmark }
    },
    [userId]
  )

  const deleteBookmark = useCallback(async (id: string) => {
    // Demo mode - simulate deleting bookmark
    if (isDemoMode()) {
      await simulateDelay(400)
      setState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== id),
      }))
      return { success: true }
    }

    // Production mode - use Supabase
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Optimistically update local state
    setState((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== id),
    }))

    return { success: true }
  }, [])

  return {
    ...state,
    addBookmark,
    deleteBookmark,
    refetch,
  }
}
