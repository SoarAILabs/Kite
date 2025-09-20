#!/usr/bin/env node

/**
 * Test List Available Tools
 */

const https = require('https');
const http = require('http');

// Simple HTTP request function
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function listTools() {
  console.log('🔧 Listing Available MCP Tools...\n');
  
  try {
    // First, initialize the connection
    const initRequest = {
      jsonrpc: '2.0',
      id: 'init',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };
    
    console.log('📤 Initializing MCP connection...');
    const initResponse = await makeRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, JSON.stringify(initRequest));
    
    console.log('📥 Init response:', JSON.stringify(initResponse, null, 2));
    
    // Now list tools
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 'list-tools',
      method: 'tools/list',
      params: {}
    };
    
    console.log('\n📤 Requesting tools list...');
    const toolsResponse = await makeRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, JSON.stringify(toolsRequest));
    
    console.log('📥 Tools response:');
    console.log(JSON.stringify(toolsResponse, null, 2));
    
    if (toolsResponse.result && toolsResponse.result.tools) {
      console.log('\n✅ Available Tools:');
      toolsResponse.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing tools:', error.message);
  }
}

// Run the test
listTools();
