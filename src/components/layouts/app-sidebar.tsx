"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "ui/sidebar";
import useSWR from "swr";

import Link from "next/link";
import { appStore } from "@/app/store";
import { useEffect } from "react";
import { getStorageManager } from "lib/browser-stroage";
import { useShallow } from "zustand/shallow";
import { Triangle } from "lucide-react";

import { handleErrorWithToast } from "ui/shared-toast";
import { selectThreadListByUserIdAction } from "@/app/api/chat/actions";
import { cn } from "lib/utils";
import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { AppSidebarUser } from "./app-sidebar-user";
import { MCPIcon } from "ui/mcp-icon";
const browserSidebarStorage = getStorageManager<boolean>("sidebar_state");

export function AppSidebar() {
  const { open } = useSidebar();

  const [storeMutate, user] = appStore(
    useShallow((state) => [state.mutate, state.user]),
  );

  const { data: threadList, isLoading } = useSWR(
    "threads",
    selectThreadListByUserIdAction,
    {
      onError: handleErrorWithToast,
      fallbackData: [],
    },
  );

  useEffect(() => {
    storeMutate({ threadList: threadList ?? [] });
  }, [threadList]);

  useEffect(() => {
    browserSidebarStorage.set(open);
  }, [open]);

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-0.5">
            <SidebarMenuButton asChild>
              <Link href="/">
                <MCPIcon className="size-4 fill-foreground" />
                <h4 className="font-bold">mcp/chat-bot</h4>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-6">
        <AppSidebarMenus isOpen={open} />
        <div className={cn(!open && "hidden", "w-full px-4 mt-4")}>
          <div className="w-full h-1 border-t border-dashed" />
        </div>
        <AppSidebarThreads isLoading={isLoading} threadList={threadList} />
      </SidebarContent>
      <SidebarFooter className="border-t border-dashed">
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
