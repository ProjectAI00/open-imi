"use client";
import {
  ChevronRight,
  FlaskConical,
  Loader2,
  Pencil,
  RotateCw,
  Settings,
  Trash,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader } from "ui/card";
import JsonView from "ui/json-view";
import { Separator } from "ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { safe } from "ts-safe";

import { handleErrorWithToast } from "ui/shared-toast";
import {
  connectMcpClientAction,
  disconnectMcpClientAction,
  refreshMcpClientAction,
  removeMcpClientAction,
} from "@/app/api/mcp/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import type { MCPServerInfo, MCPToolInfo } from "app-types/mcp";
import { Switch } from "ui/switch";
import { Label } from "ui/label";

// Helper function to check if schema is empty
const isEmptySchema = (schema: any): boolean => {
  if (!schema) return true;
  // Check properties first if available, otherwise check the schema itself
  const dataToCheck = schema.properties || schema;
  return Object.keys(dataToCheck).length === 0;
};

// Status indicator component
const StatusIndicator = memo(
  ({ text, icon }: { text?: string; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {text}
      </span>
    </div>
  ),
);

StatusIndicator.displayName = "StatusIndicator";

// Tool item component
const ToolItem = memo(
  ({ tool, serverName }: { tool: MCPToolInfo; serverName: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex cursor-pointer bg-secondary/50 rounded-md p-2 hover:bg-secondary/80 transition-colors">
          <div className="flex-1 w-full">
            <p className="font-medium text-sm mb-1">{tool.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {tool.description}
            </p>
          </div>
          <div className="flex items-center px-1 justify-center self-stretch">
            <ChevronRight size={16} />
          </div>
        </div>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="sm:max-w-[800px] fixed p-10 overflow-hidden">
          <DialogHeader>
            <DialogTitle>{tool.name}</DialogTitle>
          </DialogHeader>
          <div className="mb-2">
            <p
              aria-describedby="tool-description"
              className="text-xs text-muted-foreground mt-1 max-h-[150px] overflow-y-auto"
            >
              {tool.description}
            </p>
          </div>

          <Separator className="my-2" />

          <div className="flex items-center gap-2 mb-2">
            <h5 className="text-xs font-medium">Input Schema</h5>
          </div>
          {tool.inputSchema ? (
            <div className="overflow-y-auto max-h-[40vh]">
              {!isEmptySchema(tool.inputSchema) ? (
                <JsonView
                  data={tool.inputSchema?.properties || tool.inputSchema}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No data available
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No schema available
            </p>
          )}

          <div className="absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  ),
);

ToolItem.displayName = "ToolItem";

// Tools list component
const ToolsList = memo(
  ({ tools, serverName }: { tools: MCPToolInfo[]; serverName: string }) => (
    <div className="space-y-2 pr-2">
      {tools.map((tool) => (
        <ToolItem key={tool.name} tool={tool} serverName={serverName} />
      ))}
    </div>
  ),
);

ToolsList.displayName = "ToolsList";

// Configuration viewer component
const ConfigViewer = memo(({ config }: { config: any }) => (
  <div className="overflow-visible">
    <JsonView data={config} />
  </div>
));

ConfigViewer.displayName = "ConfigViewer";

// Error alert component
const ErrorAlert = memo(({ error }: { error: string }) => (
  <div className="px-6 pb-2">
    <Alert variant="destructive" className="border-destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  </div>
));

ErrorAlert.displayName = "ErrorAlert";

// Main MCPCard component
export const MCPCard = memo(function MCPCard({
  config,
  error,
  status,
  name,
  toolInfo,
}: MCPServerInfo) {
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoading = useMemo(() => {
    return isProcessing || status === "loading";
  }, [isProcessing, status]);

  const errorMessage = useMemo(() => {
    if (error) {
      return JSON.stringify(error);
    }
    return null;
  }, [error]);

  const pipeProcessing = useCallback(
    async (fn: () => Promise<any>) =>
      safe(() => setIsProcessing(true))
        .ifOk(fn)
        .ifOk(() => mutate("mcp-list"))
        .ifFail(handleErrorWithToast)
        .watch(() => setIsProcessing(false)),
    [],
  );

  const handleRefresh = useCallback(
    () => pipeProcessing(() => refreshMcpClientAction(name)),
    [name],
  );

  const handleDelete = useCallback(async () => {
    await pipeProcessing(() => removeMcpClientAction(name));
  }, [name]);

  const handleToggleConnection = useCallback(async () => {
    await pipeProcessing(() =>
      status === "connected"
        ? disconnectMcpClientAction(name)
        : connectMcpClientAction(name),
    );
  }, [name, status]);

  return (
    <Card className="bg-background relative">
      {isLoading && (
        <div className="animate-pulse z-10 absolute inset-0 bg-background/50 flex items-center justify-center w-full h-full" />
      )}
      <CardHeader className="flex items-center gap-1 mb-2">
        {isLoading && <Loader2 className="size-4 z-20 animate-spin mr-1" />}

        <h4 className="font-bold text-lg ">{name}</h4>
        <div className="flex-1" />

        <Label
          htmlFor={`mcp-card-switch-${name}`}
          className="mr-2 text-xs text-muted-foreground"
        >
          {status === "connected" ? "enabled" : "disabled"}
        </Label>
        <Switch
          id={`mcp-card-switch-${name}`}
          checked={status === "connected"}
          onCheckedChange={handleToggleConnection}
          className="mr-2"
        />
        <div className="h-4">
          <Separator orientation="vertical" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/mcp/test/${encodeURIComponent(name)}`}
              className="cursor-pointer"
            >
              <Button variant="ghost" size="icon">
                <FlaskConical className="size-3.5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tools Test</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RotateCw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/mcp/modify/${encodeURIComponent(name)}`}
              className="cursor-pointer"
            >
              <Button variant="ghost" size="icon">
                <Pencil className="size-3.5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      {errorMessage && <ErrorAlert error={errorMessage} />}

      <div className="relative">
        <CardContent className="flex flex-row gap-4 text-sm max-h-[300px] overflow-auto">
          <div className="w-1/2 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2 sticky top-0 pt-2 pb-1 bg-background z-10">
              <Settings size={14} className="text-muted-foreground" />
              <h5 className="text-muted-foreground text-sm font-medium">
                Configuration
              </h5>
            </div>
            <ConfigViewer config={config} />
          </div>

          <div className="w-1/2 min-w-0 border-l pl-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4 sticky top-0 pt-2 pb-1 bg-background z-10">
              <Wrench size={14} className="text-muted-foreground" />
              <h5 className="text-muted-foreground text-sm font-medium">
                Available Tools
              </h5>
            </div>

            {toolInfo.length > 0 ? (
              <ToolsList tools={toolInfo} serverName={name} />
            ) : (
              <div className="bg-secondary/30 rounded-md p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  No tools available
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* 바닥 그라데이션 */}
        <div className="absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </div>
    </Card>
  );
});
