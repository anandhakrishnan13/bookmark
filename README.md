# Smart Bookmark App

Production-grade bookmark management application with real-time synchronization and AI assistance.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Realtime)
- **UI**: shadcn/ui components
- **AI**: Google Gemini API

## Key Features

- **Authentication**: Google OAuth with Supabase Auth
- **Bookmark Management**: Create, organize, delete with soft-delete (trash)
- **Collections**: User-created folders for bookmark organization
- **Favorites**: Star/unstar bookmarks
- **Real-time Sync**: Live updates across devices via Supabase Realtime
- **AI Chatbot**: Gemini-powered assistant for bookmark help
- **Dark/Light Mode**: Full theme support
- **Search**: Client-side filtering by title/URL
- **View Modes**: Grid/List toggle with sorting options

## Architecture

**Layer Structure** (dependency flow):
```
utils/ → hooks/ → components/ → app/
```

**Key Hooks**:
- `useAuth()` - Authentication state and Google OAuth
- `useBookmarks(userId, filter)` - Bookmark CRUD with filtering
- `useCollections()` - Collection management
- `useBookmarkCounts()` - Navigation counts
- `useRealtimeBookmarks()` - Live synchronization

**Database Schema**:
```sql
collections: id, user_id, name, position, created_at
bookmarks: id, user_id, collection_id, title, url, 
           is_favorite, is_deleted, deleted_at, created_at, updated_at
```

**Auto-Delete Trigger (30 Days)**:

- Enable pg_cron extension
- Function to delete old trash items (30 days)
- Schedule daily cleanup at 3 AM UTC

## Project Structure

```
app/
├── page.tsx              # Login page
├── layout.tsx            # Root layout with ThemeProvider
├── bookmarks/
│   └── page.tsx          # Dashboard with sidebar + chat
├── auth/callback/
│   └── route.ts          # OAuth handler
└── api/chat/
    └── route.ts          # Gemini API endpoint

components/
├── ui/                   # shadcn components
├── layout/
│   └── AppSidebar.tsx    # Navigation sidebar
├── chat/                 # AI chat components
├── BookmarkItem.tsx      # Bookmark card
├── BookmarkList.tsx      # Grid/List display
├── AddBookmark.tsx       # Add bookmark dialog
└── CollectionManager.tsx # Create collection dialog

hooks/
├── useAuth.ts
├── useBookmarks.ts
├── useCollections.ts
├── useBookmarkCounts.ts
└── useRealtimeBookmarks.ts

lib/
├── utils.ts              # shadcn utilities
└── fetchSiteContent.ts   # Site metadata fetcher

utils/
├── types.ts
├── database.types.ts     # Supabase types
├── supabaseClient.ts     # Client factory
└── validators.ts         # Input validation
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_GENERATIVE_AI_API_KEY
```

## Design Decisions

1. **No Custom Backend**: Uses Supabase for auth, database, and realtime
2. **Strict TypeScript**: All strict flags enabled, zero errors
3. **Single Realtime Channel**: Prevents memory leaks
4. **Optimistic Updates**: Immediate UI feedback, revert on error
5. **shadcn/ui Only**: Consistent design system
6. **Soft Delete**: Trash with 30-day retention capability

## Problems Faced

**1. Real-time Sync Complexity**
- *Issue*: Multiple tabs/devices causing race conditions and duplicate updates
- *Solution*: Single channel subscription per user with proper cleanup, optimistic updates with rollback

**2. Sidebar Implementation Iterations**
- *Issue*: shadcn SidebarProvider with collapsible modes caused complex state management and overlay issues
- *Solution*: Simplified to plain flexbox layout with fixed sidebar + Sheet for mobile menu

**3. TypeScript Strict Mode with shadcn**
- *Issue*: `exactOptionalPropertyTypes` flag rejected `checked?: boolean` in DropdownMenuCheckboxItem
- *Solution*: Conditional prop spreading: `{...(checked !== undefined && { checked })}`

**4. Mobile Responsive Layout**
- *Issue*: Balancing desktop sidebar (256px fixed) with mobile Sheet overlay
- *Solution*: Used `hidden md:flex` for desktop sidebar, Sheet component for mobile hamburger menu

**5. Drag-and-Drop Bugs**
- *Issue*: Duplicate link elements rendered during drag operations with conflicting borders
- *Solution*: Added drag state tracking (`draggedItem` state) with opacity transitions instead of borders

**6. Database Types Generation**
- *Issue*: Auto-generation with `npx supabase gen types` failed without login token
- *Solution*: Manually created `Database` type interface matching Supabase schema

## Compliance

| Rule | Status |
|------|--------|
| Dependency Flow | ✅ utils → hooks → components → pages |
| Strict TypeScript | ✅ Zero errors |
| State Ownership | ✅ Auth in useAuth, bookmarks in useBookmarks |
| Effect Cleanup | ✅ All subscriptions cleaned up |
| ESLint | ✅ Zero warnings |
| shadcn/ui | ✅ All UI from shadcn |

## Features 
 - *Authentication*
 - *Bookmarks* 
 - *Collections* 
 - *Favorites*
 - *Trash*
 - *AI Chat*
 - *Dark Mode*
 - *Real-time Sync* 
 - *Responsive Design*

## Quick Start

```bash
npm install
# Add .env with Supabase credentials
npm run dev
```

## Future Enhancements

- Bulk actions (multi-select)
- Keyboard shortcuts
- Bookmark import/export
- Tag system (deferred)
