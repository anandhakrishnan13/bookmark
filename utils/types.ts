// Database Types

// Collection interface (matches collections table)
export interface Collection {
  id: string
  user_id: string
  name: string
  position: number
  created_at: string
}

// Collection insert type
export interface CollectionInsert {
  user_id: string
  name: string
  position?: number
}

// Bookmark interface (matches bookmarks table with all new fields)
export interface Bookmark {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  url: string
  is_favorite: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// Bookmark insert type (for creating new bookmarks)
export interface BookmarkInsert {
  user_id: string
  title: string
  url: string
  collection_id?: string | null
  is_favorite?: boolean
}

// Bookmark update type (for partial updates)
export interface BookmarkUpdate {
  title?: string
  url?: string
  collection_id?: string | null
  is_favorite?: boolean
  is_deleted?: boolean
}

// Auth Types
export interface User {
  id: string
  email: string
}

export interface Session {
  user: User
  access_token: string
}
