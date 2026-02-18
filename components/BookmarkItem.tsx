'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trash2,
  ExternalLink,
  Star,
  MoreHorizontal,
  Image as ImageIcon,
  Undo2,
  FolderOpen,
} from 'lucide-react'
import type { Bookmark } from '@/utils/types'
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
import type { Collection } from '@/utils/types'
import { useState } from 'react'
import Image from 'next/image'

interface BookmarkItemProps {
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

export function BookmarkItem({
  bookmark,
  onDelete,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
  onMoveToCollection,
  collections,
  collectionName,
  isTrashView = false,
}: BookmarkItemProps) {
  const [imageError, setImageError] = useState(false)

  const handleDelete = async () => {
    await onDelete(bookmark.id)
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleFavorite) {
      await onToggleFavorite(bookmark.id, bookmark.is_favorite)
    }
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

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  // Generate placeholder image URL using the website's favicon
  const getImageUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`
    } catch {
      return null
    }
  }

  const imageUrl = getImageUrl(bookmark.url)
  const domain = getDomain(bookmark.url)

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      {/* Image Cover */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {imageUrl && !imageError ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Image
              src={imageUrl}
              alt={bookmark.title}
              width={64}
              height={64}
              className="object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Actions - always visible */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          {/* Favorite star */}
          {!isTrashView ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  bookmark.is_favorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          ) : (
            <div />
          )}

          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-900 text-black dark:text-white border border-border shadow-lg rounded-lg p-1">
              <DropdownMenuItem
                onClick={() => window.open(bookmark.url, '_blank')}
                className="cursor-pointer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Open in new tab</span>
              </DropdownMenuItem>
              {isTrashView ? (
                <>
                  <DropdownMenuItem onClick={handleRestore} className="cursor-pointer">
                    <Undo2 className="mr-2 h-4 w-4" />
                    <span>Restore</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handlePermanentDelete}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete permanently</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {onMoveToCollection && collections && collections.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span>Move to Collection</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-white dark:bg-zinc-900 text-black dark:text-white border border-border shadow-lg rounded-lg p-1">
                        {bookmark.collection_id && (
                          <DropdownMenuItem
                            onClick={() => onMoveToCollection(bookmark.id, null)}
                            className="cursor-pointer text-muted-foreground"
                          >
                            Remove from collection
                          </DropdownMenuItem>
                        )}
                        {bookmark.collection_id && collections.length > 0 && (
                          <DropdownMenuSeparator />
                        )}
                        {collections
                          .filter((c) => c.id !== bookmark.collection_id)
                          .map((collection) => (
                            <DropdownMenuItem
                              key={collection.id}
                              onClick={() => onMoveToCollection(bookmark.id, collection.id)}
                              className="cursor-pointer"
                            >
                              <FolderOpen className="mr-2 h-4 w-4" />
                              {collection.name}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Move to Trash</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2 leading-snug">
            {bookmark.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{domain}</span>
            <span>·</span>
            <time dateTime={bookmark.created_at}>
              {new Date(bookmark.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </time>
            {collectionName && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <FolderOpen className="h-3 w-3 shrink-0" />
                  {collectionName}
                </span>
              </>
            )}
          </div>

          {/* Trash info */}
          {isTrashView && bookmark.deleted_at && (
            <p className="text-xs text-muted-foreground/70">
              Deleted{' '}
              {new Date(bookmark.deleted_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </a>
    </Card>
  )
}
