# Snippet-bin

A GitHub Gists-style snippet management application built with Node.js, React, and Tailwind CSS.

## Features

- Create, edit, and delete code snippets (gists)
- Multiple files per gist
- Public or private snippets
- Syntax highlighting
- Star your favorite gists
- Token-based API authentication (salted & hashed)
- Full REST API compatible with GitHub Gists API

## Quick Start

### Development Mode

1. Start the backend server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### Docker Deployment

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

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

## API Tokens

Create API tokens in the Settings page or via the API:

```bash
curl -X POST http://localhost:3001/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: token sb_tkn_your_token_here" \
  -d '{"note": "My API token"}'
```

Tokens are securely salted and hashed using PBKDF2 (100,000 iterations).

## Tech Stack

- **Backend**: Node.js, Express, SQLite (sql.js)
- **Frontend**: React 18, Vite, Tailwind CSS
- **Authentication**: Salted & hashed API tokens (PBKDF2)
- **Deployment**: Docker, Docker Compose

## License

MIT
