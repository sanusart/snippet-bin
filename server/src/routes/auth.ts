import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function hashToken(token: string, salt: string) {
  return crypto.pbkdf2Sync(token, salt, 100000, 64, 'sha512').toString('hex');
}

function normalizeEmail(email: string | undefined | null) {
  return email?.trim().toLowerCase() || '';
}

function generateJwt(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password || !email || !name) {
      return res.status(400).json({ error: 'Username, email, name, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const trimmedEmail = normalizeEmail(email);
    if (!trimmedEmail.includes('@')) {
      return res.status(400).json({ error: 'Email must be valid' });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Name must be provided' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    try {
      const stmt = db.prepare(
        'INSERT INTO users (id, username, email, name, password_hash) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(userId, username.trim(), trimmedEmail, trimmedName, passwordHash);

      const jwt = generateJwt(userId);

      res.json({
        token: jwt,
        user: { id: userId, username: username.trim(), email: trimmedEmail, name: trimmedName },
      });
    } catch (err) {
      const e = err as Error;
      if (e.message && e.message.includes('users.username')) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (e.message && e.message.includes('users.email')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (e.message && e.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Username or email already taken' });
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
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email (or username) and password required' });
    }

    const normalizedEmail = normalizeEmail(email);
    let user = null;

    if (normalizedEmail) {
      const stmt = db.prepare('SELECT * FROM users WHERE lower(trim(email)) = ?');
      user = stmt.get(normalizedEmail);
    }

    if (!user && username) {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
      user = stmt.get(username.trim());
    }

    if (!user && email) {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
      user = stmt.get(email.trim());
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwt = generateJwt(user.id);

    res.json({
      token: jwt,
      user: { id: user.id, username: user.username, email: user.email, name: user.name || '' },
    });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err && user) {
      const stmt = db.prepare(
        'SELECT id, username, email, name, created_at FROM users WHERE id = ?'
      );
      const dbUser = stmt.get(user.id);
      if (dbUser) {
        return res.json({
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          name: dbUser.name || '',
          created_at: dbUser.created_at,
        });
      }
    }

    // Fall back to API token
    const tokensStmt = db.prepare('SELECT user_id, token_hash, token_salt FROM tokens');
    const tokens = tokensStmt.all();

    for (const apiToken of tokens) {
      const hashedInput = hashToken(token, apiToken.token_salt);
      if (hashedInput === apiToken.token_hash) {
        const userStmt = db.prepare(
          'SELECT id, username, email, name, created_at FROM users WHERE id = ?'
        );
        const dbUser = userStmt.get(apiToken.user_id);
        if (!dbUser) return res.status(403).json({ error: 'Invalid token' });
        return res.json({
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          name: dbUser.name || '',
          created_at: dbUser.created_at,
        });
      }
    }

    return res.status(403).json({ error: 'Invalid token' });
  });
});

router.patch('/user', authenticateToken, (req, res) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const update = db.prepare('UPDATE users SET name = ? WHERE id = ?');
    update.run(name, req.user.id);

    const stmt = db.prepare('SELECT id, username, email, name FROM users WHERE id = ?');
    const updatedUser = stmt.get(req.user.id);
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name || '',
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
