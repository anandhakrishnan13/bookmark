'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Globe, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import type { Bookmark } from '@/utils/types'

type ChatState = 'select' | 'loading' | 'chatting'

interface ChatPanelProps {
  bookmarks: Bookmark[]
  onClose: () => void
}

export function ChatPanel({ bookmarks, onClose }: ChatPanelProps) {
  const [chatState, setChatState] = useState<ChatState>('select')
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)

  // Use a ref so the transport body function always reads the latest URL
  const siteUrlRef = useRef<string | null>(null)
  siteUrlRef.current = selectedBookmark?.url ?? null

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ siteUrl: siteUrlRef.current }),
      }),
    []
  )

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    experimental_throttle: 40,
    onError: (err) => {
      console.error('[ChatPanel] useChat error:', err)
    },
  })

  const isStreaming = status === 'streaming'

  const activeBookmarks = useMemo(
    () => bookmarks.filter((b) => !b.is_deleted),
    [bookmarks]
  )

  const getDomain = useCallback((url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }, [])

  const handleSelectSite = (bookmarkId: string) => {
    const bookmark = activeBookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark) return

    setSelectedBookmark(bookmark)
    setMessages([])
    setChatState('chatting')
  }

  const handleSendMessage = (text: string) => {
    if (!selectedBookmark) return
    sendMessage({ text })
  }

  const handleSwitchSite = () => {
    setSelectedBookmark(null)
    setMessages([])
    setChatState('select')
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground rounded-t-2xl shadow-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        {chatState !== 'select' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwitchSite}
            className="h-7 w-7 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          {chatState === 'select' ? (
            <h3 className="text-sm font-semibold">AI Chat</h3>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {selectedBookmark ? getDomain(selectedBookmark.url) : ''}
              </span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            Temporary chat — not saved
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      {chatState === 'select' && (
        <div className="flex-1 flex flex-col p-4 gap-4">
          <div className="flex flex-col items-center text-center pt-6 pb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-sm font-semibold">Chat with any bookmark</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Select a bookmarked site and ask questions about its content
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Select a bookmark
            </label>
            <Select onValueChange={handleSelectSite}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a site..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {activeBookmarks.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{bookmark.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {getDomain(bookmark.url)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeBookmarks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No bookmarks yet. Add some bookmarks first!
            </p>
          )}
        </div>
      )}

      {chatState === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Reading {selectedBookmark ? getDomain(selectedBookmark.url) : ''}...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a few seconds
            </p>
          </div>
        </div>
      )}

      {chatState === 'chatting' && (
        <>
          <MessageList messages={messages} isStreaming={isStreaming} />
          {error && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error.message?.includes('QUOTA_EXCEEDED')
                ? 'Token limit exceeded. Please try again later.'
                : 'Something went wrong. Please try again.'}
            </div>
          )}
          <MessageInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder={`Ask about ${selectedBookmark ? getDomain(selectedBookmark.url) : 'this site'}...`}
          />
        </>
      )}
    </div>
  )
}
