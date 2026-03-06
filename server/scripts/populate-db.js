import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'data', 'snippetbin.db');

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'go', 'rust', 'java'];
const FILE_NAMES = ['index.js', 'app.ts', 'main.py', 'style.css', 'config.json', 'README.md', 'utils.ts', 'helpers.js', 'test.py', 'server.js'];

const SAMPLE_CODE = {
  javascript: `function hello() {\n  console.log("Hello, World!");\n}\n\nhello();`,
  typescript: `interface User {\n  id: string;\n  name: string;\n}\n\nconst user: User = { id: "1", name: "John" };`,
  python: `def hello():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    hello()`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Test</title>\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>`,
  css: `body {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}`,
  json: `{\n  "name": "test",\n  "version": "1.0.0"\n}`,
  markdown: `# Hello\n\nThis is a test gist.`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}`,
  rust: `fn main() {\n    println!("Hello, World!");\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
};

function hashToken(token, salt) {
  return crypto.pbkdf2Sync(token, salt, 100000, 64, 'sha512').toString('hex');
}

async function populateDatabase() {
  console.log('Loading database...');
  
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    const SQL = await initSqlJs();
    db = new SQL.Database(fileBuffer);
  } else {
    console.log('Database not found. Please run the server first to create the database.');
    return;
  }

  function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  console.log('Creating test users...');
  
  const testUsers = [
    { username: 'alice', password: 'password123' },
    { username: 'bob', password: 'password123' },
    { username: 'charlie', password: 'password123' },
    { username: 'diana', password: 'password123' },
    { username: 'eve', password: 'password123' }
  ];

  const userIds = [];
  
  for (const user of testUsers) {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(user.password, 10);
    
    try {
      db.run('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', [userId, user.username, passwordHash]);
      userIds.push(userId);
      console.log(`  Created user: ${user.username}`);
    } catch (e) {
      if (e.message.includes('UNIQUE constraint')) {
        console.log(`  User ${user.username} already exists, skipping...`);
        const existing = db.prepare('SELECT id FROM users WHERE username = ?');
        existing.bind([user.username]);
        if (existing.step()) {
          userIds.push(existing.getAsObject().id);
        }
        existing.free();
      }
    }
  }

  console.log(`\nCreating API tokens...`);
  
  for (const userId of userIds) {
    const tokenId = uuidv4();
    const rawToken = 'sb_tkn_test_' + uuidv4().replace(/-/g, '').substring(0, 20);
    const salt = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken, salt);
    
    db.run('INSERT INTO tokens (id, user_id, token_hash, token_salt, note) VALUES (?, ?, ?, ?, ?)', 
      [tokenId, userId, tokenHash, salt, 'Test token']);
    console.log(`  Token for user ${userId}: ${rawToken}`);
  }

  console.log(`\nCreating gists...`);
  
  const descriptions = [
    'My awesome snippet',
    'Utility functions',
    'Work in progress',
    'Algorithm implementation',
    'Quick helper',
    'API client',
    'Database schema',
    'Config files',
    'React component',
    'Server setup',
    'CSS styles',
    'Python script',
    'Notes',
    'Draft code',
    ''
  ];

  let gistCount = 0;
  
  for (const userId of userIds) {
    const gistsPerUser = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < gistsPerUser; i++) {
      const gistId = uuidv4();
      const isPublic = Math.random() > 0.5;
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const now = new Date().toISOString();
      
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      
      db.run(
        'INSERT INTO gists (id, user_id, description, public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [gistId, userId, description, isPublic ? 1 : 0, createdAt, createdAt]
      );
      
      const numFiles = 1 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numFiles; j++) {
        const fileId = uuidv4();
        const fileName = FILE_NAMES[Math.floor(Math.random() * FILE_NAMES.length)];
        const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
        const content = SAMPLE_CODE[lang] || '// code here';
        
        db.run(
          'INSERT INTO gist_files (id, gist_id, filename, content, language) VALUES (?, ?, ?, ?, ?)',
          [fileId, gistId, fileName, content, lang]
        );
      }
      
      gistCount++;
    }
    
    console.log(`  Created ${gistsPerUser} gists for user ${userId.substring(0, 8)}...`);
  }

  console.log(`\nCreating stars...`);
  
  const allGists = [];
  const gistStmt = db.prepare('SELECT id, user_id FROM gists');
  while (gistStmt.step()) {
    allGists.push(gistStmt.getAsObject());
  }
  gistStmt.free();

  let starCount = 0;
  for (const userId of userIds) {
    const numStars = 3 + Math.floor(Math.random() * 10);
    const availableGists = allGists.filter(g => g.user_id !== userId);
    
    for (let i = 0; i < Math.min(numStars, availableGists.length); i++) {
      const randomGist = availableGists[Math.floor(Math.random() * availableGists.length)];
      const starId = uuidv4();
      
      try {
        db.run(
          'INSERT INTO gist_stars (id, gist_id, user_id, created_at) VALUES (?, ?, ?, ?)',
          [starId, randomGist.id, userId, new Date().toISOString()]
        );
        starCount++;
      } catch (e) {
        // Skip duplicate stars
      }
    }
  }
  
  console.log(`  Created ${starCount} stars`);

  saveDb();
  
  console.log(`\n✅ Done! Created:`);
  console.log(`   - ${userIds.length} users`);
  console.log(`   - ${gistCount} gists`);
  console.log(`   - ${starCount} stars`);
  console.log(`\nDatabase saved to: ${dbPath}`);
}

populateDatabase().catch(console.error);
