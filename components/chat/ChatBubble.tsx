"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./ChatPanel";
import type { Bookmark } from "@/utils/types";

interface ChatBubbleProps {
  bookmarks: Bookmark[];
}

export function ChatBubble({ bookmarks }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className="w-[380px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <ChatPanel bookmarks={bookmarks} onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setOpen((prev) => !prev)}
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
