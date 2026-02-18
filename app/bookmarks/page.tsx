"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCollections } from "@/hooks/useCollections";
import { useBookmarkCounts } from "@/hooks/useBookmarkCounts";
import { useRealtimeBookmarks } from "@/hooks/useRealtimeBookmarks";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BookmarkList } from "@/components/BookmarkList";
import { AddBookmark } from "@/components/AddBookmark";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Menu,
  ArrowUpDown,
  Link as LinkIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import { isValidUrl } from "@/utils/validators";

type ActiveFilter = "all" | "favorites" | "recent" | "trash" | string;
type SortBy = "date-desc" | "date-asc" | "alpha-asc" | "alpha-desc";
type ViewMode = "grid" | "list";

export default function BookmarksPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const userId = user?.id ?? null;

  // Filter state
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);

  // Data hooks
  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    moveToCollection,
    refetch: refetchBookmarks,
  } = useBookmarks(userId, activeFilter);

  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    renameCollection,
    deleteCollection,
    getBookmarkCount,
  } = useCollections(userId ?? undefined);

  const { counts, refetchCounts } = useBookmarkCounts(userId);

  // Realtime subscription - refetch both bookmarks and counts on changes
  const handleRealtimeRefetch = useCallback(() => {
    refetchBookmarks();
    refetchCounts();
  }, [refetchBookmarks, refetchCounts]);

  useRealtimeBookmarks({
    userId,
    onRefetch: handleRealtimeRefetch,
  });

  // Compute collection counts
  const [collectionCounts, setCollectionCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    async function loadCollectionCounts() {
      const countsMap: Record<string, number> = {};
      for (const collection of collections) {
        countsMap[collection.id] = await getBookmarkCount(collection.id);
      }
      setCollectionCounts(countsMap);
    }
    if (collections.length > 0) {
      loadCollectionCounts();
    } else {
      setCollectionCounts({});
    }
  }, [collections, getBookmarkCount]);

  // Filter bookmarks by search query, then sort
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "date-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "date-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "alpha-asc":
        sorted.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        );
        break;
      case "alpha-desc":
        sorted.sort((a, b) =>
          b.title.localeCompare(a.title, undefined, { sensitivity: "base" })
        );
        break;
    }

    return sorted;
  }, [bookmarks, searchQuery, sortBy]);

  // Heading based on active filter
  const heading = useMemo(() => {
    switch (activeFilter) {
      case "all":
        return "All Bookmarks";
      case "favorites":
        return "Favorites";
      case "recent":
        return "Recent";
      case "trash":
        return "Trash";
      default: {
        const collection = collections.find((c) => c.id === activeFilter);
        return collection ? collection.name : "Bookmarks";
      }
    }
  }, [activeFilter, collections]);

  const isTrashView = activeFilter === "trash";

  // Determine if current filter is a collection ID
  const activeCollectionId = useMemo(() => {
    if (
      activeFilter !== "all" &&
      activeFilter !== "favorites" &&
      activeFilter !== "recent" &&
      activeFilter !== "trash"
    ) {
      return activeFilter;
    }
    return null;
  }, [activeFilter]);

  // Handle adding bookmark - auto-assign to current collection if viewing one
  const handleAddBookmark = useCallback(
    async (
      title: string,
      url: string,
      collectionId?: string | null
    ): Promise<{ success: boolean; error?: string | undefined }> => {
      const resolvedCollectionId = collectionId ?? activeCollectionId;
      return addBookmark(title, url, resolvedCollectionId ?? undefined);
    },
    [addBookmark, activeCollectionId]
  );

  // Handle delete (soft delete for normal view)
  const handleDelete = useCallback(
    async (id: string) => {
      if (isTrashView) {
        await permanentDelete(id);
      } else {
        await moveToTrash(id);
      }
      refetchCounts();
    },
    [isTrashView, permanentDelete, moveToTrash, refetchCounts]
  );

  const handleToggleFavorite = useCallback(
    async (id: string, _currentState: boolean) => {
      await toggleFavorite(id);
      refetchCounts();
    },
    [toggleFavorite, refetchCounts]
  );

  const handleRestore = useCallback(
    async (id: string) => {
      await restoreFromTrash(id);
      refetchCounts();
    },
    [restoreFromTrash, refetchCounts]
  );

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      await permanentDelete(id);
      refetchCounts();
    },
    [permanentDelete, refetchCounts]
  );

  const handleMoveToCollection = useCallback(
    async (bookmarkId: string, collectionId: string | null) => {
      await moveToCollection(bookmarkId, collectionId);
      refetchBookmarks();
      refetchCounts();
    },
    [moveToCollection, refetchBookmarks, refetchCounts]
  );

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
    setSearchQuery("");
    setMobileMenuOpen(false);
  }, []);

  // Sort label for button
  const sortLabel = useMemo(() => {
    switch (sortBy) {
      case "date-desc":
        return "Newest first";
      case "date-asc":
        return "Oldest first";
      case "alpha-asc":
        return "A \u2192 Z";
      case "alpha-desc":
        return "Z \u2192 A";
    }
  }, [sortBy]);

  // Drag-and-drop state and handlers
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const extractUrlFromDrop = useCallback((e: React.DragEvent): string | null => {
    // Firefox tab drag: "url\ntitle" format
    const mozUrl = e.dataTransfer.getData('text/x-moz-url');
    if (mozUrl) {
      const url = mozUrl.split('\n')[0]?.trim();
      if (url && isValidUrl(url)) return url;
    }
    // Chrome/Edge tab drag and dragged links
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      const firstUrl = uriList.split('\n').find(line => !line.startsWith('#') && line.trim());
      if (firstUrl && isValidUrl(firstUrl.trim())) return firstUrl.trim();
    }
    // Address bar drag / plain text URL
    const text = e.dataTransfer.getData('text/plain');
    if (text && isValidUrl(text.trim())) return text.trim();
    return null;
  }, []);

  const extractTitleFromDrop = useCallback((e: React.DragEvent, url: string): string => {
    // Try to get link text from HTML data
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/<a[^>]*>([^<]+)<\/a>/i);
      const linkText = match?.[1];
      if (linkText?.trim()) return linkText.trim();
    }
    // Fallback: derive from URL
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/\/$/, '');
      if (path && path !== '/') {
        return decodeURIComponent(path.split('/').pop() || parsed.hostname);
      }
      return parsed.hostname;
    } catch {
      return url;
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('text/x-moz-url') || e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/plain')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    const url = extractUrlFromDrop(e);
    if (!url) return;

    const title = extractTitleFromDrop(e, url);
    await handleAddBookmark(title, url);
  }, [extractUrlFromDrop, extractTitleFromDrop, handleAddBookmark]);

  // Sidebar component (shared between desktop and mobile)
  const sidebarContent = (
    <AppSidebar
      userEmail={user?.email ?? undefined}
      onSignOut={signOut}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      collections={collections}
      collectionCounts={collectionCounts}
      navCounts={counts}
      collectionsLoading={collectionsLoading}
      onCreateCollection={createCollection}
      onRenameCollection={renameCollection}
      onDeleteCollection={deleteCollection}
    />
  );

  // Not authenticated - redirect to login page
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-border">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

        {/* Top Bar */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* Page heading */}
          <h1 className="text-xl font-semibold truncate mt-3.5 mb-3.5">{heading}</h1>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden lg:inline">{sortLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-white dark:bg-zinc-900 text-black dark:text-white shadow-lg rounded-lg"
            >
              <DropdownMenuItem
                onClick={() => setSortBy("date-desc")}
                className={sortBy === "date-desc" ? "bg-accent" : ""}
              >
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("date-asc")}
                className={sortBy === "date-asc" ? "bg-accent" : ""}
              >
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("alpha-asc")}
                className={sortBy === "alpha-asc" ? "bg-accent" : ""}
              >
                A &rarr; Z
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("alpha-desc")}
                className={sortBy === "alpha-desc" ? "bg-accent" : ""}
              >
                Z &rarr; A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Bookmark - hidden in trash view */}
          {!isTrashView && (
            <AddBookmark
              onAdd={handleAddBookmark}
              collections={collections}
              defaultCollectionId={activeCollectionId ?? undefined}
              hideCollectionSelector={activeCollectionId !== null}
              open={addBookmarkOpen}
              onOpenChange={setAddBookmarkOpen}
            />
          )}
        </header>

        {/* Bookmark list with drag-and-drop zone */}
        <div
          className={`flex-1 overflow-auto p-4 md:p-6 relative transition-all ${
            isDraggingOver ? 'border-2 border-dashed border-primary rounded-xl bg-primary/5' : 'border-2 border-transparent'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDraggingOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl pointer-events-none">
              <LinkIcon className="h-10 w-10 text-primary" />
              <p className="text-base font-semibold text-primary">Drop link to bookmark it</p>
            </div>
          )}
          <BookmarkList
            bookmarks={filteredBookmarks}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onMoveToCollection={handleMoveToCollection}
            collections={collections}
            loading={bookmarksLoading}
            isTrashView={isTrashView}
            viewMode={viewMode}
            showAddButton={!searchQuery && !isTrashView && activeFilter !== 'recent'}
            onAddBookmark={() => setAddBookmarkOpen(true)}
            emptyMessage={
              searchQuery
                ? "No bookmarks match your search."
                : isTrashView
                ? "Trash is empty."
                : activeFilter === "favorites"
                ? "No favorite bookmarks yet. Star some bookmarks to see them here."
                : activeFilter === "recent"
                ? "No recent bookmarks."
                : "No bookmarks yet."
            }
          />
        </div>
      </main>

      {/* AI Chat Bubble */}
      <ChatBubble bookmarks={bookmarks} />
    </div>
  );
}
