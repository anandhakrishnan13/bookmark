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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import Image from 'next/image'

interface BookmarkItemProps {
  bookmark: Bookmark
  onDelete: (id: string) => Promise<void>
  onToggleFavorite?: ((id: string, currentState: boolean) => Promise<void>) | undefined
  onRestore?: ((id: string) => Promise<void>) | undefined
  onPermanentDelete?: ((id: string) => Promise<void>) | undefined
  collectionName?: string | undefined
  isTrashView?: boolean | undefined
}

export function BookmarkItem({
  bookmark,
  onDelete,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
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

        {/* Hover Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {!isTrashView && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/95 backdrop-blur-sm"
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  bookmark.is_favorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : ''
                }`}
              />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/95 backdrop-blur-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(bookmark.url, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </DropdownMenuItem>
              {isTrashView ? (
                <>
                  <DropdownMenuItem onClick={handleRestore}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handlePermanentDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Favorite indicator (always visible when favorited) */}
        {bookmark.is_favorite && !isTrashView && (
          <div className="absolute top-2 left-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
          </div>
        )}
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
