import type {
  MCPServerConfig,
  MCPSseConfig,
  MCPStdioConfig,
  MCPUrlConfig,
  MCPApiKeyConfig,
} from "app-types/mcp";

/**
 * Type guard to check if an object is potentially a valid stdio config
 */
export function isMaybeStdioConfig(config: unknown): config is MCPStdioConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "command" in config && typeof config.command === "string";
}

/**
 * Type guard to check if an object is potentially a valid SSE config
 */
export function isMaybeSseConfig(config: unknown): config is MCPSseConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "url" in config && typeof config.url === "string";
}

/**
 * Type guard to check if an object is potentially a valid URL-only config
 * Dit is een aparte check voor de UI om onderscheid te maken, maar technisch
 * gezien is het hetzelfde als een SSE config zonder headers
 */
export function isMaybeUrlConfig(config: unknown): config is MCPUrlConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "url" in config && typeof config.url === "string" && !("headers" in config);
}

/**
 * Type guard to check if an object is potentially a valid API key config
 */
export function isMaybeApiKeyConfig(config: unknown): config is MCPApiKeyConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "apiKey" in config && typeof config.apiKey === "string";
}

/**
 * Type guard for MCP server config (either stdio, SSE, URL-only or API key)
 */
export function isMaybeMCPServerConfig(
  config: unknown,
): config is MCPServerConfig {
  return (
    isMaybeStdioConfig(config) || 
    isMaybeSseConfig(config) || 
    isMaybeApiKeyConfig(config) ||
    isMaybeUrlConfig(config)
  );
}
