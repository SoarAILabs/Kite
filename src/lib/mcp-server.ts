import { routeToolRequest, GITHUB_TOOLS, CUSTOM_TOOLS } from "../tools/router";

// MCP Server configuration and utilities
export class MCPServer {
  private static instance: MCPServer;
  
  private constructor() {}
  
  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer();
    }
    return MCPServer.instance;
  }
  
  // Get all available tools
  public getAllTools() {
    return {
      github: GITHUB_TOOLS,
      custom: CUSTOM_TOOLS,
      total: GITHUB_TOOLS.length + CUSTOM_TOOLS.length,
    };
  }
  
  // Route a tool request
  public routeRequest(toolName: string, parameters: any) {
    const route = routeToolRequest(toolName);
    
    return {
      route,
      toolName,
      parameters,
      isValid: route !== 'unknown',
    };
  }
  
  // Get server information
  public getServerInfo() {
    return {
      name: "Kite MCP Server",
      description: "Custom MCP server with GitHub integration and custom tools",
      version: "1.0.0",
      capabilities: {
        githubIntegration: true,
        customTools: true,
      },
      tools: this.getAllTools(),
    };
  }
}

// Export singleton instance
export const mcpServer = MCPServer.getInstance();
