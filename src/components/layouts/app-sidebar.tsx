"use client";

import {
  Sidebar,
  SidebarContent,
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
import { News, NewsArticle } from "@/components/ui/sidebar-news";
import { MCPIcon } from "ui/mcp-icon";
import Image from "next/image";
const browserSidebarStorage = getStorageManager<boolean>("sidebar_state");

// De drie slides
const newsArticles: NewsArticle[] = [
  {
    href: "https://github.com/ProjectAI00/open-imi",
    title: "Support us on GitHub",
    summary: "Star our repository and contribute to the open-imi project",
    image: "/images/github-logo.svg"
  },
  {
    href: "https://imi.vercel.app",
    title: "Visit our website",
    summary: "Check out the official IMI website for more information",
    image: "/images/imi logo.jpg"
  },
  {
    href: "https://tally.so/r/mVNK5l",
    title: "Join our waitlist",
    summary: "Be the first to know when we launch new features",
    image: "/images/waitlist.svg"
  }
];

export function AppSidebar() {
  const { open } = useSidebar();

  const [storeMutate] = appStore(
    useShallow((state) => [state.mutate]),
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
                <Image 
                  src="/images/imi logo.jpg" 
                  alt="IMI Logo" 
                  width={24} 
                  height={24} 
                  className="rounded-sm mr-2"
                />
                <h4 className="font-serif text-lg tracking-wide">IMI</h4>
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
      
      {/* Nieuws component toegevoegd */}
      <div className={cn(open ? "block" : "hidden", "mt-auto")}>
        <div className="mb-2 px-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">IMI Project</h4>
          <News articles={newsArticles} />
        </div>
      </div>
    </Sidebar>
  );
}
