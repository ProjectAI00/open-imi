"use server";

import type { MCPServerConfig } from "app-types/mcp";
import { mcpClientsManager } from "./mcp-manager";
import { isMaybeMCPServerConfig } from "lib/ai/mcp/is-mcp-config";
import { detectConfigChanges } from "lib/ai/mcp/mcp-config-diff";
import logger from "logger";

export async function selectMcpClientsAction() {
  const list = mcpClientsManager.getClients();
  return list.map((client) => {
    return client.getInfo();
  });
}

const validateConfig = (config: unknown) => {
  if (!isMaybeMCPServerConfig(config)) {
    throw new Error("Invalid MCP server configuration");
  }
  return config;
};

export async function updateMcpConfigByJsonAction(
  json: Record<string, MCPServerConfig>,
) {
  Object.values(json).forEach(validateConfig);
  const prevConfig = Object.fromEntries(
    mcpClientsManager
      .getClients()
      .map((client) => [client.getInfo().name, client.getInfo().config]),
  );
  const changes = detectConfigChanges(prevConfig, json);
  for (const change of changes) {
    const value = change.value;
    if (change.type === "add") {
      await mcpClientsManager.addClient(change.key, value);
    } else if (change.type === "remove") {
      await mcpClientsManager.removeClient(change.key);
    } else if (change.type === "update") {
      await mcpClientsManager.refreshClient(change.key, value);
    }
  }
}

export async function insertMcpClientAction(
  name: string,
  config: MCPServerConfig,
) {
  try {
    logger.info(`Adding MCP client: ${name}`, config);
    
    // Validate the config
    validateConfig(config);
    
    // Check if the client already exists
    const exists = mcpClientsManager.getClients().some(
      (client) => client.getInfo().name === name
    );
    
    if (exists) {
      const error = new Error(`MCP client with name '${name}' already exists`);
      logger.error(error);
      throw error;
    }
    
    // Add the client
    await mcpClientsManager.addClient(name, config);
    logger.info(`Successfully added MCP client: ${name}`);
    
    return { success: true, message: `Added MCP client: ${name}` };
  } catch (error) {
    logger.error(`Error adding MCP client '${name}':`, error);
    throw error;
  }
}

export async function removeMcpClientAction(name: string) {
  try {
    logger.info(`Removing MCP client: ${name}`);
    await mcpClientsManager.removeClient(name);
    logger.info(`Successfully removed MCP client: ${name}`);
    return { success: true, message: `Removed MCP client: ${name}` };
  } catch (error) {
    logger.error(`Error removing MCP client '${name}':`, error);
    throw error;
  }
}

export async function connectMcpClientAction(name: string) {
  const client = mcpClientsManager
    .getClients()
    .find((client) => client.getInfo().name === name);
  if (client?.getInfo().status === "connected") {
    return;
  }
  await client?.connect();
}

export async function disconnectMcpClientAction(name: string) {
  const client = mcpClientsManager
    .getClients()
    .find((client) => client.getInfo().name === name);
  if (client?.getInfo().status === "disconnected") {
    return;
  }
  await client?.disconnect();
}

export async function refreshMcpClientAction(name: string) {
  await mcpClientsManager.refreshClient(name);
}

export async function updateMcpClientAction(
  name: string,
  config: MCPServerConfig,
) {
  try {
    logger.info(`Updating MCP client: ${name}`, config);
    
    // Validate the config
    validateConfig(config);
    
    // Check if the client exists
    const clientExists = mcpClientsManager.getClients().some(
      (client) => client.getInfo().name === name
    );
    
    if (!clientExists) {
      const error = new Error(`MCP client with name '${name}' not found`);
      logger.error(error);
      throw error;
    }
    
    // Update the client
    await mcpClientsManager.refreshClient(name, config);
    logger.info(`Successfully updated MCP client: ${name}`);
    
    return { success: true, message: `Updated MCP client: ${name}` };
  } catch (error) {
    logger.error(`Error updating MCP client '${name}':`, error);
    throw error;
  }
}
