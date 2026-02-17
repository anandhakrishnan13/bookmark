'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { Bookmark } from '@/utils/types'

/**
 * Filter types for bookmark queries:
 * - 'all': all non-deleted bookmarks
 * - 'favorites': non-deleted bookmarks where is_favorite = true
 * - 'recent': last 10 non-deleted bookmarks by created_at DESC
 * - 'trash': soft-deleted bookmarks (is_deleted = true)
 * - string (UUID): bookmarks in a specific collection (non-deleted)
 */
export type BookmarkFilter = 'all' | 'favorites' | 'recent' | 'trash' | string

interface BookmarksState {
  bookmarks: Bookmark[]
  loading: boolean
  error: string | null
}

interface AddBookmarkResult {
  success: boolean
  error?: string | undefined
  data?: Bookmark | undefined
}

interface MutationResult {
  success: boolean
  error?: string | undefined
}

export function useBookmarks(userId: string | null, filter: BookmarkFilter = 'all') {
  const [state, setState] = useState<BookmarksState>({
    bookmarks: [],
    loading: true,
    error: null,
  })

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setState({ bookmarks: [], loading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)

    // Apply filter
    switch (filter) {
      case 'all':
        query = query.eq('is_deleted', false)
        break
      case 'favorites':
        query = query.eq('is_deleted', false).eq('is_favorite', true)
        break
      case 'recent':
        query = query.eq('is_deleted', false).order('created_at', { ascending: false }).limit(10)
        break
      case 'trash':
        query = query.eq('is_deleted', true)
        break
      default:
        // Collection filter (UUID string)
        query = query.eq('is_deleted', false).eq('collection_id', filter)
        break
    }

    // Default ordering (recent filter already has it)
    if (filter !== 'recent') {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      setState({ bookmarks: [], loading: false, error: error.message })
    } else {
      setState({ bookmarks: (data as Bookmark[]) ?? [], loading: false, error: null })
    }
  }, [userId, filter])

  // Fetch on mount and when userId or filter changes
  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  // Refetch for manual refresh (e.g., after realtime event)
  const refetch = useCallback(async () => {
    await fetchBookmarks()
  }, [fetchBookmarks])

  // Add a new bookmark
  const addBookmark = useCallback(
    async (title: string, url: string, collectionId?: string | null): Promise<AddBookmarkResult> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }

      const insertData: {
        title: string
        url: string
        user_id: string
        collection_id?: string | null
      } = {
        title,
        url,
        user_id: userId,
      }

      if (collectionId !== undefined) {
        insertData.collection_id = collectionId
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const bookmark = data as Bookmark

      // Optimistically add to local state (only if it matches current filter)
      const shouldAppear = shouldBookmarkAppearInFilter(bookmark, filter)
      if (shouldAppear) {
        setState((prev) => ({
          ...prev,
          bookmarks: [bookmark, ...prev.bookmarks],
        }))
      }

      return { success: true, data: bookmark }
    },
    [userId, filter]
  )

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (id: string): Promise<MutationResult> => {
      // Find current bookmark to toggle
      const current = state.bookmarks.find((b) => b.id === id)
      if (!current) {
        return { success: false, error: 'Bookmark not found' }
      }

      const newValue = !current.is_favorite

      // Optimistic update
      setState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.map((b) =>
          b.id === id ? { ...b, is_favorite: newValue } : b
        ),
      }))

      const { error } = await supabase
        .from('bookmarks')
        .update({ is_favorite: newValue })
        .eq('id', id)

      if (error) {
        // Revert optimistic update
        setState((prev) => ({
          ...prev,
          bookmarks: prev.bookmarks.map((b) =>
            b.id === id ? { ...b, is_favorite: !newValue } : b
          ),
        }))
        return { success: false, error: error.message }
      }

      // If we're in favorites filter and unfavorited, remove from list
      if (filter === 'favorites' && !newValue) {
        setState((prev) => ({
          ...prev,
          bookmarks: prev.bookmarks.filter((b) => b.id !== id),
        }))
      }

      return { success: true }
    },
    [state.bookmarks, filter]
  )

  // Soft delete: move to trash
  const moveToTrash = useCallback(
    async (id: string): Promise<MutationResult> => {
      // Optimistic update: remove from current view
      setState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== id),
      }))

      const { error } = await supabase
        .from('bookmarks')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        // Revert: refetch to restore correct state
        await fetchBookmarks()
        return { success: false, error: error.message }
      }

      return { success: true }
    },
    [fetchBookmarks]
  )

  // Restore from trash
  const restoreFromTrash = useCallback(
    async (id: string): Promise<MutationResult> => {
      // Optimistic update: remove from trash view
      setState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== id),
      }))

      const { error } = await supabase
        .from('bookmarks')
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq('id', id)

      if (error) {
        await fetchBookmarks()
        return { success: false, error: error.message }
      }

      return { success: true }
    },
    [fetchBookmarks]
  )

  // Permanent delete (from trash)
  const permanentDelete = useCallback(
    async (id: string): Promise<MutationResult> => {
      // Optimistic update: remove from trash view
      setState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== id),
      }))

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

      if (error) {
        await fetchBookmarks()
        return { success: false, error: error.message }
      }

      return { success: true }
    },
    [fetchBookmarks]
  )

  // Move bookmark to a collection (or remove from collection with null)
  const moveToCollection = useCallback(
    async (id: string, collectionId: string | null): Promise<MutationResult> => {
      const { error } = await supabase
        .from('bookmarks')
        .update({ collection_id: collectionId })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Refetch to reflect changes in filtered views
      await fetchBookmarks()
      return { success: true }
    },
    [fetchBookmarks]
  )

  return {
    ...state,
    addBookmark,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    moveToCollection,
    refetch,
  }
}

/** Helper: determine if a bookmark should appear given the current filter */
function shouldBookmarkAppearInFilter(bookmark: Bookmark, filter: BookmarkFilter): boolean {
  if (bookmark.is_deleted) {
    return filter === 'trash'
  }

  switch (filter) {
    case 'all':
    case 'recent':
      return true
    case 'favorites':
      return bookmark.is_favorite
    case 'trash':
      return false
    default:
      // Collection filter
      return bookmark.collection_id === filter
  }
}
