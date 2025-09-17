# GitHub OAuth Web Application Flow Setup

This project implements a GitHub OAuth web application flow using `@octokit/auth-oauth-app`.

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# GitHub OAuth App Configuration
# Get these from https://github.com/settings/applications/new

# OAuth App Client ID
GITHUB_CLIENT_ID=your_github_client_id_here

# OAuth App Client Secret
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Base URL for your application (for OAuth redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: GitHub Personal Access Token (for server-side operations)
GITHUB_TOKEN=your_github_personal_access_token_here
```

## GitHub OAuth App Setup

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in the following:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** to your `.env.local` file

## API Endpoints

### OAuth Flow

- **`GET /api/oauth`** - Initiates OAuth flow, redirects to GitHub
- **`GET /api/auth/callback`** - Handles OAuth callback from GitHub
- **`GET /api/auth`** - Alternative auth endpoint with action parameter

### GitHub API

- **`GET /api/github?owner=OWNER&repo=REPO&token=TOKEN`** - Fetches issues from a repository

## Usage Flow

1. **Start OAuth Flow**: Visit `/api/oauth` or click "Login with GitHub" on the homepage
2. **Authorize**: GitHub will redirect you to authorize the application
3. **Get Token**: After authorization, you'll be redirected to `/dashboard` with your access token
4. **Use Token**: Use the token to make authenticated GitHub API calls

## Example Usage

```typescript
// Initiate OAuth flow
window.location.href = '/api/oauth';

// Use token to fetch issues
const response = await fetch('/api/github?owner=microsoft&repo=vscode&token=YOUR_TOKEN');
const data = await response.json();
```

## Security Notes

- **Never expose client secrets** in client-side code
- **Store tokens securely** in production (database, encrypted sessions)
- **Use HTTPS** in production
- **Validate state parameter** to prevent CSRF attacks
- **Implement proper session management** for production use

## Dependencies

- `@octokit/auth-oauth-app` - OAuth authentication
- `octokit` - GitHub API client
- `next` - React framework
