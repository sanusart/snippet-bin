import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

function hashToken(token: string, salt: string) {
  return crypto.pbkdf2Sync(token, salt, 100000, 64, 'sha512').toString('hex');
}

router.get('/', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(
      'SELECT id, note, created_at FROM tokens WHERE user_id = ? ORDER BY created_at DESC'
    );
    const tokens = stmt.all(req.user.id);

    res.json(
      tokens.map((t) => ({
        id: t.id,
        note: t.note || '',
        token: 'sb_tkn_••••••••••••••••',
        created_at: t.created_at,
      }))
    );
  } catch (err) {
    console.error('Tokens error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', optionalAuth, async (req, res) => {
  try {
    let user = req.user;
    if (!user) {
      const { email, username, password } = req.body;
      if (!password || (!email && !username)) {
        return res.status(401).json({ error: 'Email or username and password are required' });
      }

      const normalizedEmail = email?.trim().toLowerCase() || '';
      if (normalizedEmail) {
        const stmt = db.prepare('SELECT * FROM users WHERE lower(trim(email)) = ?');
        user = stmt.get(normalizedEmail);
      }

      if (!user && username) {
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE');
        user = stmt.get(username.trim());
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    const { note } = req.body;
    const tokenId = uuidv4();
    const rawToken = 'sb_tkn_' + uuidv4().replace(/-/g, '');
    const salt = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken, salt);

    const insert = db.prepare(
      'INSERT INTO tokens (id, user_id, token_hash, token_salt, note) VALUES (?, ?, ?, ?, ?)'
    );
    insert.run(tokenId, user.id, tokenHash, salt, note || '');

    res.status(201).json({
      id: tokenId,
      token: rawToken,
      note: note || '',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Tokens error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const checkToken = db.prepare('SELECT * FROM tokens WHERE id = ? AND user_id = ?');
  const existingToken = checkToken.get(req.params.id, req.user.id);

  if (!existingToken) {
    return res.status(404).json({ error: 'Token not found' });
  }

  const deleteToken = db.prepare('DELETE FROM tokens WHERE id = ?');
  deleteToken.run(req.params.id);

  res.status(204).send();
});

export default router;
