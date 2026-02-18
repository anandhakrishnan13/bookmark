# AI Chatbot Feature - Implementation Summary

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

| Component        | Technology                              | Reason                                              |
| ---------------- | --------------------------------------- | --------------------------------------------------- |
| LLM              | Google Gemini 2.0 Flash                 | Free tier (1,500 req/day), fast, large context      |
| AI Framework     | Vercel AI SDK (`ai` + `@ai-sdk/google`) | Built-in `useChat` hook, streaming, Next.js native  |
| Content Fetching | Jina AI Reader                          | Free, returns clean markdown, no API key needed     |
| UI               | shadcn/ui + Tailwind CSS                | Consistent with existing app design                 |

---

## Files Created

### New Files (7)

| File                                | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `lib/fetchSiteContent.ts`           | Jina Reader content fetcher      |
| `app/api/chat/route.ts`             | Streaming chat API endpoint      |
| `components/chat/ChatBubble.tsx`    | Floating chat button             |
| `components/chat/ChatPanel.tsx`     | Main chat panel (3 states)       |
| `components/chat/MessageList.tsx`   | Message rendering                |
| `components/chat/MessageInput.tsx`  | Input field with send            |
| `AI_CHATBOT_SETUP.md`               | This file                        |

### Modified Files (2)

| File                      | Change                                     |
| ------------------------- | ------------------------------------------ |
| `app/bookmarks/page.tsx`  | Add `<ChatBubble>` component               |
| `.env`                    | Add `GOOGLE_GENERATIVE_AI_API_KEY`         |

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
   │  chat about:                │
   │                             │
   │  ┌─────────────────────┐    │
   │  │ Choose a site...  ▼ │    │
   │  └─────────────────────┘    │
   │                             │
   │  ⏳ Temporary chat         │
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
   ┌─────────────────────────────┐
   │            What's the     👤│
   │            weather today?   │
   │                             │
   │  🤖 I can only answer       │
   │     questions about         │
   │     github.com. Try asking  │
   │     about the site's        │
   │     features or content!    │
   └─────────────────────────────┘

7. User clicks ✕ → panel closes, all messages cleared
```
