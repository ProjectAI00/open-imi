"use client";

import { SidebarMenuSub } from "ui/sidebar";
import Link from "next/link";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubItem,
} from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import { ThreadDropdown } from "../thread-dropdown";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { ChatThread } from "app-types/chat";
import { useMounted } from "@/hooks/use-mounted";
import { appStore } from "@/app/store";
import { useState } from "react";
import { cn } from "lib/utils";

export function AppSidebarThreads({
  isLoading,
  threadList,
}: { isLoading: boolean; threadList: ChatThread[] }) {
  const mounted = useMounted();
  const currentThreadId = appStore((state) => state.currentThreadId);
  const [isOpen, setIsOpen] = useState(true);

  const toggleThreads = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex justify-between items-center" onClick={toggleThreads}>
              <h4 className="text-xs text-muted-foreground">Recent Chats</h4>
              <span className="text-xs text-muted-foreground">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </SidebarMenuButton>

            <div className={cn(isOpen ? "block" : "hidden")}>
              {isLoading ? (
                Array.from({ length: 12 }).map(
                  (_, index) => mounted && <SidebarMenuSkeleton key={index} />,
                )
              ) : threadList?.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                </div>
              ) : (
                threadList?.map((thread) => (
                  <SidebarMenuSub key={thread.id} className={"group/thread mr-0"}>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        asChild
                        isActive={currentThreadId === thread.id}
                      >
                        <Link
                          href={`/chat/${thread.id}`}
                          className="flex items-center"
                        >
                          <p className="truncate ">{thread.title}</p>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction className="opacity-0 group-hover/thread:opacity-100">
                        <ThreadDropdown
                          threadId={thread.id}
                          beforeTitle={thread.title}
                        >
                          <MoreHorizontal />
                        </ThreadDropdown>
                      </SidebarMenuAction>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ))
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
