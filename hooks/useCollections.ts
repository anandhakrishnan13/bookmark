'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/utils/supabaseClient'
import type { Collection } from '@/utils/types'

export function useCollections(userId: string | undefined) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch collections
  useEffect(() => {
    if (!userId) {
      setCollections([])
      setLoading(false)
      return
    }

    const fetchCollections = async () => {
      try {
        setLoading(true)
        const supabase = getSupabase()
        
        const { data, error: fetchError } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', userId)
          .order('position', { ascending: true })
        
        if (fetchError) throw fetchError
        
        setCollections(data ?? [])
        setError(null)
      } catch (err) {
        console.error('Error fetching collections:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collections')
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [userId])

  // Create collection
  const createCollection = useCallback(async (name: string) => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    try {
      const supabase = getSupabase()
      
      // Get max position for ordering
      const maxPosition = collections.length > 0 
        ? Math.max(...collections.map(c => c.position)) 
        : 0

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          user_id: userId,
          name,
          position: maxPosition + 1,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setCollections(prev => [...prev, data])
      setError(null)
    } catch (err) {
      console.error('Error creating collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to create collection')
      throw err
    }
  }, [userId, collections])

  // Rename collection
  const renameCollection = useCallback(async (id: string, newName: string) => {
    if (!userId) return

    try {
      const supabase = getSupabase()

      const { error: updateError } = await supabase
        .from('collections')
        .update({ name: newName })
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      setCollections(prev =>
        prev.map(col => col.id === id ? { ...col, name: newName } : col)
      )
      setError(null)
    } catch (err) {
      console.error('Error renaming collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to rename collection')
      throw err
    }
  }, [userId])

  // Delete collection (also nullifies collection_id on bookmarks via DB cascade or manual)
  const deleteCollection = useCallback(async (id: string) => {
    if (!userId) return

    try {
      const supabase = getSupabase()

      // Nullify collection_id on bookmarks in this collection first
      await supabase
        .from('bookmarks')
        .update({ collection_id: null })
        .eq('collection_id', id)
        .eq('user_id', userId)

      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      setCollections(prev => prev.filter(col => col.id !== id))
      setError(null)
    } catch (err) {
      console.error('Error deleting collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete collection')
      throw err
    }
  }, [userId])

  // Refetch collections
  const refetch = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const supabase = getSupabase()
      
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setCollections(data ?? [])
      setError(null)
    } catch (err) {
      console.error('Error refetching collections:', err)
      setError(err instanceof Error ? err.message : 'Failed to refetch collections')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const getBookmarkCount = useCallback(async (collectionId: string): Promise<number> => {
    try {
      const supabase = getSupabase()
      const { count, error: countError } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId)
        .eq('is_deleted', false)

      if (countError) throw countError
      return count ?? 0
    } catch (err) {
      console.error('Error getting bookmark count:', err)
      return 0
    }
  }, [])

  return {
    collections,
    loading,
    error,
    createCollection,
    renameCollection,
    deleteCollection,
    getBookmarkCount,
    refetch,
  }
}
