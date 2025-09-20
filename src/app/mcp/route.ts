import { NextRequest, NextResponse } from 'next/server';
import { routeToolRequest, GITHUB_TOOLS, CUSTOM_TOOLS } from '../../tools/router';
import commitSplitter from '../../tools/commitSplitter';
import greet from '../../tools/greet';
import githubProxy from '../../tools/githubProxy';

// Import tool modules for metadata
import * as commitSplitterModule from '../../tools/commitSplitter';
import * as greetModule from '../../tools/greet';
import * as githubProxyModule from '../../tools/githubProxy';

// Tool registry
const toolHandlers = {
  'commit-splitter': commitSplitter,
  'greet': greet,
  'github-proxy': githubProxy,
};

// Tool modules for metadata
const toolModules = {
  'commit-splitter': commitSplitterModule,
  'greet': greetModule,
  'github-proxy': githubProxyModule,
};

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Kite MCP Server is running',
    availableTools: CUSTOM_TOOLS,
    githubTools: GITHUB_TOOLS
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle MCP tool listing
    if (body.method === 'tools/list') {
      const tools = Object.keys(toolHandlers).map(name => {
        const module = toolModules[name as keyof typeof toolModules];
        return {
          name,
          description: module.metadata?.description || 'No description available',
          inputSchema: module.schema || { type: 'object', properties: {} }
        };
      });
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: { tools }
      });
    }
    
    // Handle MCP tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      // Check if tool exists in our registry
      if (name in toolHandlers) {
        const handler = toolHandlers[name as keyof typeof toolHandlers];
        const result = await handler(args);
        
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result
        });
      }
      
      // Route to appropriate tool handler for GitHub tools
      const route = routeToolRequest(name);
      
      if (route === 'github') {
        // GitHub tools should be called through github-proxy
        const result = await githubProxy({ toolName: name, parameters: args });
        
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result
        });
      }
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32601,
          message: `Unknown tool: ${name}. Available tools: ${Object.keys(toolHandlers).join(', ')}`
        }
      });
    }
    
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 'error',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
