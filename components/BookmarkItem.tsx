'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink } from 'lucide-react'
import type { Bookmark } from '@/utils/types'

interface BookmarkItemProps {
  bookmark: Bookmark
  onDelete: (id: string) => Promise<void>
}

export function BookmarkItem({ bookmark, onDelete }: BookmarkItemProps) {
  const handleDelete = async () => {
    await onDelete(bookmark.id)
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{bookmark.title}</h3>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{bookmark.url}</span>
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(bookmark.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="shrink-0"
          aria-label="Delete bookmark"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
