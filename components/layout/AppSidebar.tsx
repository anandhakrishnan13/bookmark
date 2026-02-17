"use client"

import * as React from "react"
import { Bookmark, Plus, Folder, Trash2, Star, Clock, Tag, MoreHorizontal } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Collection {
  id: string
  name: string
  icon: React.ElementType
  count: number
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onAddCollection?: () => void
}

export function AppSidebar({ onAddCollection, ...props }: AppSidebarProps) {
  const defaultCollections: Collection[] = [
    { id: "all", name: "All Bookmarks", icon: Bookmark, count: 6 },
    { id: "favorites", name: "Favorites", icon: Star, count: 0 },
    { id: "recent", name: "Recent", icon: Clock, count: 6 },
    { id: "trash", name: "Trash", icon: Trash2, count: 0 },
  ]

  const userCollections: Collection[] = [
    { id: "work", name: "Work", icon: Folder, count: 2 },
    { id: "personal", name: "Personal", icon: Folder, count: 3 },
    { id: "learning", name: "Learning", icon: Folder, count: 1 },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bookmark className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Smart Bookmarks</span>
                  <span className="text-xs text-muted-foreground">Your collection</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Default Collections */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {defaultCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton asChild>
                    <button className="w-full">
                      <collection.icon className="size-4" />
                      <span>{collection.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {collection.count}
                      </span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Collections */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Collections</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onAddCollection}
            >
              <Plus className="size-3" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton asChild>
                    <button className="w-full">
                      <collection.icon className="size-4" />
                      <span>{collection.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {collection.count}
                      </span>
                    </button>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem>
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button className="w-full">
                    <Tag className="size-4" />
                    <span>Development</span>
                    <span className="ml-auto text-xs text-muted-foreground">4</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button className="w-full">
                    <Tag className="size-4" />
                    <span>Design</span>
                    <span className="ml-auto text-xs text-muted-foreground">2</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>6 bookmarks • 3 collections</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
