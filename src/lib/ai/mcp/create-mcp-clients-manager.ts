import type { MCPServerConfig } from "app-types/mcp";
import { createMCPClient, type MCPClient } from "./create-mcp-client";
import equal from "fast-deep-equal";
import logger from "logger";
/**
 * Interface for storage of MCP server configurations.
 * Implementations should handle persistent storage of server configs.
 *
 * IMPORTANT: When implementing this interface, be aware that:
 * - Storage can be modified externally (e.g., file edited manually)
 * - Concurrent modifications may occur from multiple processes
 * - Implementations should either handle these scenarios or document limitations
 */
export interface MCPConfigStorage {
  init(manager: MCPClientsManager): Promise<void>;
  loadAll(): Promise<Record<string, MCPServerConfig>>;
  save(name: string, config: MCPServerConfig): Promise<void>;
  delete(name: string): Promise<void>;
  has(name: string): Promise<boolean>;
}

export class MCPClientsManager {
  protected clients = new Map<string, MCPClient>();

  private initialized = false;
  private connectionsInitialized = false;

  // Optional storage for persistent configurations
  constructor(private storage?: MCPConfigStorage) {
    process.on("SIGINT", this.cleanup.bind(this));
    process.on("SIGTERM", this.cleanup.bind(this));
  }

  async init() {
    if (this.initialized) return;
    
    // Mark as initialized early so the UI can proceed
    this.initialized = true;
    
    try {
      if (this.storage) {
        await this.storage.init(this);
        const configs = await this.storage.loadAll();
        
        // Only load client configurations without connecting
        await Promise.all(
          Object.entries(configs).map(([name, serverConfig]) =>
            this.addClientWithoutConnecting(name, serverConfig),
          ),
        );
      }
    } catch (error) {
      logger.error("Error during MCP initialization:", error);
      // Continue despite errors to allow the UI to function
    }
  }
  
  /**
   * Initialize connections to all MCP clients asynchronously
   * This can be called after init() to start connections without blocking the UI
   */
  async initializeConnections() {
    if (this.connectionsInitialized) return;
    this.connectionsInitialized = true;
    
    logger.info("Starting asynchronous connection to all MCP clients");
    
    // Connect to all clients in parallel
    const clientEntries = Array.from(this.clients.entries());
    
    // Use Promise.allSettled to continue even if some connections fail
    await Promise.allSettled(
      clientEntries.map(async ([name, client]) => {
        try {
          await client.connect();
          logger.info(`Connected MCP client: ${name}`);
        } catch (error) {
          logger.error(`Failed to connect MCP client '${name}':`, error);
          // Continue despite connection failures
        }
      })
    );
    
    logger.info("Finished connecting to all MCP clients");
  }
  
  /**
   * Adds a client configuration without connecting to it
   */
  async addClientWithoutConnecting(name: string, serverConfig: MCPServerConfig) {
    try {
      logger.info(`Adding MCP client configuration: ${name}`);
      
      if (this.storage) {
        logger.debug(`Checking if MCP client '${name}' exists in storage`);
        if (!(await this.storage.has(name))) {
          logger.debug(`Saving MCP client '${name}' to storage`);
          await this.storage.save(name, serverConfig);
        } else {
          logger.debug(`MCP client '${name}' already exists in storage`);
        }
      } else {
        logger.warn(`No storage available for MCP client '${name}'`);
      }
      
      const client = createMCPClient(name, serverConfig);
      this.clients.set(name, client);
      
      logger.info(`Successfully added MCP client configuration: ${name}`);
      return client;
      
    } catch (error) {
      logger.error(`Error adding MCP client configuration '${name}':`, error);
      throw error;
    }
  }

  /**
   * Returns all tools from all clients as a flat object
   */
  tools() {
    return Object.fromEntries(
      Array.from(this.clients.values())
        .filter((client) => client.getInfo().status == "connected")
        .flatMap((client) => Object.entries(client.tools)),
    );
  }

  /**
   * Adds a new client with the given name and configuration
   */
  async addClient(name: string, serverConfig: MCPServerConfig) {
    try {
      logger.info(`Adding MCP client: ${name}`, serverConfig);
      
      if (this.storage) {
        logger.debug(`Checking if MCP client '${name}' exists in storage`);
        if (!(await this.storage.has(name))) {
          logger.debug(`Saving MCP client '${name}' to storage`);
          await this.storage.save(name, serverConfig);
        } else {
          logger.debug(`MCP client '${name}' already exists in storage`);
        }
      } else {
        logger.warn(`No storage available for MCP client '${name}'`);
      }
      
      const client = createMCPClient(name, serverConfig);
      this.clients.set(name, client);
      
      logger.info(`Successfully added MCP client: ${name}`);
      
      try {
        await client.connect();
        logger.info(`Connected MCP client: ${name}`);
      } catch (connectError) {
        logger.error(`Failed to connect MCP client '${name}':`, connectError);
        // Continue despite connection failure - client is still added
      }
      
      return client;
    } catch (error) {
      logger.error(`Error adding MCP client '${name}':`, error);
      throw error;
    }
  }

  /**
   * Removes a client by name, disposing resources and removing from storage
   */
  async removeClient(name: string) {
    if (this.storage) {
      if (await this.storage.has(name)) {
        await this.storage.delete(name);
      }
    }
    const client = this.clients.get(name);
    this.clients.delete(name);
    if (client) {
      await client.disconnect();
    }
  }

  /**
   * Refreshes an existing client with a new configuration or its existing config
   */
  async refreshClient(name: string, updateConfig?: MCPServerConfig) {
    const prevClient = this.clients.get(name);
    if (!prevClient) {
      throw new Error(`Client ${name} not found`);
    }

    const currentConfig = prevClient.getInfo().config;
    const config = updateConfig ?? currentConfig;

    if (this.storage && config && !equal(currentConfig, config)) {
      await this.storage.save(name, config);
    }
    await prevClient.disconnect().catch((error) => {
      logger.error(`Error disposing client ${name}:`, error);
    });
    return this.addClient(name, config);
  }

  async cleanup() {
    const clients = Array.from(this.clients.values());
    this.clients.clear();
    return Promise.all(clients.map((client) => client.disconnect()));
  }

  getClients() {
    return Array.from(this.clients.values());
  }
}

export function createMCPClientsManager(
  storage?: MCPConfigStorage,
): MCPClientsManager {
  return new MCPClientsManager(storage);
}
