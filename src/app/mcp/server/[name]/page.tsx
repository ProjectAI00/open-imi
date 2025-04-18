"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { MCPCard } from "@/components/mcp-card";
import { selectMcpClientsAction } from "@/app/api/mcp/actions";
import useSWR from "swr";
import { Skeleton } from "ui/skeleton";
import { handleErrorWithToast } from "ui/shared-toast";
import { ScrollArea } from "ui/scroll-area";

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serverName = decodeURIComponent(params.name as string);

  const { data: mcpList, isLoading } = useSWR(
    "mcp-list",
    selectMcpClientsAction,
    {
      refreshInterval: 5000,
      fallbackData: [],
      onError: handleErrorWithToast,
    }
  );

  const serverInfo = mcpList?.find((server) => server.name === serverName);

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 relative flex flex-col gap-4 px-8 py-8 max-w-3xl h-full mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/mcp")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to MCP Settings
          </Button>
          
          <div className="flex-1" />
          
          <h2 className="text-xl font-bold">
            {isLoading ? "Loading..." : serverInfo ? serverInfo.name : "Not Found"}
          </h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : serverInfo ? (
          <MCPCard {...serverInfo} />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium">Server not found</h3>
            <p className="text-muted-foreground mt-2">
              The requested MCP server "{serverName}" could not be found.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/mcp")}
            >
              Go back to server list
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
} 