import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { NextRequest, NextResponse } from "next/server";

// Initialize OAuth app authentication
const auth = createOAuthAppAuth({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

// OAuth callback route to handle authorization code
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=no_code`);
  }

  try {
    // Exchange authorization code for access token
    const userAuthentication = await auth({
      type: "oauth-user",
      code: code,
      state: state || undefined,
    });

    // In a real application, you would:
    // 1. Store the token securely (database, encrypted session, etc.)
    // 2. Create a user session
    // 3. Redirect to a success page
    
    // For now, we'll redirect with the token in the URL (NOT recommended for production)
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
    redirectUrl.searchParams.set("token", userAuthentication.token);
    redirectUrl.searchParams.set("scopes", userAuthentication.scopes?.join(",") || "");
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth authentication error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=auth_failed`);
  }
}
