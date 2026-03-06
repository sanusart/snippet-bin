import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function hashToken(token, salt) {
  return crypto.pbkdf2Sync(token, salt, 100000, 64, 'sha512').toString('hex');
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Try JWT first
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
      const dbUser = stmt.get(user.id);
      if (dbUser) {
        req.user = dbUser;
        return next();
      }
    }
    
    // Fall back to API token
    const tokensStmt = db.prepare('SELECT user_id, token_hash, token_salt FROM tokens');
    const tokens = tokensStmt.all();
    
    for (const apiToken of tokens) {
      const hashedInput = hashToken(token, apiToken.token_salt);
      if (hashedInput === apiToken.token_hash) {
        const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
        const dbUser = stmt.get(apiToken.user_id);
        if (dbUser) {
          req.user = dbUser;
          return next();
        }
      }
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return next();
  
  // Try JWT first
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
      const dbUser = stmt.get(user.id);
      if (dbUser) {
        req.user = dbUser;
        return next();
      }
    }
    
    // Fall back to API token
    const tokensStmt = db.prepare('SELECT user_id, token_hash, token_salt FROM tokens');
    const tokens = tokensStmt.all();
    
    for (const apiToken of tokens) {
      const hashedInput = hashToken(token, apiToken.token_salt);
      if (hashedInput === apiToken.token_hash) {
        const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
        const dbUser = stmt.get(apiToken.user_id);
        if (dbUser) {
          req.user = dbUser;
          return next();
        }
      }
    }
    
    next();
  });
}

export function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export { JWT_SECRET };
