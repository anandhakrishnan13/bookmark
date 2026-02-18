"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./ChatPanel";
import type { Bookmark } from "@/utils/types";

interface ChatBubbleProps {
  bookmarks: Bookmark[];
}

export function ChatBubble({ bookmarks }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Show hint bubble after 2 seconds, persist until user clicks
  useEffect(() => {
    if (open || hintDismissed) return;
    const showTimer = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(showTimer);
  }, [open, hintDismissed]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className="w-[380px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <ChatPanel bookmarks={bookmarks} onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Hint Popup */}
      {showHint && !open && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1 mr-1">
          <div className="relative bg-foreground text-background text-sm font-medium pl-4 pr-2 py-2 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
            Ask AI about saved bookmarks
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(false);
                setHintDismissed(true);
              }}
              className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-background/20 transition-colors"
              aria-label="Dismiss hint"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-foreground rotate-45 rounded-sm" />
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => {
          setOpen((prev) => !prev);
          setShowHint(false);
          setHintDismissed(true);
        }}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
