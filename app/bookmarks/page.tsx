'use client'

import { useAuth } from '@/hooks/useAuth'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useRealtimeBookmarks } from '@/hooks/useRealtimeBookmarks'
import { BookmarkList } from '@/components/BookmarkList'
import { AddBookmark } from '@/components/AddBookmark'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function BookmarksPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    deleteBookmark,
    refetch,
  } = useBookmarks(user?.id || null)

  // Set up realtime subscription
  useRealtimeBookmarks({
    userId: user?.id || null,
    onRefetch: refetch,
  })

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteBookmark(id)
    },
    [deleteBookmark]
  )

  // Redirect to home if not authenticated
  if (!authLoading && !user) {
    router.push('/')
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
          </h2>
          <AddBookmark onAdd={addBookmark} />
        </div>

        <BookmarkList
          bookmarks={bookmarks}
          onDelete={handleDelete}
          loading={bookmarksLoading}
        />
      </main>
    </div>
  )
}
