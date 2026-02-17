'use client'

import { useAuth } from '@/hooks/useAuth'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useRealtimeBookmarks } from '@/hooks/useRealtimeBookmarks'
import { BookmarkList } from '@/components/BookmarkList'
import { AddBookmark } from '@/components/AddBookmark'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

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

  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider defaultOpen={true} className="flex h-screen bg-background">
      <AppSidebar collapsible="offcanvas" />
      
      <div className="w-full flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          {/* Search Bar */}
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <AddBookmark onAdd={addBookmark} />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">All Bookmarks</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </div>

            <BookmarkList
              bookmarks={filteredBookmarks}
              onDelete={handleDelete}
              loading={bookmarksLoading}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
