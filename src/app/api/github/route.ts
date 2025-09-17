import { Octokit } from "octokit";
import { NextRequest, NextResponse } from "next/server";

// Function to create authenticated Octokit instance
function createAuthenticatedOctokit(token: string) {
  return new Octokit({ 
    auth: token,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

// Function to list issues for a repository
async function listIssues(owner: string, repo: string, token: string) {
  const octokit = createAuthenticatedOctokit(token);
  
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open'
    });
    return data;
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}

// API route handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const token = searchParams.get("token");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repo parameters are required" },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "Authentication token is required" },
      { status: 401 }
    );
  }

  try {
    const issues = await listIssues(owner, repo, token);
    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error("GitHub API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues from GitHub" },
      { status: 500 }
    );
  }
}