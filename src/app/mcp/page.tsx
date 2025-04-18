"use client";
import { MCPServerList } from "@/components/mcp-server-list";
import { ScrollArea } from "ui/scroll-area";

export default function Page() {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 relative flex flex-col gap-4 px-8 py-8 max-w-3xl h-full mx-auto">
        <MCPServerList />
      </div>
    </ScrollArea>
  );
}
