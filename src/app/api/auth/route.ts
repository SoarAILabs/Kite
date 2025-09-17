import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { NextRequest, NextResponse } from "next/server";

// Initialize OAuth app authentication
const auth = createOAuthAppAuth({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

// Route to initiate OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "login") {
    // For OAuth web flow, we need to redirect to GitHub's authorization URL
    // This should be handled by the /api/oauth endpoint instead
    return NextResponse.redirect("/api/oauth");
  }

  // Handle OAuth callback
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Authorization code not provided" }, { status: 400 });
  }

  try {
    // Exchange authorization code for access token
    const userAuthentication = await auth({
      type: "oauth-user",
      code: code,
      state: state || undefined,
    });

    // Return user authentication info (in production, you'd store this securely)
    return NextResponse.json({
      success: true,
      token: userAuthentication.token,
      tokenType: userAuthentication.tokenType,
      scopes: userAuthentication.scopes,
    });
  } catch (error) {
    console.error("OAuth authentication error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with GitHub" },
      { status: 500 }
    );
  }
}