import type { MCPServerConfig } from "app-types/mcp";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type {
  MCPClientsManager,
  MCPConfigStorage,
} from "./create-mcp-clients-manager";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { createDebounce } from "lib/utils";
import equal from "fast-deep-equal";
import logger from "logger";
import { MCP_CONFIG_PATH } from "lib/const";

/**
 * Creates a file-based implementation of MCPServerStorage
 */
export function createFileBasedMCPConfigsStorage(
  path?: string,
): MCPConfigStorage {
  const configPath = path || MCP_CONFIG_PATH;
  const configs: Map<string, MCPServerConfig> = new Map();
  let watcher: FSWatcher | null = null;
  const debounce = createDebounce();

  /**
   * Persists the current config map to the file system
   */
  async function saveToFile(): Promise<void> {
    try {
      const dir = dirname(configPath);
      logger.info(`Saving MCP config to: ${configPath} (directory: ${dir})`);
      
      // Create directory if it doesn't exist
      await mkdir(dir, { recursive: true });
      
      // Convert map to JSON
      const configJson = JSON.stringify(Object.fromEntries(configs), null, 2);
      logger.debug(`MCP config JSON to save: ${configJson}`);
      
      // Write to file
      await writeFile(configPath, configJson, "utf-8");
      logger.info(`Successfully saved MCP config to: ${configPath}`);
    } catch (error) {
      logger.error(`Error saving MCP config to ${configPath}:`, error);
      throw error;
    }
  }
  /**
   * Initializes storage by reading existing config or creating empty file
   */
  async function init(manager: MCPClientsManager): Promise<void> {
    logger.info(`Initializing MCP config storage with file: ${configPath}`);
    
    // Stop existing watcher if any
    if (watcher) {
      logger.debug("Closing existing file watcher");
      await watcher.close();
      watcher = null;
    }
    
    // Read config file
    try {
      logger.debug(`Attempting to read MCP config from: ${configPath}`);
      const configText = await readFile(configPath, { encoding: "utf-8" });
      
      logger.debug(`Successfully read MCP config: ${configText}`);
      const config = JSON.parse(configText ?? "{}");
      
      configs.clear();
      Object.entries(config).forEach(([name, serverConfig]) => {
        logger.debug(`Loading MCP server config: ${name}`);
        configs.set(name, serverConfig as MCPServerConfig);
      });
      
      logger.info(`Loaded ${configs.size} MCP server configurations`);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Create empty config file if doesn't exist
        logger.info(`MCP config file not found, creating empty file at: ${configPath}`);
        await saveToFile();
      } else if (err instanceof SyntaxError) {
        const errorMsg = `Config file ${configPath} has invalid JSON: ${err.message}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      } else {
        logger.error(`Error initializing MCP config storage:`, err);
        throw err;
      }
    }

    // Setup file watcher
    logger.debug(`Setting up file watcher for: ${configPath}`);
    watcher = chokidar.watch(configPath, {
      persistent: true,
      awaitWriteFinish: true,
      ignoreInitial: true,
    });

    watcher.on("change", () =>
      debounce(async () => {
        {
          try {
            logger.debug(`MCP config file changed, reloading...`);
            // Read the updated file
            const configText = await readFile(configPath, {
              encoding: "utf-8",
            });
            
            // Parse the updated config
            const updatedConfig = JSON.parse(configText ?? "{}");
            
            // Check if the config has actually changed
            if (equal(updatedConfig, Object.fromEntries(configs))) {
              logger.debug(`MCP config unchanged, skipping reload`);
              return;
            }

            logger.info(`MCP config changed, reinitializing clients...`);
            await manager.cleanup();
            await manager.init();
            logger.info(`MCP clients reinitialized successfully`);
          } catch (err) {
            logger.error("Error detecting config file change:", err);
          }
        }
      }, 1000),
    );
    
    logger.info(`MCP config storage initialization complete`);
  }

  return {
    init,
    async loadAll(): Promise<Record<string, MCPServerConfig>> {
      return Object.fromEntries(configs);
    },
    // Saves a configuration with the given name
    async save(name: string, config: MCPServerConfig): Promise<void> {
      configs.set(name, config);
      await saveToFile();
    },
    // Deletes a configuration by name
    async delete(name: string): Promise<void> {
      configs.delete(name);
      await saveToFile();
    },

    // Checks if a configuration exists
    async has(name: string): Promise<boolean> {
      return configs.has(name);
    },
  };
}
