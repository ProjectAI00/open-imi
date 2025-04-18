import { NextResponse } from "next/server";
import { mcpClientsManager } from "./mcp-manager";

// GET handler to list all MCP servers
export async function GET() {
  try {
    const clients = mcpClientsManager.getClients();
    const clientsInfo = clients.map(client => client.getInfo());
    
    return NextResponse.json(clientsInfo);
  } catch (error) {
    console.error("Error fetching MCP servers:", error);
    return NextResponse.json({ error: "Failed to fetch MCP servers" }, { status: 500 });
  }
} 