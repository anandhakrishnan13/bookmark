// Database Types
export interface Bookmark {
  id: string
  user_id: string
  title: string
  url: string
  created_at: string
}

// Database insert type (without id and created_at which are auto-generated)
export interface BookmarkInsert {
  title: string
  url: string
  user_id: string
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
