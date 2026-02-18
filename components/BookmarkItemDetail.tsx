'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, MoreVertical, ExternalLink, Trash2, RotateCcw, FolderInput, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Bookmark, Collection } from '@/utils/types'

interface BookmarkItemDetailProps {
  bookmark: Bookmark
  onDelete: (id: string) => Promise<void>
  onToggleFavorite?: ((id: string, currentState: boolean) => Promise<void>) | undefined
  onRestore?: ((id: string) => Promise<void>) | undefined
  onPermanentDelete?: ((id: string) => Promise<void>) | undefined
  onMoveToCollection?: ((id: string, collectionId: string | null) => Promise<void>) | undefined
  collections?: Collection[] | undefined
  collectionName?: string | undefined
  isTrashView?: boolean | undefined
}

export function BookmarkItemDetail({
  bookmark,
  onDelete,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
  onMoveToCollection,
  collections,
  collectionName,
  isTrashView = false,
}: BookmarkItemDetailProps) {
  const [imageError, setImageError] = useState(false)

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname
    } catch {
      return bookmark.url
    }
  })()

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

  const handleToggleFavorite = async () => {
    if (onToggleFavorite) {
      await onToggleFavorite(bookmark.id, bookmark.is_favorite)
    }
  }

  const handleDelete = async () => {
    await onDelete(bookmark.id)
  }

  const handleRestore = async () => {
    if (onRestore) {
      await onRestore(bookmark.id)
    }
  }

  const handlePermanentDelete = async () => {
    if (onPermanentDelete) {
      await onPermanentDelete(bookmark.id)
    }
  }

  const dateStr = new Date(bookmark.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      {/* Favicon */}
      <div className="flex-shrink-0 h-7 w-7 rounded bg-muted flex items-center justify-center overflow-hidden">
        {!imageError ? (
          <Image
            src={faviconUrl}
            alt={bookmark.title}
            width={20}
            height={20}
            className="rounded"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Title + URL */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium truncate hover:underline max-w-[300px]"
          title={bookmark.title}
        >
          {bookmark.title}
        </a>
        <span className="text-xs text-muted-foreground truncate max-w-[250px] hidden sm:inline" title={bookmark.url}>
          {bookmark.url}
        </span>
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
        {dateStr}
      </span>

      {/* Collection badge */}
      {collectionName && (
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full whitespace-nowrap hidden lg:inline">
          {collectionName}
        </span>
      )}

      {/* Favorite star */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={handleToggleFavorite}
        title={bookmark.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          className={`h-4 w-4 ${
            bookmark.is_favorite
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground'
          }`}
        />
      </Button>

      {/* Kebab menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-white dark:bg-zinc-900 text-black dark:text-white border shadow-lg rounded-lg p-1"
        >
          <DropdownMenuItem
            onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in new tab
          </DropdownMenuItem>

          {isTrashView ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRestore}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handlePermanentDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete permanently
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {collections && collections.length > 0 && onMoveToCollection && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to Collection
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-white dark:bg-zinc-900 text-black dark:text-white border shadow-lg rounded-lg p-1">
                    {collections.map((collection) => (
                      <DropdownMenuItem
                        key={collection.id}
                        onClick={() => onMoveToCollection(bookmark.id, collection.id)}
                        className={bookmark.collection_id === collection.id ? 'bg-accent' : ''}
                      >
                        {collection.name}
                      </DropdownMenuItem>
                    ))}
                    {bookmark.collection_id && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onMoveToCollection(bookmark.id, null)}>
                          <X className="mr-2 h-4 w-4" />
                          Remove from collection
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
