'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { validateBookmark } from '@/utils/validators'
import type { Collection } from '@/utils/types'

interface AddBookmarkProps {
  onAdd: (title: string, url: string, collectionId?: string | undefined) => Promise<{ success: boolean; error?: string | undefined }>
  collections?: Collection[] | undefined
  defaultCollectionId?: string | undefined
  hideCollectionSelector?: boolean | undefined
}

export function AddBookmark({ onAdd, collections, defaultCollectionId, hideCollectionSelector }: AddBookmarkProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [collectionId, setCollectionId] = useState<string>(defaultCollectionId ?? 'none')
  const [errors, setErrors] = useState<{ title?: string | undefined; url?: string | undefined }>({})
  const [submitting, setSubmitting] = useState(false)

  // Sync with defaultCollectionId when user navigates between collections
  useEffect(() => {
    if (!open) {
      setCollectionId(defaultCollectionId ?? 'none')
    }
  }, [defaultCollectionId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate input
    const validation = validateBookmark(title, url)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setSubmitting(true)
    setErrors({})

    const selectedCollection = collectionId === 'none' ? undefined : collectionId
    const result = await onAdd(title, url, selectedCollection)

    setSubmitting(false)

    if (result.success) {
      // Reset form and close dialog
      setTitle('')
      setUrl('')
      setCollectionId('none')
      setOpen(false)
    } else {
      setErrors({ url: result.error || 'Failed to add bookmark' })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setTitle('')
      setUrl('')
      setCollectionId(defaultCollectionId ?? 'none')
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Bookmark
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Bookmark</DialogTitle>
            <DialogDescription>
              Save a new bookmark to your collection
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome bookmark"
                disabled={submitting}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={submitting}
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url}</p>
              )}
            </div>
            {collections && collections.length > 0 && !hideCollectionSelector && (
              <div className="grid gap-2">
                <label htmlFor="collection" className="text-sm font-medium">
                  Collection (optional)
                </label>
                <Select value={collectionId} onValueChange={setCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No collection</SelectItem>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
