#!/usr/bin/env node

/**
 * Test GitHub Authentication Tool
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

async function testGitHubAuth() {
  console.log('🔐 Testing GitHub Authentication Tool...\n');
  
  try {
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 'test-github-auth',
      method: 'tools/call',
      params: {
        name: 'github-auth',
        arguments: {
          action: 'initiate'
        }
      }
    };
    
    console.log('📤 Sending MCP request to GitHub auth tool...');
    const response = await makeRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, JSON.stringify(mcpRequest));
    
    console.log('📥 Response received:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.result && response.result.content) {
      console.log('\n✅ GitHub Authentication Tool Response:');
      response.result.content.forEach(content => {
        if (content.type === 'text') {
          console.log(content.text);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing GitHub auth:', error.message);
  }
}

// Run the test
testGitHubAuth();
