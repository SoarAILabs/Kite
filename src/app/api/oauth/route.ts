import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { NextRequest, NextResponse } from "next/server";

// Initialize OAuth app authentication
const auth = createOAuthAppAuth({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

// Route to initiate OAuth web flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri") || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;
  
  try {
    // Generate authorization URL for OAuth web flow
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent("repo user read:org")}&` +
      `state=${encodeURIComponent("oauth_state_" + Date.now())}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
