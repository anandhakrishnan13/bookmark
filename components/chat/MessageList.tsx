'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User } from 'lucide-react'
import type { UIMessage } from 'ai'

interface MessageListProps {
  messages: UIMessage[]
  isStreaming?: boolean | undefined
}

function getMessageText(message: UIMessage): string {
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
      .map((part) => part.text)
      .join('')
  }
  return ''
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
          <Bot className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">Ask me anything about this site</p>
          <p className="text-xs mt-1 opacity-70">I&apos;ve read the page and I&apos;m ready to help</p>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user'
          const text = getMessageText(message)

          return (
            <div
              key={message.id}
              className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {text || (isStreaming && message.role === 'assistant' ? (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
                  </span>
                ) : null)}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
