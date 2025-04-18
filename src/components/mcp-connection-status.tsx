"use client";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import useSWR from "swr";
import { selectMcpClientsAction } from "@/app/api/mcp/actions";

export function MCPConnectionStatus() {
  const { data: mcpList, isLoading } = useSWR(
    "mcp-list",
    selectMcpClientsAction,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      fallbackData: [],
    }
  );

  // Calculate connection status
  const [showAlert, setShowAlert] = useState(true);
  
  const totalServers = mcpList?.length || 0;
  const connectedServers = mcpList?.filter(mcp => mcp.status === 'connected').length || 0;
  const failedServers = mcpList?.filter(mcp => mcp.status !== 'connected' && mcp.status !== 'loading').length || 0;
  const connectingServers = totalServers - connectedServers - failedServers;
  
  const isConnecting = connectingServers > 0;
  const hasFailures = failedServers > 0;

  // Auto-hide the alert after 10 seconds if all servers are connected or failed
  useEffect(() => {
    if (!isConnecting && showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnecting, showAlert]);

  // If no servers or all servers connected and alert dismissed
  if (totalServers === 0 || (connectedServers === totalServers && !showAlert)) {
    return null;
  }

  return (
    <div className="mb-4">
      {showAlert && (
        <Alert variant={hasFailures ? "destructive" : isConnecting ? "default" : "default"} className="relative">
          <div className="flex items-center gap-2">
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : hasFailures ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            
            <AlertDescription>
              {isConnecting ? (
                <span>
                  Connecting to MCP servers... 
                  <Badge variant="outline" className="ml-2">
                    {connectedServers} / {totalServers} connected
                  </Badge>
                </span>
              ) : hasFailures ? (
                <span>
                  Some MCP servers failed to connect 
                  <Badge variant="outline" className="ml-2">
                    {connectedServers} / {totalServers} connected
                  </Badge>
                </span>
              ) : (
                <span>
                  All MCP servers connected successfully
                  <Badge variant="outline" className="ml-2">
                    {connectedServers} / {totalServers} connected
                  </Badge>
                </span>
              )}
            </AlertDescription>
          </div>
          
          <button
            onClick={() => setShowAlert(false)}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </Alert>
      )}
    </div>
  );
} 