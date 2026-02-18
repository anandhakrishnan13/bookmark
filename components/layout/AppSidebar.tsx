'use client'

import {
  Home,
  Star,
  Clock,
  Trash2,
  Folder,
  ChevronRight,
  User2,
  LogOut,
  Pencil,
  Trash,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'
import type { Collection } from '@/utils/types'
import { CollectionManager } from '@/components/CollectionManager'

export type FilterType = 'all' | 'favorites' | 'recent' | 'trash' | string // string = collection_id

interface NavCounts {
  all: number
  favorites: number
  recent: number
  trash: number
}

export interface AppSidebarProps {
  userEmail?: string | undefined
  onSignOut?: (() => void) | undefined
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  collections: Collection[]
  collectionCounts: Record<string, number>
  navCounts: NavCounts
  collectionsLoading?: boolean | undefined
  onCreateCollection: (name: string) => Promise<void>
  onRenameCollection: (id: string, newName: string) => Promise<void>
  onDeleteCollection: (id: string) => Promise<void>
}

export function AppSidebar({
  userEmail,
  onSignOut,
  activeFilter,
  onFilterChange,
  collections,
  collectionCounts,
  navCounts,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
}: AppSidebarProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = async () => {
    if (renamingId && renameValue.trim()) {
      await onRenameCollection(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg font-semibold">Smart Bookmarks</h2>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Organize your web</p>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 mb-2 px-2">
            NAVIGATION
          </h3>
          <Button
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onFilterChange('all')}
          >
            <Home className="mr-2 h-4 w-4" />
            All Bookmarks
            <span className="ml-auto text-xs text-sidebar-foreground/60">{navCounts.all}</span>
          </Button>
          <Button
            variant={activeFilter === 'favorites' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onFilterChange('favorites')}
          >
            <Star className="mr-2 h-4 w-4" />
            Favorites
            <span className="ml-auto text-xs text-sidebar-foreground/60">{navCounts.favorites}</span>
          </Button>
          <Button
            variant={activeFilter === 'recent' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onFilterChange('recent')}
          >
            <Clock className="mr-2 h-4 w-4" />
            Recent
            <span className="ml-auto text-xs text-sidebar-foreground/60">{navCounts.recent}</span>
          </Button>
          <Button
            variant={activeFilter === 'trash' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onFilterChange('trash')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
            {navCounts.trash > 0 && (
              <span className="ml-auto text-xs text-sidebar-foreground/60">{navCounts.trash}</span>
            )}
          </Button>
        </div>

        {/* Collections */}
        <div className="space-y-1">
          <div className="w-full flex items-center justify-between px-2 py-1">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <span>COLLECTIONS</span>
              <ChevronRight
                className={`h-3 w-3 transition-transform ${
                  collectionsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>
          {collectionsOpen && (
            <div className="space-y-1">
              {collections.length === 0 && (
                <p className="text-xs text-sidebar-foreground/40 px-4 py-2">
                  No collections yet
                </p>
              )}
              {collections.map((collection) => (
                <div key={collection.id} className="group flex items-center">
                  {renamingId === collection.id ? (
                    <div className="flex-1 px-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') cancelRename()
                        }}
                        onBlur={commitRename}
                        className="w-full px-2 py-1 text-sm bg-background border rounded outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                        maxLength={50}
                      />
                    </div>
                  ) : (
                    <>
                      <Button
                        variant={activeFilter === collection.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start pl-4 flex-1"
                        onClick={() => onFilterChange(collection.id)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{collection.name}</span>
                        <span className="ml-auto text-xs text-sidebar-foreground/60">
                          {collectionCounts[collection.id] ?? 0}
                        </span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <span className="sr-only">Collection actions</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              startRename(collection.id, collection.name)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDeleteCollection(collection.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
              {/* Create Collection - Embedded Dialog */}
              <CollectionManager onCreate={onCreateCollection} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <User2 className="h-4 w-4" />
            <span className="text-sm truncate">{userEmail || 'User'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
