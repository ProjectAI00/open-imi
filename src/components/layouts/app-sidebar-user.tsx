import { DropdownMenuItem } from "ui/dropdown-menu";
import { DropdownMenuContent } from "ui/dropdown-menu";
import { AvatarFallback } from "ui/avatar";
import { AvatarImage } from "ui/avatar";
import { SidebarMenuButton } from "ui/sidebar";
import { DropdownMenuTrigger } from "ui/dropdown-menu";
import { DropdownMenu } from "ui/dropdown-menu";
import { SidebarMenuItem } from "ui/sidebar";
import { SidebarMenu } from "ui/sidebar";
import { Avatar } from "ui/avatar";
import { ChevronUp } from "lucide-react";
import { notImplementedToast } from "ui/shared-toast";
import { User } from "app-types/user";

export function AppSidebarUser({ user }: { user: User }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <Avatar className="border size-5">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {user.email}
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-full">
            <DropdownMenuItem onClick={notImplementedToast}>
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={notImplementedToast}>
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={notImplementedToast}>
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
