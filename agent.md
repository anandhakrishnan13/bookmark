# Smart Bookmark App – Agent Guidelines

This document defines **non‑negotiable engineering rules** for building the Smart Bookmark App using **Next.js (App Router) + TypeScript on the frontend** and **Supabase as the backend**. The goal is to make the application **production‑grade, deterministic, secure, and free from architectural, performance, and lifecycle flaws**.

This file is written for *agents, reviewers, and future contributors*.

---

## 1. System Architecture (Authoritative)

```
Frontend (Next.js App Router, TypeScript)
   └── Supabase SDK
         ├── Auth (Google OAuth)
         ├── PostgreSQL (Bookmarks)
         └── Realtime (Postgres changes)
```

**There is NO custom backend server.**
Supabase is the backend.

Reasons:
- Auth, database, realtime, and security are already solved
- Reduces surface area for bugs and vulnerabilities
- Faster iteration with stronger guarantees
- Correct scoping for a screening challenge

---

## 2. Frontend Engineering Contract (MANDATORY)

### 2.1 Technology Constraints

- Next.js **App Router only** (`app/` directory)
- TypeScript **strict mode enabled**
- NO `any`, `unknown`, or implicit `any`
- ESLint must pass with **zero warnings**
- React 18 concurrent-safe patterns only

---

## 3. Frontend Folder & Dependency Flow (STRICT)

```
frontend/
 ├─ app/
 │   ├─ layout.tsx
 │   ├─ page.tsx            # login / landing
 │   ├─ bookmarks/
 │   │   └─ page.tsx        # dashboard page
 │   └─ auth/callback/
 │       └─ route.ts
 ├─ components/
 │   ├─ BookmarkItem.tsx
 │   ├─ BookmarkList.tsx
 │   └─ AddBookmark.tsx
 ├─ hooks/
 │   ├─ useAuth.ts
 │   ├─ useBookmarks.ts
 │   └─ useRealtimeBookmarks.ts
 ├─ utils/
 │   ├─ supabaseClient.ts
 │   ├─ validators.ts
 │   └─ types.ts
```

### Dependency Rule (Non‑Violable)

```
utils → hooks → components → pages
```

Violations:
- ❌ components importing pages
- ❌ hooks importing components
- ❌ utils importing hooks

---

## 4. TypeScript & Type Safety Rules

- `tsconfig.json` must enable:
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`

- All Supabase responses must be typed
- Database row types must live in `utils/types.ts`
- No inline object typing in JSX

Example (required style):

```
interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
}
```

---

## 5. State Management Rules (CRITICAL)

### 5.1 State Ownership

- Global session state → `useAuth`
- Bookmark state → `useBookmarks`
- Realtime sync logic → `useRealtimeBookmarks`

Pages MUST NOT:
- Hold business state
- Subscribe to realtime channels directly
- Perform data mutation

---

### 5.2 Effects & Lifecycle Safety

Every `useEffect` MUST:
- Have an explicit dependency array
- Return a cleanup function if it subscribes to anything

Realtime subscriptions:
- MUST unsubscribe on unmount
- MUST NOT re‑subscribe on every render

Violation examples:
- ❌ subscribing inside components
- ❌ missing cleanup
- ❌ effect depending on unstable references

---

## 6. Realtime Handling (Bulletproof Rules)

- Only ONE realtime channel per user session
- Channel lifecycle is owned by `useRealtimeBookmarks`
- On event:
  - Either refetch bookmarks OR
  - Perform deterministic state update

Rules:
- No optimistic updates without reconciliation
- No duplicate state merges
- No stale closures

---

## 7. Rendering & Performance Guarantees

- No side effects during render
- No async logic in component body
- Memoize callbacks passed to children
- Use stable keys (UUIDs only)

Forbidden:
- ❌ derived state stored unnecessarily
- ❌ useEffect used as a substitute for logic

---

## 8. ESLint & Code Quality

Required ESLint categories:
- React hooks rules
- TypeScript strict rules
- Exhaustive deps
- No unused vars

Code must be:
- Predictable
- Readable
- Single‑responsibility

---

## 9. Supabase Backend Contract

### 9.1 Auth

- Google OAuth only
- No email/password fallback
- Session handled client‑side

---

### 9.2 Database Schema

```
bookmarks
- id (uuid, pk)
- user_id (uuid, fk → auth.users)
- title (text)
- url (text)
- created_at (timestamp)
```

---

### 9.3 Row Level Security (NON‑OPTIONAL)

- SELECT → only own rows
- INSERT → only own user_id
- DELETE → only own rows

RLS is the **primary security layer**.
No client trust assumptions.

---

## 10. Security Rules

- Never expose service role keys
- All mutations rely on RLS
- No user_id accepted from client without verification
- No hidden admin logic

---

## 11. Error Handling Policy

- All async calls must handle errors
- User‑facing errors are safe & minimal
- Logs are developer‑focused
- No swallowed promises

---

## 12. Memory & Resource Safety

Guaranteed by design:
- No backend memory leaks (Supabase managed)
- No hanging realtime channels
- No unbounded listeners
- No polling loops

---

## 13. What Makes This App “Bulletproof”

- Deterministic rendering
- Lifecycle‑safe subscriptions
- Database‑level security
- Strict type system
- Clear separation of concerns
- Minimal attack surface

---

## 14. Progressive README Tracking (MANDATORY)

### 14.1 README.md as a Source of Truth

A `README.md` file MUST exist at the project root and is treated as an **append-only execution log**.

Rules:
- After **every completed step**, append a new bullet/section
- ❌ Never delete existing lines
- ❌ Never rewrite or edit previous entries
- ✅ Only add new statements describing what was done

The README must track:
- Setup steps completed
- Features implemented
- Decisions taken (with short reasoning)
- Constraints enforced

This file exists to:
- Prevent hallucination by agents
- Preserve execution context across sessions
- Allow reviewers to audit progress chronologically

Agents MUST read `README.md` before making changes.

---

## 15. Strict UI & Component Rules (shadcn/ui)

- shadcn/ui components MUST be used for all UI elements
- No custom HTML UI unless shadcn does not provide an equivalent
- Tailwind is allowed **only** for layout and spacing
- MCP-installed shadcn components are the single UI source

Forbidden:
- ❌ Mixing random UI libraries
- ❌ Inline styled JSX
- ❌ Custom buttons/forms when shadcn equivalents exist

---

## 16. Functional Requirements (NON-NEGOTIABLE)

The system MUST satisfy ALL of the following:

1. User authentication via **Google OAuth only** (no email/password)
2. Logged-in users can add bookmarks (URL + Title)
3. Bookmarks are **strictly private per user**
4. Bookmark list updates in **real time** across tabs without refresh
5. Users can delete **only their own** bookmarks
6. Stack enforcement:
   - Next.js (App Router only)
   - Supabase (Auth, Database, Realtime)
   - Tailwind CSS
   - shadcn/ui for UI components

Failure to meet any item is considered a requirement breach.

---

## 17. Interview Defense Statement

> “I intentionally avoided a custom backend because Supabase already provides auth, realtime, and database with strong security guarantees. I focused on correctness, lifecycle safety, and clean architecture rather than unnecessary complexity.”

This is the expected explanation.

---

## END OF CONTRACT

Violating any rule in this document is considered a **design failure**, not a preference difference.

