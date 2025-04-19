"use client";
import { useState, useMemo } from "react";
import {
  MCPServerConfig,
  MCPSseConfigZodSchema,
  MCPStdioConfigZodSchema,
} from "app-types/mcp";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import JsonView from "./ui/json-view";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createDebounce, isNull, safeJSONParse } from "lib/utils";
import { handleErrorWithToast } from "ui/shared-toast";
import { mutate } from "swr";
import { Loader2 } from "lucide-react";
import {
  isMaybeMCPServerConfig,
  isMaybeSseConfig,
} from "lib/ai/mcp/is-mcp-config";
import { updateMcpClientAction } from "@/app/api/mcp/actions";
import { insertMcpClientAction } from "@/app/api/mcp/actions";
import equal from "fast-deep-equal";
import { removeMcpClientAction } from "@/app/api/mcp/actions";

interface MCPEditorProps {
  initialConfig?: MCPServerConfig;
  name?: string;
}

// Connection mode types
type ConnectionMode = "json" | "url";

const STDIO_ARGS_ENV_PLACEHOLDER = `/** STDIO Example */
{
  "command": "node", 
  "args": ["index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-...",
  }
}`;

const SSE_EXAMPLE_PLACEHOLDER = `/** SSE Example */
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}`;

const URL_PLACEHOLDER = "https://api.example.com";

export default function MCPEditor({
  initialConfig,
  name: initialName,
}: MCPEditorProps) {
  const shouldInsert = useMemo(() => isNull(initialName), [initialName]);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const convertDebounce = useMemo(() => createDebounce(), []);
  const errorDebounce = useMemo(() => createDebounce(), []);

  // Determine initial connection mode based on initialConfig
  const getInitialMode = (): ConnectionMode => {
    if (!initialConfig) return "json";
    if ("url" in initialConfig) return "url";
    return "json";
  };

  // State for connection mode
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(getInitialMode());
  const [url, setUrl] = useState<string>(
    initialConfig && "url" in initialConfig ? initialConfig.url as string : ""
  );

  // State for form fields
  const [name, setName] = useState<string>(initialName ?? "");
  const router = useRouter();
  const [config, setConfig] = useState<MCPServerConfig>(
    initialConfig as MCPServerConfig,
  );
  const [jsonString, setJsonString] = useState<string>(
    initialConfig ? JSON.stringify(initialConfig, null, 2) : "",
  );

  const saveDisabled = useMemo(() => {
    if (name.trim() === "" || isLoading) return true;
    
    if (connectionMode === "json") {
      return !!jsonError || !isMaybeMCPServerConfig(config);
    } else if (connectionMode === "url") {
      return !url || !url.startsWith("http");
    }
    
    return true;
  }, [isLoading, jsonError, config, name, connectionMode, url]);

  // Validate
  const validateConfig = (jsonConfig: unknown): boolean => {
    if (connectionMode === "json") {
      const result = isMaybeSseConfig(jsonConfig)
        ? MCPSseConfigZodSchema.safeParse(jsonConfig)
        : MCPStdioConfigZodSchema.safeParse(jsonConfig);
      if (!result.success) {
        handleErrorWithToast(result.error, "mcp-editor-error");
      }
      return result.success;
    }
    return true;
  };

  // Build config based on connection mode
  const buildFinalConfig = (): MCPServerConfig => {
    if (connectionMode === "json") {
      return config;
    } else if (connectionMode === "url") {
      return {
        url,
        headers: {}
      };
    }
    return config;
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      // Build the final config
      const finalConfig = buildFinalConfig();
      
      // Perform validation
      if (connectionMode === "json" && !validateConfig(config)) return;
      if (!name) {
        toast.error("Name is required");
        return;
      }

      setIsLoading(true);
      
      // Log for debugging
      console.log("Saving MCP config:", { name, initialName, finalConfig, shouldInsert });
      
      // Use the appropriate action based on whether we're inserting or updating
      if (shouldInsert) {
        const result = await insertMcpClientAction(name, finalConfig);
        console.log("Insert result:", result);
      } else {
        // Check if the name has changed
        const nameChanged = initialName && name !== initialName;
        console.log("Name changed:", nameChanged, "from", initialName, "to", name);
        
        if (nameChanged) {
          // First, remove the old entry
          console.log("Removing old entry:", initialName);
          await removeMcpClientAction(initialName as string);
          
          // Then insert with the new name
          console.log("Adding with new name:", name);
          const result = await insertMcpClientAction(name, finalConfig);
          console.log("Insert with new name result:", result);
        } else {
          // Just update the existing entry
          const result = await updateMcpClientAction(name, finalConfig);
          console.log("Update result:", result);
        }
      }
      
      // Refresh the data and check if our config was actually saved
      await mutate("mcp-list");
      
      // Try to fetch the updated list to verify the save worked
      try {
        const updatedList = await fetch("/api/mcp/list").then(res => res.json());
        console.log("Updated MCP server list:", updatedList);
        
        // Check if our server is in the list
        const savedServer = updatedList.find((server: any) => server.name === name);
        if (!savedServer) {
          console.warn("Server was not found in updated list - this may indicate a save issue");
        } else {
          console.log("Server was successfully saved:", savedServer);
        }
      } catch (fetchError) {
        console.error("Error fetching updated server list:", fetchError);
      }
      
      // Show success message with appropriate text for rename
      if (initialName && name !== initialName) {
        toast.success(`Server renamed from "${initialName}" to "${name}"`);
      } else {
        toast.success("Configuration saved successfully");
      }
      
      // Navigate back to the MCP list
      router.push("/mcp");
    } catch (error) {
      console.error("Error saving MCP configuration:", error);
      handleErrorWithToast(error as Error, "mcp-editor-error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (data: string) => {
    setJsonString(data);
    const result = safeJSONParse(data);
    errorDebounce.clear();
    if (result.success) {
      // Handle case where user inputs a JSON with mcpServers structure
      let configValue: any = result.value;
      
      // Check if the data contains an mcpServers structure
      if (configValue && typeof configValue === 'object' && 'mcpServers' in configValue && typeof configValue.mcpServers === 'object') {
        console.log("Detected mcpServers structure, flattening:", configValue);
        
        // Convert from nested to flat structure expected by the backend
        // For example: { mcpServers: { googleWorkspace: { ... } } } -> { googleWorkspace: { ... } }
        configValue = configValue.mcpServers;
        
        // If we have only one server in the nested structure, extract it
        const keys = Object.keys(configValue);
        if (keys.length === 1) {
          // Set the name field if it's empty
          if (!name && shouldInsert) {
            setName(keys[0]);
          }
          
          // Extract the configuration
          configValue = configValue[keys[0]];
        }
      }
      
      const isDiff = !equal(configValue, config);
      setConfig(configValue as MCPServerConfig);
      setJsonError(null);
      if (isDiff) {
        convertDebounce(
          () => setJsonString(JSON.stringify(configValue, null, 2)),
          1000,
        );
      }
    } else if (data.trim() !== "") {
      errorDebounce(() => {
        setJsonError(
          (result.error as Error)?.message ??
            JSON.stringify(result.error, null, 2),
        );
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Connection Mode Selection */}
      <div className="space-y-2">
        <Label>Connection Type</Label>
        <div className="grid grid-cols-2 gap-4">
          <div 
            className={`p-3 border rounded-md cursor-pointer text-center ${connectionMode === 'json' ? 'border-primary bg-primary/5' : 'border-muted'}`}
            onClick={() => setConnectionMode('json')}
          >
            <div className="font-medium">JSON</div>
            <div className="text-xs text-muted-foreground">STDIO / SSE</div>
          </div>
          
          <div 
            className={`p-3 border rounded-md cursor-pointer text-center ${connectionMode === 'url' ? 'border-primary bg-primary/5' : 'border-muted'}`}
            onClick={() => setConnectionMode('url')}
          >
            <div className="font-medium">URL</div>
            <div className="text-xs text-muted-foreground">SSE</div>
          </div>
        </div>
      </div>

      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter mcp server name"
        />
      </div>

      {/* Connection mode specific fields */}
      {connectionMode === 'json' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config">Config</Label>
          </div>

          {/* Split view for config editor */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left side: Textarea for editing */}
            <div className="space-y-2">
              <Label
                htmlFor="config-editor"
                className="text-xs text-muted-foreground"
              >
                JSON Editor
              </Label>
              <Textarea
                id="config-editor"
                value={jsonString}
                onChange={(e) => handleConfigChange(e.target.value)}
                className="font-mono h-[40vh] resize-none overflow-y-auto"
                placeholder={isMaybeSseConfig(config) ? SSE_EXAMPLE_PLACEHOLDER : STDIO_ARGS_ENV_PLACEHOLDER}
              />
            </div>

            {/* Right side: JSON preview */}
            <div className="space-y-2">
              <Label
                htmlFor="config-preview"
                className="text-xs text-muted-foreground"
              >
                JSON Preview
              </Label>
              <div className="border border-input rounded-md p-2 h-[40vh] overflow-y-auto bg-muted/30 text-sm">
                {jsonError ? (
                  <div className="text-destructive text-xs p-2">{jsonError}</div>
                ) : (
                  <JsonView data={config} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL Connection mode */}
      {connectionMode === 'url' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">SSE Server URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={URL_PLACEHOLDER}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL of your SSE-compatible MCP server
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saveDisabled}
        className="flex gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Configuration
      </Button>
    </div>
  );
}
