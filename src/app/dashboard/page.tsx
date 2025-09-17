"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [scopes, setScopes] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const scopesParam = searchParams.get("scopes");

    if (tokenParam) {
      setToken(tokenParam);
    }
    if (scopesParam) {
      setScopes(scopesParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          OAuth Success! 🎉
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Authentication Details</h2>

          {token ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm break-all">
                  {token}
                </div>
              </div>

              {scopes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes
                  </label>
                  <div className="bg-gray-100 p-3 rounded-md">
                    {scopes.split(",").map((scope, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <a
                  href="/"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
                >
                  ← Back to Home
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No authentication token found.
              </p>
              <a
                href="/api/oauth"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
              >
                Start OAuth Flow
              </a>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ⚠️ Security Note
          </h3>
          <p className="text-yellow-700 text-sm">
            In a production application, you should never expose access tokens
            in URLs. Instead, store them securely in your database or encrypted
            sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
