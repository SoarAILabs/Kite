import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for GitHub MCP proxy parameters
export const schema = {
  toolName: z.string().describe("The GitHub MCP tool to call"),
  parameters: z.record(z.any()).describe("Parameters for the GitHub MCP tool"),
};

// Define tool metadata
export const metadata = {
  name: "github-proxy",
  description: "Proxy requests to GitHub MCP server for existing GitHub functionality",
  annotations: {
    title: "GitHub MCP Proxy",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function githubProxy({ toolName, parameters }: InferSchema<typeof schema>) {
  try {
    // Map GitHub MCP tools to GitHub API calls (without authentication for public data)
    let result: any;

    switch (toolName) {
      case 'search_repositories':
        const searchResponse = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(parameters.query)}&per_page=${parameters.limit || 10}`);
        result = await searchResponse.json();
        break;

      case 'get_repository':
        const repoResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}`);
        result = await repoResponse.json();
        break;

      case 'get_user':
        const userResponse = await fetch(`https://api.github.com/users/${parameters.username}`);
        result = await userResponse.json();
        break;

      case 'list_issues':
        const issuesResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/issues?state=${parameters.state || 'open'}`);
        result = await issuesResponse.json();
        break;

      case 'list_pull_requests':
        const prsResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/pulls?state=${parameters.state || 'open'}`);
        result = await prsResponse.json();
        break;

      case 'get_file_contents':
        const fileResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/contents/${parameters.path}`);
        result = await fileResponse.json();
        break;

      case 'list_commits':
        const commitsResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/commits?per_page=${parameters.limit || 10}`);
        result = await commitsResponse.json();
        break;

      case 'list_branches':
        const branchesResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/branches`);
        result = await branchesResponse.json();
        break;

      case 'list_tags':
        const tagsResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/tags`);
        result = await tagsResponse.json();
        break;

      case 'list_releases':
        const releasesResponse = await fetch(`https://api.github.com/repos/${parameters.owner}/${parameters.repo}/releases`);
        result = await releasesResponse.json();
        break;

      default:
        return {
          content: [{
            type: "text",
            text: `❌ Unknown GitHub MCP tool: ${toolName}. 

Available tools: search_repositories, get_repository, get_user, list_issues, list_pull_requests, get_file_contents, list_commits, list_branches, list_tags, list_releases

Note: This proxy works with public GitHub data only (no authentication required).`
          }],
        };
    }

    if (!result || result.message) {
      return {
        content: [{
          type: "text",
          text: `❌ GitHub API Error: ${result?.message || 'Unknown error'}

This might be because:
- The repository is private (requires authentication)
- The repository/user doesn't exist
- Rate limiting (GitHub API has rate limits for unauthenticated requests)

For private repositories, you would need to set up authentication.`
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `✅ GitHub MCP Tool: ${toolName}

Result:
${JSON.stringify(result, null, 2)}

Note: This works with public GitHub data only. For private repositories, authentication would be required.`
      }],
    };

  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `❌ Error calling GitHub MCP tool ${toolName}: ${error.message}

This might be due to:
- Network connectivity issues
- Invalid parameters
- GitHub API rate limiting

Try again later or check your parameters.`
      }],
    };
  }
}
