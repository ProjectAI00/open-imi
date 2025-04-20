"use client";

import { useSidebar } from "ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { Toggle } from "ui/toggle";
import { ChevronDown, MessageCircle, MoonStar, PanelLeft, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import Link from "next/link";

import { useMemo, useCallback } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { ThreadDropdown } from "../thread-dropdown";
import { appStore } from "@/app/store";
import { usePathname, useRouter } from "next/navigation";
import { generateUUID } from "lib/utils";

function ThreadDropdownComponent() {
  const currentThread = appStore((state) => state.getCurrentThread());
  if (!currentThread) return null;
  return (
    <ThreadDropdown
      threadId={currentThread.id}
      beforeTitle={currentThread.title}
    >
      <div className="text-sm  text-muted-foreground hover:text-foreground cursor-pointer flex gap-1 items-center px-2 py-1 rounded-md hover:bg-accent">
        {currentThread.title}
        <ChevronDown size={14} />
      </div>
    </ThreadDropdown>
  );
}

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const currentPaths = usePathname();
  const router = useRouter();

  const handleNewChat = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Navigeren naar homepagina met unieke query parameter om refresh te forceren
    router.push(`/?new=${generateUUID()}`);
  }, [router]);

  const componentByPage = useMemo(() => {
    if (currentPaths.startsWith("/chat/")) {
      return <ThreadDropdownComponent />;
    }
  }, [currentPaths]);

  const isMounted = useMounted();

  const icon = useMemo(() => {
    return theme === "dark" ? <Sun /> : <MoonStar />;
  }, [theme]);

  return (
    <header className="sticky top-0 z-50 flex items-center px-2 py-1 bg-background/20 backdrop-blur-sm border-b">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle aria-label="Toggle italic" onClick={toggleSidebar}>
              <PanelLeft />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent align="start" side="bottom">
            <p>Toggle Sidebar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {componentByPage && (
        <>
          <div className="w-1 h-4">
            <Separator orientation="vertical" />
          </div>
          {componentByPage}
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleNewChat}
        >
          <MessageCircle size={16} />
          <span>New Chat</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isMounted && icon}
        </Button>
      </div>
    </header>
  );
}
