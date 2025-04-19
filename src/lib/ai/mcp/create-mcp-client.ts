import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  type MCPServerInfo,
  MCPSseConfigZodSchema,
  MCPStdioConfigZodSchema,
  MCPApiKeyConfigZodSchema,
  type MCPServerConfig,
  type MCPToolInfo,
  MCPUrlConfigZodSchema,
} from "app-types/mcp";
import { jsonSchema, Tool, tool, ToolExecutionOptions } from "ai";
import { 
  isMaybeSseConfig, 
  isMaybeStdioConfig,
  isMaybeApiKeyConfig,
  isMaybeUrlConfig,
} from "./is-mcp-config";
import logger from "logger";
import type { ConsolaInstance } from "consola";
import { colorize } from "consola/utils";
import { Locker, toAny } from "lib/utils";

/**
 * Client class for Model Context Protocol (MCP) server connections
 */
export class MCPClient {
  private client?: Client;
  private error?: unknown;
  private isConnected = false;
  private log: ConsolaInstance;
  private locker = new Locker();
  // Information about available tools from the server
  toolInfo: MCPToolInfo[] = [];
  // Tool instances that can be used for AI functions
  tools: { [key: string]: Tool } = {};

  constructor(
    private name: string,
    private serverConfig: MCPServerConfig,
  ) {
    this.log = logger.withDefaults({
      message: colorize("cyan", `MCP Client ${this.name}: `),
    });
  }
  getInfo(): MCPServerInfo {
    return {
      name: this.name,
      config: this.serverConfig,
      status: this.locker.isLocked
        ? "loading"
        : this.isConnected
          ? "connected"
          : "disconnected",
      error: this.error,
      toolInfo: this.toolInfo,
    };
  }

  /**
   * Connect to the MCP server
   * Do not throw Error
   * @returns this
   */
  async connect() {
    if (this.locker.isLocked) {
      await this.locker.wait();
      return this.client;
    }
    if (this.isConnected) {
      return this.client;
    }
    try {
      const startedAt = Date.now();
      this.locker.lock();
      const client = new Client({
        name: this.name,
        version: "1.0.0",
      });

      let transport: Transport;
      // Create appropriate transport based on server config type
      if (isMaybeStdioConfig(this.serverConfig)) {
        const config = MCPStdioConfigZodSchema.parse(this.serverConfig);
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: config.env,
          cwd: process.cwd(),
        });
      } else if (isMaybeApiKeyConfig(this.serverConfig)) {
        // API key configuratie voor directe API-verbindingen
        const config = MCPApiKeyConfigZodSchema.parse(this.serverConfig);
        
        // Voor algemene API verbindingen gebruiken we een custom transport
        // die werkt door HTTP requests te proxyen naar de gewenste API
        const apiProxyTransport = new APIProxyTransport(config.apiKey, config.baseURL);
        transport = apiProxyTransport;
      } else if (isMaybeUrlConfig(this.serverConfig)) {
        // URL-only configuratie (vereenvoudigde SSE zonder headers)
        const config = MCPUrlConfigZodSchema.parse(this.serverConfig);
        
        // Controleer of de URL begint met "api://" en pas aan indien nodig
        let urlString = config.url;
        if (urlString.startsWith("api://")) {
          urlString = "https://" + urlString.substring(6);
          this.log.info(`Converting api:// URL to https:// - ${urlString}`);
        }
        
        const url = new URL(urlString);
        transport = new SSEClientTransport(url);
      } else if (isMaybeSseConfig(this.serverConfig)) {
        const config = MCPSseConfigZodSchema.parse(this.serverConfig);
        
        // Controleer of de URL begint met "api://" en pas aan indien nodig
        let urlString = config.url;
        if (urlString.startsWith("api://")) {
          urlString = "https://" + urlString.substring(6);
          this.log.info(`Converting api:// URL to https:// - ${urlString}`);
        }
        
        const url = new URL(urlString);
        transport = new SSEClientTransport(url, {
          requestInit: {
            headers: config.headers,
          },
        });
      } else {
        throw new Error("Invalid server config");
      }

      await client.connect(transport);
      client.onerror = this.log.error;
      this.log.debug(
        `Connected to MCP server in ${((Date.now() - startedAt) / 1000).toFixed(2)}s`,
      );
      this.isConnected = true;
      this.error = undefined;
      this.client = client;
      const toolResponse = await client.listTools();
      this.toolInfo = toolResponse.tools.map(
        (tool) =>
          ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          }) as MCPToolInfo,
      );

      // Create AI SDK tool wrappers for each MCP tool
      this.tools = toolResponse.tools.reduce((prev, _tool) => {
        const parameters = jsonSchema(
          toAny({
            ..._tool.inputSchema,
            properties: _tool.inputSchema.properties ?? {},
            additionalProperties: false,
          }),
        );
        prev[_tool.name] = tool({
          parameters,
          description: _tool.description,
          execute: async (params, options: ToolExecutionOptions) => {
            options?.abortSignal?.throwIfAborted();
            
            try {
              this.log.debug("tool call", _tool.name, params);
              
              // Get or generate a tool call ID
              const toolCallId = options?.toolCallId || `${_tool.name}_${Date.now()}`;
              
              // Call the tool
              const result = await client.callTool({
                name: _tool.name,
                arguments: params as Record<string, unknown>,
              });
              
              // Format the result according to the expected structure
              return { 
                toolCallId, 
                result: result ?? null 
              };
            } catch (error) {
              this.log.error("Tool call failed", _tool.name, error);
              return { 
                toolCallId: options?.toolCallId || `error_${_tool.name}_${Date.now()}`,
                result: { error: error instanceof Error ? error.message : String(error) }
              };
            }
          },
        });
        return prev;
      }, {});
    } catch (error) {
      this.log.error(error);
      this.isConnected = false;
      this.error = error;
    }

    this.locker.unlock();
    return this.client;
  }

  async disconnect() {
    if (this.isConnected) {
      this.log.debug("Disconnecting from MCP server");
      await this.locker.wait();
      this.isConnected = false;
      const client = this.client;
      this.client = undefined;
      await client?.close().catch((e) => this.log.error(e));
    }
  }
}

/**
 * Factory function to create a new MCP client
 */
export const createMCPClient = (
  name: string,
  serverConfig: MCPServerConfig,
): MCPClient => new MCPClient(name, serverConfig);

/**
 * Custom API Proxy Transport class voor directe API-verbindingen
 * Dit maakt het mogelijk om HTTP requests te sturen naar een API endpoint
 * en de responses om te zetten naar MCP-compatibele responses
 */
class APIProxyTransport implements Transport {
  private apiKey: string;
  private baseURL?: string;
  private handler?: (message: unknown) => void;
  private errorHandler?: (error: Error) => void;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async connect(options: {
    onmessage: (message: unknown) => void;
    onerror: (error: Error) => void;
  }): Promise<void> {
    this.handler = options.onmessage;
    this.errorHandler = options.onerror;
    
    // Creëer dynamische tools op basis van de baseURL
    const toolsCapabilities: Record<string, any> = {};
    
    // Standaard httpRequest tool voor alle API-verbindingen
    toolsCapabilities.httpRequest = {
      name: "httpRequest",
      description: "Make an HTTP request to any API endpoint",
      inputSchema: {
        type: "object",
        properties: {
          method: {
            type: "string",
            description: "HTTP method (GET, POST, PUT, DELETE, etc.)",
          },
          url: {
            type: "string",
            description: "URL to send the request to",
          },
          headers: {
            type: "object",
            description: "HTTP headers to include",
            additionalProperties: { type: "string" },
          },
          body: {
            type: "object",
            description: "Body to send with the request",
          }
        },
        required: ["method", "url"],
      }
    };
    
    // Voeg specifieke tools toe voor bekende API's
    if (this.baseURL && this.baseURL.includes("github.com")) {
      toolsCapabilities.github_repos = {
        name: "github_repos",
        description: "List GitHub repositories for the authenticated user",
        inputSchema: {
          type: "object",
          properties: {
            visibility: {
              type: "string",
              description: "Filter repositories by visibility (all, public, private)"
            },
            sort: {
              type: "string",
              description: "Sort by field (created, updated, pushed, full_name)"
            }
          }
        }
      };
      
      toolsCapabilities.github_user = {
        name: "github_user",
        description: "Get information about a GitHub user",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "GitHub username to get information about"
            }
          }
        }
      };
    }
    
    // Stuur een "connected" bericht naar de client
    this.handler?.({
      jsonrpc: "2.0",
      id: 0,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          resources: {},
          tools: toolsCapabilities,
          prompts: {},
        },
        serverInfo: {
          name: this.baseURL ? `API Proxy (${new URL(this.baseURL).hostname})` : "API Proxy",
          version: "1.0.0",
        },
      },
    });
    
    return Promise.resolve();
  }

  // Implementeer de start methode die vereist wordt door de Transport interface
  async start(): Promise<void> {
    // Voor deze implementatie is er geen speciale startup logica nodig
    // omdat we direct requests maken naar API endpoints
    return Promise.resolve();
  }

  async send(message: unknown): Promise<void> {
    if (typeof message !== "object" || message === null) {
      this.errorHandler?.(new Error("Invalid message format"));
      return;
    }

    try {
      const typedMessage = message as Record<string, any>;
      
      // Verwerk inkomende verzoeken en zet ze om naar REST API calls
      if (typedMessage.method === "call" && typedMessage.params) {
        // Dit is een tool-aanroep naar de MCP, haal de tool naam en argumenten op
        const { name, arguments: args } = typedMessage.params;
        
        // Bepaal de juiste HTTP-methode op basis van de tool naam
        // Standaard uitgaan van HTTP GET of POST, afhankelijk van of er argumenten zijn
        let method = "GET";
        let endpoint = "";
        let body = undefined;
        
        // Transformeer de tool call naar een API endpoint call
        // Dit kunnen we uitbreiden voor specifieke tools zoals GitHub API
        if (name.startsWith("github_")) {
          // GitHub API specifieke mapping
          const apiPath = name.replace("github_", "");
          endpoint = `/${apiPath}`;
          
          if (Object.keys(args).length > 0) {
            method = "POST";
            body = args;
          }
        } else {
          // Generieke afhandeling voor andere API calls
          endpoint = `/${name}`;
          
          if (Object.keys(args).length > 0) {
            method = "POST";
            body = args;
          }
        }
        
        // Voer de HTTP request uit
        const requestHeaders = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
        };
        
        const fullUrl = `${this.baseURL || ""}${endpoint}`;
        
        this.handler?.({
          jsonrpc: "2.0",
          id: typedMessage.id,
          result: {
            status: 200,
            data: {
              message: `Executing API call to ${fullUrl}`,
              method,
              body
            }
          }
        });
        
        const response = await fetch(fullUrl, {
          method,
          headers: requestHeaders,
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        
        // Analyseer de response
        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        // Stuur het resultaat terug naar de client
        this.handler?.({
          jsonrpc: "2.0",
          id: typedMessage.id,
          result: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          }
        });
      } else if (typedMessage.method === "httpRequest" && typedMessage.params) {
        // Direct HTTP-verzoek afhandelen (dit is de oorspronkelijke implementatie)
        const { method, url, headers = {}, body } = typedMessage.params;
        
        // Controleer of we een basis URL moeten gebruiken
        const fullUrl = this.baseURL ? 
          (url.startsWith("/") ? `${this.baseURL}${url}` : `${this.baseURL}/${url}`) : 
          url;
        
        // Voeg API key toe aan headers als deze is opgegeven
        const requestHeaders = {
          ...headers,
          ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
        };
        
        // Voer de HTTP request uit
        const response = await fetch(fullUrl, {
          method,
          headers: requestHeaders,
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        
        // Analyseer de response
        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        // Stuur het resultaat terug naar de client
        this.handler?.({
          jsonrpc: "2.0",
          id: typedMessage.id,
          result: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          }
        });
      } else if (typedMessage.method === "listTools") {
        // Stuur een lijst van beschikbare tools terug gebaseerd op de API
        // Voor GitHub specifiek kunnen we een aantal handige tools toevoegen
        
        const tools: Array<{
          name: string;
          description: string;
          inputSchema: {
            type: string;
            properties: Record<string, any>;
            required?: string[];
          }
        }> = [];
        
        // Voorbeeld tools voor GitHub API
        if (this.baseURL && this.baseURL.includes("github.com")) {
          tools.push({
            name: "github_repos",
            description: "List GitHub repositories for the authenticated user",
            inputSchema: {
              type: "object",
              properties: {
                visibility: {
                  type: "string",
                  description: "Filter repositories by visibility (all, public, private)",
                  enum: ["all", "public", "private"]
                },
                sort: {
                  type: "string",
                  description: "Sort by field (created, updated, pushed, full_name)",
                  enum: ["created", "updated", "pushed", "full_name"]
                }
              }
            }
          });
          
          tools.push({
            name: "github_user",
            description: "Get information about a GitHub user",
            inputSchema: {
              type: "object",
              properties: {
                username: {
                  type: "string",
                  description: "GitHub username to get information about"
                }
              }
            }
          });
        } else {
          // Generieke tools voor andere API's
          tools.push({
            name: "http_request",
            description: "Make an HTTP request to the API",
            inputSchema: {
              type: "object",
              properties: {
                method: {
                  type: "string",
                  description: "HTTP method (GET, POST, PUT, DELETE)",
                  enum: ["GET", "POST", "PUT", "DELETE"]
                },
                endpoint: {
                  type: "string",
                  description: "API endpoint path"
                },
                data: {
                  type: "object",
                  description: "Data to send with the request"
                }
              },
              required: ["method", "endpoint"]
            }
          });
        }
        
        // Stuur de lijst van tools terug
        this.handler?.({
          jsonrpc: "2.0",
          id: typedMessage.id,
          result: {
            tools
          }
        });
      } else {
        // Als het geen ondersteunde methode is, stuur een error terug
        this.errorHandler?.(new Error(`Unsupported method: ${typedMessage.method}`));
      }
    } catch (error) {
      this.errorHandler?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async close(): Promise<void> {
    this.handler = undefined;
    this.errorHandler = undefined;
    return Promise.resolve();
  }
}
