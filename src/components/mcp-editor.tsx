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
import { safe, watchOk } from "ts-safe";
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
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { removeMcpClientAction } from "@/app/api/mcp/actions";

interface MCPEditorProps {
  initialConfig?: MCPServerConfig;
  name?: string;
}

const STDIO_ARGS_ENV_PLACEHOLDER = `/** STDIO Example */
{
  "command": "node", 
  "args": ["index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-...",
  }
}

/** SSE Example */
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}`;

export default function MCPEditor({
  initialConfig,
  name: initialName,
}: MCPEditorProps) {
  const shouldInsert = useMemo(() => isNull(initialName), [initialName]);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const convertDebounce = useMemo(() => createDebounce(), []);
  const errorDebounce = useMemo(() => createDebounce(), []);

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
    return (
      name.trim() === "" ||
      isLoading ||
      !!jsonError ||
      !isMaybeMCPServerConfig(config)
    );
  }, [isLoading, jsonError, config, name]);

  // Validate
  const validateConfig = (jsonConfig: unknown): boolean => {
    const result = isMaybeSseConfig(jsonConfig)
      ? MCPSseConfigZodSchema.safeParse(jsonConfig)
      : MCPStdioConfigZodSchema.safeParse(jsonConfig);
    if (!result.success) {
      handleErrorWithToast(result.error, "mcp-editor-error");
    }
    return result.success;
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      // Perform validation
      if (!validateConfig(config)) return;
      if (!name) {
        toast.error("Name is required");
        return;
      }

      setIsLoading(true);
      
      // Log for debugging
      console.log("Saving MCP config:", { name, initialName, config, shouldInsert });
      
      // Use the appropriate action based on whether we're inserting or updating
      if (shouldInsert) {
        const result = await insertMcpClientAction(name, config);
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
          const result = await insertMcpClientAction(name, config);
          console.log("Insert with new name result:", result);
        } else {
          // Just update the existing entry
          const result = await updateMcpClientAction(name, config);
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
              placeholder={STDIO_ARGS_ENV_PLACEHOLDER}
            />
          </div>

          {/* Right side: JSON view */}
          <div className="space-y-2">
            <Label
              htmlFor="config-view"
              className="text-xs text-muted-foreground"
            >
              JSON Preview
            </Label>
            <div className="border rounded-md p-4 h-[40vh] overflow-auto relative">
              <JsonView data={config} initialExpandDepth={3} />
              {jsonError && jsonString && (
                <div className="absolute w-full bottom-0 right-0 px-2 pb-2 animate-in fade-in-0 duration-300">
                  <Alert variant="destructive" className="border-destructive">
                    <AlertTitle className="text-xs font-semibold">
                      Parsing Error
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {jsonError}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <Button onClick={handleSave} className="w-full" disabled={saveDisabled}>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="font-bold">Save Configuration</span>
        )}
      </Button>
    </div>
  );
}
