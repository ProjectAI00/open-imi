import { createFileBasedMCPConfigsStorage } from "lib/ai/mcp/fb-mcp-config-storage";
import {
  createMCPClientsManager,
  type MCPClientsManager,
} from "lib/ai/mcp/create-mcp-clients-manager";
import { IS_DEV } from "lib/const";
import logger from "logger";

declare global {
  // eslint-disable-next-line no-var
  var __mcpClientsManager__: MCPClientsManager | undefined;
}

const storage = createFileBasedMCPConfigsStorage();

let mcpClientsManager: MCPClientsManager;
if (IS_DEV) {
  if (!globalThis.__mcpClientsManager__) {
    globalThis.__mcpClientsManager__ = createMCPClientsManager(storage);
    // Initialize the manager without waiting for connections
    await globalThis.__mcpClientsManager__.init();
    
    // Start connecting to clients in the background
    initializeConnectionsAsync(globalThis.__mcpClientsManager__);
  }
  mcpClientsManager = globalThis.__mcpClientsManager__;
} else {
  mcpClientsManager = createMCPClientsManager(storage);
  if (!process.env.MCP_NO_INITIAL) {
    // Initialize the manager without waiting for connections
    mcpClientsManager.init().catch(error => {
      logger.error("Failed to initialize MCP clients manager:", error);
    });
    
    // Start connecting to clients in the background
    initializeConnectionsAsync(mcpClientsManager);
  }
}

// Initialize connections asynchronously without blocking
async function initializeConnectionsAsync(manager: MCPClientsManager) {
  try {
    await manager.initializeConnections();
  } catch (error) {
    logger.error("Failed to initialize MCP connections:", error);
  }
}

export { mcpClientsManager };
