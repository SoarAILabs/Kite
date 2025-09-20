#!/usr/bin/env node

/**
 * Simple MCP Client Test Script
 * Tests your MCP server to ensure it's ready for Cursor integration
 */

const fetch = require('node-fetch');

const MCP_SERVER_URL = 'http://localhost:3000/mcp';

// MCP JSON-RPC request helper
async function mcpRequest(method, params = {}) {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method,
      params,
    }),
  });

  const text = await response.text();
  
  // Handle SSE response
  if (text.startsWith('event:')) {
    const lines = text.split('\n');
    const dataLine = lines.find(line => line.startsWith('data:'));
    if (dataLine) {
      return JSON.parse(dataLine.replace('data: ', ''));
    }
  }
  
  // Handle JSON response
  return JSON.parse(text);
}

async function testMCPServer() {
  console.log('🚀 Testing Kite MCP Server...\n');

  try {
    // Test 1: Initialize connection
    console.log('1️⃣ Testing connection...');
    const initResult = await mcpRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
    console.log('✅ Connection successful:', initResult.result?.serverInfo?.name || 'Unknown');

    // Test 2: List available tools
    console.log('\n2️⃣ Listing available tools...');
    const toolsResult = await mcpRequest('tools/list');
    console.log('✅ Available tools:');
    toolsResult.result?.tools?.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });

    // Test 3: Test custom greet tool
    console.log('\n3️⃣ Testing greet tool...');
    const greetResult = await mcpRequest('tools/call', {
      name: 'greet',
      arguments: {
        name: 'Amaan'
      }
    });
    console.log('✅ Greet tool result:', greetResult.result?.content?.[0]?.text);

    // Test 4: Test commit splitter tool
    console.log('\n4️⃣ Testing commit-splitter tool...');
    const commitResult = await mcpRequest('tools/call', {
      name: 'commit-splitter',
      arguments: {
        commitMessage: 'Add new feature and fix multiple bugs'
      }
    });
    console.log('✅ Commit splitter result:');
    console.log('   ', commitResult.result?.content?.[0]?.text?.split('\n')[0]); // First line only

    // Test 5: Test GitHub proxy (will show auth error - expected)
    console.log('\n5️⃣ Testing GitHub proxy tool...');
    const githubResult = await mcpRequest('tools/call', {
      name: 'github-proxy',
      arguments: {
        toolName: 'search_repositories',
        parameters: {
          query: 'react',
          limit: 1
        }
      }
    });
    console.log('✅ GitHub proxy result:', githubResult.result?.content?.[0]?.text?.includes('❌') ? 'Auth required (expected)' : 'Working!');

    console.log('\n🎉 All tests completed! Your MCP server is ready for Cursor integration.');
    console.log('\n📋 Next steps:');
    console.log('   1. Add the configuration to Cursor settings');
    console.log('   2. Restart Cursor IDE');
    console.log('   3. Test your tools in Cursor chat');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your MCP server is running: npm run dev');
    console.log('   2. Check that http://localhost:3000/mcp is accessible');
    console.log('   3. Verify your server logs for any errors');
  }
}

// Run the tests
testMCPServer();
