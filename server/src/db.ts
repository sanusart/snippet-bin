/* eslint-disable @typescript-eslint/no-explicit-any */
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultDbPath = join(__dirname, '..', 'data', 'snippetbin.db');
const envDbPath = process.env.SNIPPETBIN_DB_PATH;
const useMemoryDb = envDbPath === 'memory';
const dbPath = useMemoryDb ? null : envDbPath || defaultDbPath;
const shouldPersist = Boolean(dbPath);

const SQL = await initSqlJs();

let db: initSqlJs.Database;

if (shouldPersist) {
  const dataDir = dirname(dbPath!);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath!)) {
    const fileBuffer = fs.readFileSync(dbPath!);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
} else {
  db = new SQL.Database();
}

function saveDb() {
  if (!shouldPersist) {
    return;
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath!, buffer);
}

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const usersPragma = db.exec('PRAGMA table_info(users)');
const hasEmailColumn = (usersPragma[0]?.values ?? []).some((col) => col[1] === 'email');
const hasNameColumn = (usersPragma[0]?.values ?? []).some((col) => col[1] === 'name');
if (!hasEmailColumn) {
  db.run('ALTER TABLE users ADD COLUMN email TEXT');
}
if (!hasNameColumn) {
  db.run("ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''");
}

db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');
db.run('UPDATE users SET email = lower(trim(email)) WHERE email IS NOT NULL AND trim(email) != ""');
db.run('UPDATE users SET name = trim(name) WHERE name IS NOT NULL');

db.run(`
  CREATE TABLE IF NOT EXISTS gists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT DEFAULT '',
    public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS gist_files (
    id TEXT PRIMARY KEY,
    gist_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT DEFAULT '',
    language TEXT DEFAULT 'text',
    FOREIGN KEY (gist_id) REFERENCES gists(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    token_salt TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS gist_stars (
    id TEXT PRIMARY KEY,
    gist_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gist_id) REFERENCES gists(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(gist_id, user_id)
  )
`);

saveDb();

export const dbWrapper = {
  prepare: (sql: string) => ({
    run: (...params: any[]) => {
      db.run(sql, params);
      const result = db.exec('SELECT last_insert_rowid() as id');
      saveDb();
      return { lastInsertRowid: result[0]?.values[0]?.[0] || 0 };
    },
    get: (...params: any[]): any => {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params: any[]): any[] => {
      const results: any[] = [];
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
  }),
};

export default dbWrapper;
