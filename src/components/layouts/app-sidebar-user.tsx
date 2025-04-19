import { SidebarMenuButton } from "ui/sidebar";
import { SidebarMenuItem } from "ui/sidebar";
import { SidebarMenu } from "ui/sidebar";
import { cn } from "@/lib/utils";
import { User } from "app-types/user";

export function AppSidebarUser({ user }: { user: User }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton className="pointer-events-none">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
            IMI
          </div>
          <span className="text-xs text-muted-foreground ml-2">Local Version</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
