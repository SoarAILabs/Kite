"use client";

import { useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const handleOAuthLogin = () => {
    setIsLoading(true);
    // Redirect to OAuth initiation endpoint
    window.location.href = "/api/oauth";
  };

  const fetchIssues = async () => {
    if (!token || !owner || !repo) {
      alert("Please provide token, owner, and repo");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/github?owner=${owner}&repo=${repo}&token=${token}`
      );
      const data = await response.json();

      if (response.ok) {
        setIssues(data.issues);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to fetch issues");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          GitHub OAuth Integration Demo
        </h1>

        {/* OAuth Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Step 1: Authenticate with GitHub
          </h2>
          <p className="text-gray-600 mb-4">
            Click the button below to start the OAuth flow and get an access
            token.
          </p>
          <button
            onClick={handleOAuthLogin}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Redirecting..." : "Login with GitHub"}
          </button>
        </div>

        {/* Token Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Step 2: Use Your Token</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token (from OAuth callback)
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your GitHub access token here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository Owner
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g., microsoft"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g., vscode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={fetchIssues}
              disabled={isLoading || !token || !owner || !repo}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Fetching..." : "Fetch Issues"}
            </button>
          </div>
        </div>

        {/* Issues Display */}
        {issues.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Repository Issues</h2>
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        #{issue.number} opened by {issue.user.login}
                      </p>
                      {issue.body && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                          {issue.body}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          issue.state === "open"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {issue.state}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
