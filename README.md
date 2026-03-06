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

1. Clone, build, and run in one command:
   ```bash
   git clone https://github.com/<your-org>/snippet-bin.git
   cd snippet-bin
   docker compose up --build
   ```
2. After the containers finish building you can visit the same URLs as the dev setup:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
3. Stop the stack with `docker compose down`, or use `docker compose down -v` if you want to remove the persisted data directories and start fresh.

The Compose file already exposes both services, mounts `server/data` for the SQLite database (or git-backed storage), and reads `server/.env` + `client/.env`. If you want to override any variables before starting:

- `SNIPPETBIN_DB_PATH`: path to the `sql.js` database file (default `data/snippetbin.db`)
- `JWT_SECRET`: token secret used by the API (required for production)
- `STORAGE_BACKEND`: `sqlite` or `git`; git mode also respects `STORAGE_GISTS_DIR`
- `STORAGE_GISTS_DIR`: directory where bare repositories are stored when `STORAGE_BACKEND=git`

> [!NOTE]
> Create `server/.env` and `client/.env` files containing the values you need (for example, `JWT_SECRET=replace-with-a-secure-value`). The directories are already mounted into the containers, so edits to `.env` happen outside of Docker.
>
> Check example `.env.example` files in the repo for more details.

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

- **Backend**: Node.js, Express, SQLite (sql.js), Git expected to be installed on the host machine (included in docker)
- **Frontend**: pnpm, React, Vite, Tailwind CSS
- **Deployment**: Docker, Docker Compose

## Disclaimer

- **Trademarks**: "GitHub" and "Gist" are trademarks of GitHub, Inc. This project is not endorsed by, affiliated with, or sponsored by GitHub, Inc. References to GitHub Gists are for descriptive purposes only.
- **User content**: Operators who self-host Snippet-bin are solely responsible for the content stored on their instances and for compliance with applicable laws.
- **No warranty**: This software is provided "as is" without warranty of any kind. See the [LICENSE](LICENSE) file for details.

## License

MIT
