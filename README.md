# Snippet-bin

A self-hosted, open-source snippet management application inspired by GitHub Gists, built with Node.js, React, and Tailwind CSS.

> [!NOTE]
> Snippet-bin is a completely self-hosted snippet management solution and is not associated with, endorsed by, or affiliated with GitHub, Inc. in any way.

## Features

- Create, edit, and delete code snippets (gists)
- Multiple files per gist
- Public or private snippets
- Syntax highlighting
- Star your favorite gists
- Token-based API authentication (salted & hashed)
- REST API inspired by the GitHub Gists API

## Demo

A video demonstration of the Snippet-bin features:

![Snippet-bin Product Demo](docs/product-demo.webm)

## Quick Start

### Development Mode

1. Start the backend server:

   ```bash
   cd server
   pnpm install
   pnpm run dev
   ```

2. Start the frontend (in a new terminal):

   ```bash
   cd client
   pnpm install
   pnpm run dev
   ```

3. Open http://localhost:5173 in your browser

### Docker Deployment

Run the pre-built image from Docker Hub:

```bash
docker run -d \
  -p 3001:3001 \
  -p 5173:80 \
  -v snippet-bin-data:/app/server/data \
  -e JWT_SECRET=replace-with-a-secure-value \
  --name snippet-bin \
  sanusart/snippet-bin
```

Then visit:

- Frontend: http://localhost:5173
- API: http://localhost:3001

**Environment variables** (optional):

- `JWT_SECRET`: token secret used by the API (required for production)
- `STORAGE_BACKEND`: `sqlite` or `git` (default: `sqlite`)
- `SNIPPETBIN_DB_PATH`: path to the database file (default: `data/snippetbin.db`)

**Data persistence**: The `-v snippet-bin-data:/app/server/data` flag persists your data across container restarts.

**Build from source**:

```bash
git clone https://github.com/sanusart/snippet-bin.git
cd snippet-bin
docker build -t sanusart/snippet-bin .
docker run -d -p 3001:3001 -p 5173:80 sanusart/snippet-bin
```

## API Usage

### Authentication

Register a new user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "youruser", "password": "yourpassword"}'
```

Login:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "youruser", "password": "yourpassword"}'
```

**Note:** Login/register returns an API token prefixed with `sb_tkn_`. Use this token for all authenticated API requests.

### Create a Gist

```bash
curl -X POST http://localhost:3001/api/gists \
  -H "Content-Type: application/json" \
  -H "Authorization: token sb_tkn_your_token_here" \
  -d '{
    "description": "My snippet",
    "public": false,
    "files": {
      "hello.js": {
        "content": "console.log(\"Hello World!\");",
        "language": "javascript"
      }
    }
  }'
```

### List Your Gists

```bash
curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists
```

### Get a Gist

```bash
curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists/GIST_ID
```

### Update a Gist

```bash
curl -X PATCH http://localhost:3001/api/gists/GIST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: token sb_tkn_your_token_here" \
  -d '{
    "description": "Updated description",
    "files": {
      "new-file.py": {
        "content": "print(\"Hello\")",
        "language": "python"
      }
    }
  }'
```

### Delete a Gist

```bash
curl -X DELETE http://localhost:3001/api/gists/GIST_ID \
  -H "Authorization: token sb_tkn_your_token_here"
```

### Star a Gist

```bash
curl -X POST http://localhost:3001/api/gists/GIST_ID/star \
  -H "Authorization: token sb_tkn_your_token_here"
```

### Unstar a Gist

```bash
curl -X DELETE http://localhost:3001/api/gists/GIST_ID/star \
  -H "Authorization: token sb_tkn_your_token_here"
```

### Get Starred Gists

```bash
curl -H "Authorization: token sb_tkn_your_token_here" http://localhost:3001/api/gists/starred
```

### Get User

```bash
curl http://localhost:3001/api/users/username
```

### Update User Name

```bash
curl -X PATCH http://localhost:3001/api/auth/user \
  -H "Content-Type: application/json" \
  -H "Authorization: token sb_tkn_your_existing_token" \
  -d '{"name": "New Display Name"}'
```

### Settings Tabs

The Settings screen now exposes each tab via a dedicated URL: visit `/settings/profile` for the profile panel or `/settings/tokens` for the personal access token controls. The app also redirects `/settings` → `/settings/profile`.

## API Tokens

Create API tokens in the Settings page or via the API. The endpoint accepts two flows:

- **Authenticated:** send `Authorization: token YOUR_JWT_OR_API_TOKEN` and it issues another `sb_tkn_*` token (the raw value is returned only once).
- **Credential exchange:** call the same endpoint without an `Authorization` header but with `{ "email": "...", "password": "..." }` (or `username` instead of email) to swap credentials for a fresh API token.

```bash
curl -X POST http://localhost:3001/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword", "note": "My API token"}'
```

Tokens are securely salted and hashed using PBKDF2 (100,000 iterations).

You can also import `/postman-collection.json` into Postman to explore the endpoints via the provided requests.

## Tech Stack

- **Backend**: Node.js, Express, SQLite (sql.js), Git (included in docker image)
- **Frontend**: pnpm, React, Vite, Tailwind CSS
- **Deployment**: Docker

## Disclaimer

- **Trademarks**: "GitHub" and "Gist" are trademarks of GitHub, Inc. This project is not endorsed by, affiliated with, or sponsored by GitHub, Inc. References to GitHub Gists are for descriptive purposes only.
- **User content**: Operators who self-host Snippet-bin are solely responsible for the content stored on their instances and for compliance with applicable laws.
- **No warranty**: This software is provided "as is" without warranty of any kind. See the [LICENSE](LICENSE) file for details.

## License

MIT
