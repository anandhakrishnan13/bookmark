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
  const lastMessageLength = useRef(0)

  useEffect(() => {
    // Track text changes for smooth scrolling during streaming
    const lastMsg = messages[messages.length - 1]
    if (lastMsg) {
      const currentLen = getMessageText(lastMsg).length
      if (currentLen !== lastMessageLength.current) {
        lastMessageLength.current = currentLen
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming])

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
        {messages.map((message, index) => {
          const isUser = message.role === 'user'
          const text = getMessageText(message)
          const isLastAssistant = !isUser && index === messages.length - 1

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
                {text ? (
                  <>
                    {text}
                    {isStreaming && isLastAssistant && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-current animate-pulse" />
                    )}
                  </>
                ) : (isStreaming && message.role === 'assistant' ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.3s' }} />
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
