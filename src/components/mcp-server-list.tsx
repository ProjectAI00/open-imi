"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Plus, Trash2, Edit, FlaskConical } from "lucide-react";
import { Button } from "./ui/button";
import { selectMcpClientsAction, removeMcpClientAction, connectMcpClientAction, disconnectMcpClientAction } from "@/app/api/mcp/actions";
import { handleErrorWithToast } from "ui/shared-toast";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function MCPServerList() {
  const router = useRouter();
  const { data: mcpList, isLoading, mutate } = useSWR(
    "mcp-list",
    selectMcpClientsAction,
    {
      refreshInterval: 5000,
      fallbackData: [],
      onError: handleErrorWithToast,
    }
  );

  const [refreshing, setRefreshing] = useState(false);
  const [processingServers, setProcessingServers] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await mutate();
    } catch (error) {
      handleErrorWithToast(error as Error, "refresh-error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleConnection = useCallback(async (serverName: string, isConnected: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingServers(prev => new Set(prev).add(serverName));
    
    try {
      if (isConnected) {
        await disconnectMcpClientAction(serverName);
      } else {
        await connectMcpClientAction(serverName);
      }
      await mutate();
    } catch (error) {
      handleErrorWithToast(error as Error, "connection-toggle-error");
    } finally {
      setProcessingServers(prev => {
        const newSet = new Set(prev);
        newSet.delete(serverName);
        return newSet;
      });
    }
  }, [mutate]);

  const navigateToServer = (name: string) => {
    router.push(`/mcp/server/${encodeURIComponent(name)}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">MCP Server Settings</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add MCP Server
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Manage your Model Context Protocol (MCP) server connections
        </p>
        
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">MCP Server Settings</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/mcp/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add MCP Server
            </Button>
          </Link>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Manage your Model Context Protocol (MCP) server connections
      </p>
      
      <div className="space-y-3">
        {mcpList.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No MCP servers configured</p>
            <Link href="/mcp/create">
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add your first MCP server
              </Button>
            </Link>
          </div>
        ) : (
          mcpList.map((server) => (
            <div 
              key={server.name}
              onClick={() => navigateToServer(server.name)}
              className="flex items-center justify-between p-4 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <StatusIndicator status={server.status} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{server.name}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <ServerTypeIndicator config={server.config} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <Switch
                    id={`server-switch-${server.name}`}
                    checked={server.status === 'connected'}
                    disabled={processingServers.has(server.name) || server.status === 'loading'}
                    onCheckedChange={(checked) => {}}
                    onClick={(e) => handleToggleConnection(server.name, server.status === 'connected', e)}
                    className="mr-1"
                  />
                  <Label
                    htmlFor={`server-switch-${server.name}`}
                    className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {processingServers.has(server.name) ? (
                      <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                    ) : null}
                    {server.status === 'connected' ? "Enabled" : "Disabled"}
                  </Label>
                </div>
                <ConnectionStatusBadge status={server.status} />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/mcp/test/${encodeURIComponent(server.name)}`);
                      }}
                    >
                      <FlaskConical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Test tools</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/mcp/modify/${encodeURIComponent(server.name)}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit configuration</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete the MCP server "${server.name}"?`)) {
                          try {
                            await removeMcpClientAction(server.name);
                            await mutate();
                          } catch (error) {
                            handleErrorWithToast(error as Error, "delete-error");
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete server</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
        <div className="h-2 w-2 bg-white rounded-full"></div>
      </div>
    );
  } else if (status === "loading") {
    return (
      <div className="h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
        <Loader2 className="h-2 w-2 text-white animate-spin" />
      </div>
    );
  } else {
    return (
      <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
        <AlertCircle className="h-2 w-2 text-white" />
      </div>
    );
  }
}

function ConnectionStatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
  } else if (status === "loading") {
    return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Connecting...</Badge>;
  } else {
    return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
  }
}

function ServerTypeIndicator({ config }: { config: any }) {
  let type = "Unknown";
  let detail = "";
  
  if (config) {
    if (config.command) {
      type = "CLI";
      detail = config.command;
    } else if (config.url) {
      type = "SSE";
      detail = config.url;
    }
  }
  
  return (
    <div className="text-xs text-muted-foreground">
      <span className="capitalize">{type}</span>
      {detail && ` • ${detail}`}
    </div>
  );
} 