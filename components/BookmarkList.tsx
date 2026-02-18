'use client'

import { BookmarkItem } from '@/components/BookmarkItem'
import { BookmarkItemDetail } from '@/components/BookmarkItemDetail'
import { Skeleton } from '@/components/ui/skeleton'
import type { Bookmark, Collection } from '@/utils/types'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onDelete: (id: string) => Promise<void>
  onToggleFavorite?: ((id: string, currentState: boolean) => Promise<void>) | undefined
  onRestore?: ((id: string) => Promise<void>) | undefined
  onPermanentDelete?: ((id: string) => Promise<void>) | undefined
  onMoveToCollection?: ((id: string, collectionId: string | null) => Promise<void>) | undefined
  collections?: Collection[] | undefined
  loading: boolean
  isTrashView?: boolean | undefined
  viewMode?: 'grid' | 'list' | undefined
  emptyMessage?: string | undefined
}

export function BookmarkList({
  bookmarks,
  onDelete,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
  onMoveToCollection,
  collections,
  loading,
  isTrashView = false,
  viewMode = 'grid',
  emptyMessage = 'No bookmarks yet. Add your first bookmark to get started!',
}: BookmarkListProps) {
  const getCollectionName = (collectionId: string | null): string | undefined => {
    if (!collectionId || !collections) return undefined
    return collections.find((c) => c.id === collectionId)?.name
  }

  if (loading) {
    if (viewMode === 'list') {
      return (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="space-y-2 px-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm max-w-xs">
          {emptyMessage}
        </p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {bookmarks.map((bookmark) => (
          <BookmarkItemDetail
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
            onMoveToCollection={onMoveToCollection}
            collections={collections}
            collectionName={getCollectionName(bookmark.collection_id)}
            isTrashView={isTrashView}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onMoveToCollection={onMoveToCollection}
          collections={collections}
          collectionName={getCollectionName(bookmark.collection_id)}
          isTrashView={isTrashView}
        />
      ))}
    </div>
  )
}
