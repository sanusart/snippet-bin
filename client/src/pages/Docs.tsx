import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Docs() {
  const apiUsage = [
    {
      title: 'Authentication',
      description:
        'Register a new user or login to get an API token. Tokens are prefixed with `sb_tkn_`. Use this token in the `Authorization` header for all authenticated requests.',
      endpoints: [
        {
          name: 'Register',
          method: 'POST',
          url: '/api/auth/register',
          body: JSON.stringify({ username: 'youruser', password: 'yourpassword' }, null, 2),
          example:
            'curl -X POST http://localhost:3001/api/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d \'{"username": "youruser", "password": "yourpassword"}\'',
        },
        {
          name: 'Login',
          method: 'POST',
          url: '/api/auth/login',
          body: JSON.stringify({ username: 'youruser', password: 'yourpassword' }, null, 2),
          example:
            'curl -X POST http://localhost:3001/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{"username": "youruser", "password": "yourpassword"}\'',
        },
      ],
    },
    {
      title: 'Gists',
      description: 'Manage your gists (snippets).',
      endpoints: [
        {
          name: 'Create a Gist',
          method: 'POST',
          url: '/api/gists',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          body: JSON.stringify(
            {
              description: 'My snippet',
              public: false,
              files: {
                'hello.js': {
                  content: 'console.log("Hello World!");',
                  language: 'javascript',
                },
              },
            },
            null,
            2
          ),
          example: `curl -X POST http://localhost:3001/api/gists \\
  -H "Content-Type: application/json" \\
  -H "Authorization: token sb_tkn_your_token_here" \\
  -d '{
    "description": "My snippet",
    "public": false,
    "files": {
      "hello.js": {
        "content": "console.log(\\"Hello World!\\");",
        "language": "javascript"
      }
    }
  }'`,
        },
        {
          name: 'List Your Gists',
          method: 'GET',
          url: '/api/gists',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists',
        },
        {
          name: 'Get a Gist',
          method: 'GET',
          url: '/api/gists/GIST_ID',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists/GIST_ID',
        },
        {
          name: 'Update a Gist',
          method: 'PATCH',
          url: '/api/gists/GIST_ID',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          body: JSON.stringify(
            {
              description: 'Updated description',
              files: {
                'new-file.py': {
                  content: 'print("Hello")',
                  language: 'python',
                },
              },
            },
            null,
            2
          ),
          example: `curl -X PATCH http://localhost:3001/api/gists/GIST_ID \\
  -H "Content-Type: application/json" \\
  -H "Authorization: token sb_tkn_your_token_here" \\
  -d '{
    "description": "Updated description",
    "files": {
      "new-file.py": {
        "content": "print(\\"Hello\\")",
        "language": "python"
      }
    }
  }'`,
        },
        {
          name: 'Delete a Gist',
          method: 'DELETE',
          url: '/api/gists/GIST_ID',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -X DELETE http://localhost:3001/api/gists/GIST_ID -H "Authorization: token sb_tkn_your_token_here"',
        },
      ],
    },
    {
      title: 'Stars',
      description: 'Star and unstar gists.',
      endpoints: [
        {
          name: 'Star a Gist',
          method: 'POST',
          url: '/api/gists/GIST_ID/star',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -X POST http://localhost:3001/api/gists/GIST_ID/star -H "Authorization: token sb_tkn_your_token_here"',
        },
        {
          name: 'Unstar a Gist',
          method: 'DELETE',
          url: '/api/gists/GIST_ID/star',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -X DELETE http://localhost:3001/api/gists/GIST_ID/star -H "Authorization: token sb_tkn_your_token_here"',
        },
        {
          name: 'Get Starred Gists',
          method: 'GET',
          url: '/api/gists/starred',
          headers: { Authorization: 'token sb_tkn_your_token_here' },
          example:
            'curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists/starred',
        },
      ],
    },
    {
      title: 'Users',
      description: 'Get user information and update profile.',
      endpoints: [
        {
          name: 'Get User',
          method: 'GET',
          url: '/api/users/:username',
          example: 'curl http://localhost:3001/api/users/yourusername',
        },
        {
          name: 'Update User Name',
          method: 'PATCH',
          url: '/api/auth/user',
          headers: { Authorization: 'token sb_tkn_your_token' },
          body: JSON.stringify({ name: 'New Display Name' }, null, 2),
          example: `curl -X PATCH http://localhost:3001/api/auth/user \\
  -H "Content-Type: application/json" \\
  -H "Authorization: token sb_tkn_your_token" \\
  -d '{"name": "New Display Name"}'`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 text-[#e6edf3]">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-xl text-[#8b949e] mb-8">
        Learn how to use the Snippet Bin API to manage your gists programmatically.
      </p>

      {apiUsage.map((section, idx) => (
        <section key={idx} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b border-[#30363d] pb-2">
            {section.title}
          </h2>
          <p className="mb-6 text-[#8b949e]">{section.description}</p>

          <div className="space-y-8">
            {section.endpoints.map((endpoint, eIdx) => (
              <div
                key={eIdx}
                className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden"
              >
                <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        endpoint.method === 'GET'
                          ? 'bg-green-900 text-green-300'
                          : endpoint.method === 'POST'
                            ? 'bg-blue-900 text-blue-300'
                            : endpoint.method === 'PATCH'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    {endpoint.url}
                  </h3>
                  <span className="text-[#8b949e] text-xs">{endpoint.name}</span>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-xs uppercase tracking-wider text-[#8b949e] font-bold mb-2">
                      Example Request
                    </h4>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, borderRadius: '6px', fontSize: '0.875rem' }}
                    >
                      {endpoint.example}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
