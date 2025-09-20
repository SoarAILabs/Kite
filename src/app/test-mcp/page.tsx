"use client";

import { useState } from "react";

export default function TestMCPPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Helper function to parse MCP response (handles both JSON and SSE)
  const parseMCPResponse = async (response: Response): Promise<string> => {
    const text = await response.text();

    // Debug info
    const debugInfo = `Status: ${response.status}\nContent-Type: ${response.headers.get("content-type")}\n\n`;

    // Check if response is SSE format
    if (text.startsWith("event:")) {
      // Parse SSE format
      const lines = text.split("\n");
      const dataLine = lines.find((line) => line.startsWith("data:"));
      if (dataLine) {
        const jsonData = dataLine.replace("data: ", "");
        try {
          const data = JSON.parse(jsonData);
          return debugInfo + JSON.stringify(data, null, 2);
        } catch (e) {
          return debugInfo + `SSE Data (not JSON):\n${jsonData}`;
        }
      } else {
        return debugInfo + `SSE Response:\n${text}`;
      }
    } else {
      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        return debugInfo + JSON.stringify(data, null, 2);
      } catch (e) {
        return debugInfo + `Response (not JSON):\n${text}`;
      }
    }
  };

  const testCustomTool = async () => {
    setLoading(true);
    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "commit-splitter",
            arguments: {
              commitMessage: "Add new feature and fix multiple bugs",
            },
          },
        }),
      });

      const result = await parseMCPResponse(response);
      setResult(result);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGreetTool = async () => {
    setLoading(true);
    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "greet",
            arguments: {
              name: "Amaan",
            },
          },
        }),
      });

      const result = await parseMCPResponse(response);
      setResult(result);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGitHubProxy = async () => {
    setLoading(true);
    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "search_repositories",
            arguments: {
              query: "react",
              limit: 3,
            },
          },
        }),
      });

      const result = await parseMCPResponse(response);
      setResult(result);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const listTools = async () => {
    setLoading(true);
    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/list",
          params: {},
        }),
      });

      const result = await parseMCPResponse(response);
      setResult(result);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Kite MCP Server Test</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={testCustomTool}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Commit Splitter Tool
        </button>

        <button
          onClick={testGreetTool}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Greet Tool
        </button>

        <button
          onClick={testGitHubProxy}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test GitHub Proxy Tool
        </button>

        <button
          onClick={listTools}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          List Available Tools
        </button>
      </div>

      {loading && <div className="text-blue-600 mb-4">Loading...</div>}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Run <code>npm run dev</code>
          </li>
          <li>Test the tools above!</li>
        </ol>
      </div>
    </div>
  );
}
