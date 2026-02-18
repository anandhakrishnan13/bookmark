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
- **Responsive UI**: Raindrop.io-inspired design with sidebar navigation
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
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to delete old trash items
CREATE OR REPLACE FUNCTION delete_old_trash()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM bookmarks 
  WHERE is_deleted = true 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Schedule daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'delete-old-trash',
  '0 3 * * *',
  'SELECT delete_old_trash();'
);
```

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
```

## Design Decisions

1. **No Custom Backend**: Uses Supabase for auth, database, and realtime
2. **Strict TypeScript**: All strict flags enabled, zero errors
3. **Single Realtime Channel**: Prevents memory leaks
4. **Optimistic Updates**: Immediate UI feedback, revert on error
5. **shadcn/ui Only**: Consistent design system
6. **Soft Delete**: Trash with 30-day retention capability

## Mistakes Made & Fixed

**1. Sidebar Implementation Iterations**
- *Mistake*: Initially tried shadcn SidebarProvider with collapsible modes (icon/offcanvas)
- *Issue*: Complex state management, SidebarTrigger not rendering, unexpected overlay behavior
- *Fix*: Simplified to plain flexbox layout with fixed sidebar + Sheet for mobile menu

**2. Drag-and-Drop Bugs**
- *Mistake*: Duplicate link elements rendered during drag operations with conflicting borders
- *Issue*: Visual glitch where dragged items showed twice with borders
- *Fix*: Added drag state tracking (`draggedItem` state) with opacity transitions instead of borders

**3. Database Types Generation**
- *Mistake*: Attempted auto-generation with `npx supabase gen types` without login token
- *Issue*: Failed with auth error, types file contained only error message
- *Fix*: Manually created `Database` type interface matching Supabase schema

**4. Demo Mode Overhead**
- *Mistake*: Created mock data system with `isDemoMode()` checks throughout codebase
- *Issue*: Conditional logic complexity, `utils/mockData.ts` became maintenance burden
- *Fix*: Removed all demo code after backend integration complete

**5. Empty State UX**
- *Mistake*: Static "No bookmarks" text with unclear CTA
- *Issue*: Users didn't know how to add first bookmark
- *Fix*: Added prominent centered "Add New Bookmark" button with emoji icon

## Difficulties Faced

**1. TypeScript Strict Mode with shadcn**
- *Challenge*: `exactOptionalPropertyTypes` flag rejected `checked?: boolean` in DropdownMenuCheckboxItem
- *Solution*: Conditional prop spreading: `{...(checked !== undefined && { checked })}`

**2. Next.js External Images**
- *Challenge*: Google favicon service blocked by default security policy
- *Solution*: Added specific `remotePatterns` config in `next.config.ts` for `www.google.com/s2/favicons`

**3. Real-time Sync Complexity**
- *Challenge*: Multiple tabs/devices causing race conditions and duplicate updates
- *Solution*: Single channel subscription per user with proper cleanup, optimistic updates with rollback

**4. Word-by-Word Streaming Animation**
- *Challenge*: AI responses needed smooth reveal without blocking UI or memory leaks
- *Solution*: Custom `useWordStream` hook with `setInterval`, proper cleanup on unmount

**5. Theme Consistency**
- *Challenge*: Sidebar background color didn't match main content in light/dark modes
- *Solution*: Updated CSS variables to use `hsl(var(--background))` for seamless visual flow

**6. Mobile Responsive Layout**
- *Challenge*: Balancing desktop sidebar (256px fixed) with mobile Sheet overlay
- *Solution*: Used `hidden md:flex` for desktop sidebar, Sheet component for mobile hamburger menu

## Compliance

| Rule | Status |
|------|--------|
| Dependency Flow | ✅ utils → hooks → components → pages |
| Strict TypeScript | ✅ Zero errors |
| State Ownership | ✅ Auth in useAuth, bookmarks in useBookmarks |
| Effect Cleanup | ✅ All subscriptions cleaned up |
| ESLint | ✅ Zero warnings |
| shadcn/ui | ✅ All UI from shadcn |

## Status

**Current State**: ✅ Production Ready

**Last Updated**: Feb 18, 2026

**Lines of Code**: ~1200 (TypeScript/TSX)

**Features**: Authentication, Bookmarks, Collections, Favorites, Trash, AI Chat, Dark Mode, Real-time Sync, Responsive Design

## Quick Start

```bash
npm install
# Add .env.local with Supabase credentials
npm run dev
```

## Future Enhancements

- Auto-delete trash after 30 days
- Bulk actions (multi-select)
- Keyboard shortcuts
- Bookmark import/export
- Tag system (deferred)
