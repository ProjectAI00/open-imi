import { TooltipContent } from "ui/tooltip";
import { SidebarMenuButton } from "ui/sidebar";
import { Tooltip, TooltipTrigger } from "ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";
import { cn } from "lib/utils";
import { SidebarGroup } from "ui/sidebar";
import { TooltipProvider } from "ui/tooltip";
import Link from "next/link";
import { Library, MessageCircleDashed } from "lucide-react";

export function AppSidebarMenus({ isOpen }: { isOpen: boolean }) {
  return (
    <SidebarGroup className={cn(isOpen && "px-4")}>
      <SidebarGroupContent>
        <SidebarMenu className="mb-3">
          <TooltipProvider>
            <Tooltip>
              <SidebarMenuItem>
                <Link href="/">
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        isOpen && "flex  justify-center ",
                        "border border-dashed border-ring/80 font-semibold",
                      )}
                    >
                      <MessageCircleDashed />
                      New Chat
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>New Chat</p>
                  </TooltipContent>
                </Link>
              </SidebarMenuItem>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenu>
        <SidebarMenu>
          <TooltipProvider>
            <Tooltip>
              <SidebarMenuItem>
                <Link href="/mcp">
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      // isActive
                      className={cn(
                        isOpen &&
                          "flex justify-center font-semibold bg-primary text-primary-foreground",
                      )}
                    >
                      {!isOpen && <Library />}
                      MCP Configuration
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>MCP Configuration</p>
                  </TooltipContent>
                </Link>
              </SidebarMenuItem>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
