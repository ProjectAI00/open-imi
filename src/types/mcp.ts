import { z } from "zod";

export const MCPSseConfigZodSchema = z.object({
  url: z.string().url().describe("The URL of the SSE endpoint"),
  headers: z.record(z.string(), z.string()).optional().default({}),
});

export const MCPStdioConfigZodSchema = z.object({
  command: z.string().min(1).describe("The command to run"),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

// Schema voor directe URL-only SSE verbinding
// Dit is technisch hetzelfde als SSE maar voor UI onderscheid
export const MCPUrlConfigZodSchema = z.object({
  url: z.string().url().describe("The URL of the SSE endpoint"),
});

// Schema voor API key verbinding
export const MCPApiKeyConfigZodSchema = z.object({
  apiKey: z.string().min(1).describe("API key for authentication"),
  baseURL: z.string().url().optional().describe("Base URL for the API endpoint"),
});

export type MCPSseConfig = z.infer<typeof MCPSseConfigZodSchema>;
export type MCPStdioConfig = z.infer<typeof MCPStdioConfigZodSchema>;
export type MCPUrlConfig = z.infer<typeof MCPUrlConfigZodSchema>;
export type MCPApiKeyConfig = z.infer<typeof MCPApiKeyConfigZodSchema>;

export type MCPServerConfig = MCPSseConfig | MCPStdioConfig | MCPApiKeyConfig;

export type MCPToolInfo = {
  name: string;
  description: string;
  inputSchema?: {
    type?: any;
    properties?: Record<string, any>;
    required?: string[];
  };
};

export type MCPServerInfo = {
  name: string;
  config: MCPServerConfig;
  error?: unknown;
  status: "connected" | "disconnected" | "loading";
  toolInfo: MCPToolInfo[];
};
