// Tool routing configuration
export const GITHUB_TOOLS = [
  'search_repositories',
  'get_repository',
  'get_user',
  'list_issues',
  'list_pull_requests',
  'get_file_contents',
  'list_commits',
  'list_branches',
  'list_tags',
  'list_releases',
];

export const CUSTOM_TOOLS = [
  'commit-splitter',
  'greet',
  'github-proxy',
];

// Route tool requests to appropriate handler
export function routeToolRequest(toolName: string): 'github' | 'custom' | 'unknown' {
  if (GITHUB_TOOLS.includes(toolName)) {
    return 'github';
  } else if (CUSTOM_TOOLS.includes(toolName)) {
    return 'custom';
  }
  return 'unknown';
}

// Get tool description based on routing
export function getToolDescription(toolName: string): string {
  const route = routeToolRequest(toolName);
  
  switch (route) {
    case 'github':
      return `GitHub MCP tool: ${toolName} - Proxied through GitHub's public API`;
    case 'custom':
      return `Custom tool: ${toolName} - Implemented locally in this MCP server`;
    case 'unknown':
      return `Unknown tool: ${toolName} - Not available in this MCP server`;
  }
}

// Validate tool parameters based on routing
export function validateToolParameters(toolName: string, parameters: any): boolean {
  const route = routeToolRequest(toolName);
  
  if (route === 'unknown') {
    return false;
  }
  
  // Add specific validation logic here if needed
  // For now, just return true for known tools
  return true;
}
