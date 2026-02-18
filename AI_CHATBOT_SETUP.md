# AI Chatbot Feature - Implementation Guide

A context-aware AI chatbot that lets users ask questions about any bookmarked website directly from the Smart Bookmarks app.

---

## Overview

- **Floating chat icon** in the bottom-right corner
- **Bookmark selector** to choose which site to chat about
- **Temporary chat** — messages are not saved (cleared on close)
- **AI reads the website** content and only answers questions about that specific site
- **Streaming responses** for real-time feel

---

## Architecture

```
User clicks chat icon
  → Panel slides up with bookmark selector
  → User picks a bookmarked site
  → API route fetches page content via Jina AI Reader
  → Content injected as system prompt context for Google Gemini
  → User chats, Gemini streams responses about that site only
  → Closing the panel clears all messages (temporary)
```

---

## Tech Stack

| Component        | Technology                           | Reason                                              |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| LLM              | Google Gemini 2.0 Flash              | Free tier (1,500 req/day), fast, large context      |
| AI Framework     | Vercel AI SDK (`ai` + `@ai-sdk/google`) | Built-in `useChat` hook, streaming, Next.js native  |
| Content Fetching | Jina AI Reader                       | Free, returns clean markdown, no API key needed     |
| UI               | shadcn/ui + Tailwind CSS             | Consistent with existing app design                 |

---

## Prerequisites

### 1. Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key

### 2. Add to Environment Variables

Add to `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
```

> **Note**: This is a server-side variable (no `NEXT_PUBLIC_` prefix). It is never exposed to the browser.

---

## Installation

### Step 1: Install Dependencies

```bash
npm install ai @ai-sdk/google
```

| Package          | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `ai`             | Vercel AI SDK — `useChat` hook, streaming utils |
| `@ai-sdk/google` | Google Gemini provider for the AI SDK           |

### Step 2: Install shadcn Scroll Area (if not already installed)

```bash
npx shadcn@latest add scroll-area
```

---

## Implementation Steps

### Step 1: Create the Content Fetcher

**File**: `lib/fetchSiteContent.ts`

**Purpose**: Server-side utility that fetches a website's content using Jina AI Reader and caches the result.

**What it does**:
- Calls `https://r.jina.ai/{url}` with `Accept: text/markdown` header
- Returns clean markdown text of the website content
- Truncates to ~15,000 characters (Gemini context window safety)
- Caches results in-memory (Map) so repeated questions about the same site don't re-fetch

**Key details**:
- Jina AI Reader is **free** and requires **no API key**
- Returns structured markdown (headings, lists, paragraphs) — much cleaner than raw HTML scraping
- The cache is per-server-process (resets on server restart, which is fine for this use case)

```typescript
// Pseudocode
const cache = new Map<string, string>()

export async function fetchSiteContent(url: string): Promise<string> {
  if (cache.has(url)) return cache.get(url)
  
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: 'text/markdown' }
  })
  const content = await response.text()
  const truncated = content.slice(0, 15000)
  
  cache.set(url, truncated)
  return truncated
}
```

---

### Step 2: Create the API Route

**File**: `app/api/chat/route.ts`

**Purpose**: Next.js API route that handles chat requests with streaming.

**What it does**:
1. Receives POST request with `{ messages, siteUrl }`
2. Fetches site content using the content fetcher (Step 1)
3. Constructs a **system prompt** that restricts the AI to only discuss that website:
   ```
   You are an AI assistant. You have read the following website and can ONLY
   answer questions about its content. If asked about anything unrelated,
   politely decline and redirect to the website topic.
   
   Website URL: {url}
   Website Content:
   {content}
   ```
4. Calls Google Gemini via Vercel AI SDK's `streamText()`
5. Returns streaming response to client

**Key details**:
- Uses `google('gemini-2.0-flash')` model (fast, free tier)
- Streaming means the user sees text appear word-by-word
- The system prompt enforces topic restriction — Gemini won't answer off-topic questions
- Max tokens: ~1,000 per response (keeps answers concise)

```typescript
// Pseudocode
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, siteUrl } = await req.json()
  const content = await fetchSiteContent(siteUrl)
  
  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `You are an AI assistant. ONLY answer about this website...\n${content}`,
    messages,
  })
  
  return result.toDataStreamResponse()
}
```

---

### Step 3: Create Chat UI Components

#### 3a. ChatBubble (`components/chat/ChatBubble.tsx`)

**Purpose**: Floating action button in the bottom-right corner.

**Behavior**:
- Fixed position: `bottom-4 right-4`
- Shows `MessageCircle` icon (lucide-react)
- Click toggles the ChatPanel open/closed
- Subtle pulse animation when first rendered to draw attention
- Z-index high enough to float above all content

---

#### 3b. ChatPanel (`components/chat/ChatPanel.tsx`)

**Purpose**: The main chat interface — a slide-up panel anchored to the bottom-right.

**Dimensions**: ~384px wide × 500px tall (responsive on mobile)

**Three states**:

1. **Site Selection State**:
   - Header: "AI Chat"
   - Label: "Select a bookmark to chat about"
   - Dropdown/select of all user's non-deleted bookmarks (title + domain)
   - Footer: "⏳ Temporary chat — messages are not saved"

2. **Loading State**:
   - Shows: "Reading {domain}..." with a spinner
   - While Jina Reader fetches the website content
   - Typically 1–3 seconds

3. **Chat Active State**:
   - Header: Site favicon + domain name + "Temporary" badge
   - Button to switch site (goes back to state 1, clears messages)
   - Message list (scrollable)
   - AI sends an initial greeting: "I've read {domain}. What would you like to know?"
   - Message input at bottom

**Uses**: Vercel AI SDK's `useChat` hook for all message state management and streaming.

```typescript
// useChat handles everything:
const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
  body: { siteUrl: selectedBookmark.url },  // sent with every request
})
```

---

#### 3c. MessageList (`components/chat/MessageList.tsx`)

**Purpose**: Renders the conversation messages.

**Layout**:
- User messages: right-aligned, primary/blue background, white text
- AI messages: left-aligned, muted/gray background, dark text
- Auto-scrolls to bottom on new messages
- Streaming text renders incrementally (word by word)
- Uses shadcn `ScrollArea` for smooth scrolling

---

#### 3d. MessageInput (`components/chat/MessageInput.tsx`)

**Purpose**: Text input with send button.

**Behavior**:
- Input field + Send button (arrow icon)
- Enter key sends (Shift+Enter for newline)
- Disabled while AI is generating a response
- Placeholder: "Ask about {domain}..."

---

### Step 4: Wire Into the App

**File modified**: `app/bookmarks/page.tsx`

**Change**: Add the `<ChatBubble>` component to the page, passing the bookmarks list.

```tsx
// At the bottom of the page JSX, before closing tags:
<ChatBubble bookmarks={bookmarks} collections={collections} />
```

The ChatBubble manages its own state internally (open/closed, selected site, messages).

---

## File Summary

### New Files (7)

| File                                | Lines (est.) | Purpose                          |
| ----------------------------------- | ------------ | -------------------------------- |
| `lib/fetchSiteContent.ts`           | ~40          | Jina Reader content fetcher      |
| `app/api/chat/route.ts`             | ~45          | Streaming chat API endpoint      |
| `components/chat/ChatBubble.tsx`    | ~50          | Floating chat button             |
| `components/chat/ChatPanel.tsx`     | ~150         | Main chat panel (3 states)       |
| `components/chat/MessageList.tsx`   | ~60          | Message rendering                |
| `components/chat/MessageInput.tsx`  | ~40          | Input field with send            |
| `AI_CHATBOT_SETUP.md`              | —            | This file                        |

### Modified Files (2)

| File                      | Change                                     |
| ------------------------- | ------------------------------------------ |
| `app/bookmarks/page.tsx`  | Add `<ChatBubble>` component               |
| `.env.local`              | Add `GOOGLE_GENERATIVE_AI_API_KEY`         |

### Total: ~385 lines of new code

---

## User Flow

```
1. User clicks 💬 icon (bottom-right)

2. Panel slides up:
   ┌─────────────────────────────┐
   │  AI Chat              ✕    │
   ├─────────────────────────────┤
   │                             │
   │  Select a bookmark to       │
   │  chat about:               │
   │                             │
   │  ┌─────────────────────┐   │
   │  │ Choose a site...  ▼ │   │
   │  └─────────────────────┘   │
   │                             │
   │  ⏳ Temporary chat          │
   │  Messages are not saved     │
   └─────────────────────────────┘

3. User selects "GitHub - github.com"

4. Loading state:
   ┌─────────────────────────────┐
   │  AI Chat              ✕    │
   ├─────────────────────────────┤
   │                             │
   │      Reading github.com...  │
   │      ◌ (spinner)            │
   │                             │
   └─────────────────────────────┘

5. Chat active:
   ┌─────────────────────────────┐
   │ 🌐 github.com  Temporary ✕ │
   ├─────────────────────────────┤
   │                             │
   │  🤖 I've read github.com.  │
   │     What would you like     │
   │     to know?                │
   │                             │
   │            What features  👤│
   │            does GitHub      │
   │            offer?           │
   │                             │
   │  🤖 Based on the website,  │
   │     GitHub offers...        │
   │     • Repositories          │
   │     • Pull Requests         │
   │     • Actions (CI/CD)       │
   │     • ...                   │
   │                             │
   ├─────────────────────────────┤
   │ Ask about github.com...  ➤ │
   └─────────────────────────────┘

6. Off-topic question:
   │            What's the     👤│
   │            weather today?   │
   │                             │
   │  🤖 I can only answer       │
   │     questions about         │
   │     github.com. Try asking  │
   │     about the site's        │
   │     features or content!    │

7. User clicks ✕ → panel closes, all messages cleared
```

---

## Cost & Limits

| Resource          | Free Tier Limit              | Notes                        |
| ----------------- | ---------------------------- | ---------------------------- |
| Gemini 2.0 Flash  | 15 RPM, 1M tokens/min, 1,500 req/day | More than enough for personal use |
| Jina AI Reader    | Unlimited (fair use)         | No API key required          |
| Supabase          | Zero additional cost         | Chat is not stored in DB     |

---

## Security Notes

- `GOOGLE_GENERATIVE_AI_API_KEY` is **server-side only** (no `NEXT_PUBLIC_` prefix)
- The API route runs on the server — the key is never exposed to the browser
- Website content is fetched server-side — no CORS issues
- Chat messages exist only in React state — nothing persisted
- The system prompt restricts AI to the selected website only

---

## Future Enhancements (Optional)

1. **Chat History**: Save conversations to Supabase for reference
2. **Multi-site Context**: Chat about multiple bookmarks simultaneously
3. **Summary Mode**: One-click "Summarize this site" button
4. **Key Points Extraction**: Auto-extract bullet points from a site
5. **Site Comparison**: "Compare these two bookmarked sites"
6. **Export Chat**: Copy/download conversation as markdown
7. **Custom System Prompts**: Let users customize the AI's behavior

---

**Status**: Ready for implementation  
**Estimated Time**: ~1-2 hours  
**Dependencies**: `npm install ai @ai-sdk/google`  
**Required**: Google Gemini API key in `.env.local`
