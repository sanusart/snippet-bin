import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function hashToken(token, salt) {
  return crypto.pbkdf2Sync(token, salt, 100000, 64, 'sha512').toString('hex');
}

function createApiToken(userId) {
  const tokenId = uuidv4();
  const rawToken = 'sb_tkn_' + uuidv4().replace(/-/g, '');
  const salt = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken, salt);
  
  const stmt = db.prepare('INSERT INTO tokens (id, user_id, token_hash, token_salt, note) VALUES (?, ?, ?, ?, ?)');
  stmt.run(tokenId, userId, tokenHash, salt, 'Session token');
  
  return rawToken;
}

function generateJwt(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    try {
      const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
      stmt.run(userId, username, passwordHash);
      
      const jwt = generateJwt(userId);
      const apiToken = createApiToken(userId);
      
      res.json({ token: jwt, apiToken, user: { id: userId, username } });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const jwt = generateJwt(user.id);
    const apiToken = createApiToken(user.id);
    
    res.json({ token: jwt, apiToken, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Try JWT first (for UI session)
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
      const dbUser = stmt.get(user.id);
      if (dbUser) {
        return res.json({ id: dbUser.id, username: dbUser.username });
      }
    }
    
    // Fall back to API token
    const tokensStmt = db.prepare('SELECT user_id, token_hash, token_salt FROM tokens');
    const tokens = tokensStmt.all();
    
    for (const apiToken of tokens) {
      const hashedInput = hashToken(token, apiToken.token_salt);
      if (hashedInput === apiToken.token_hash) {
        const userStmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
        const dbUser = userStmt.get(apiToken.user_id);
        if (!dbUser) return res.status(403).json({ error: 'Invalid token' });
        return res.json({ id: dbUser.id, username: dbUser.username });
      }
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  });
});

export default router;
