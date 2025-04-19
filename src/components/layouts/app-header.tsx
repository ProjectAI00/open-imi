"use client";

import { useSidebar } from "ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { Toggle } from "ui/toggle";
import { ChevronDown, MoonStar, PanelLeft, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { Separator } from "ui/separator";

import { useMemo } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { ThreadDropdown } from "../thread-dropdown";
import { appStore } from "@/app/store";
import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-50 flex items-center px-2 py-1 bg-background/20 backdrop-blur-sm border-b border-dashed">
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="ml-auto"
      >
        {isMounted && icon}
      </Button>
    </header>
  );
}
