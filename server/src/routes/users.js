import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/:username', (req, res) => {
  const { username } = req.params;
  
  const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE username = ?');
  const user = stmt.get(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    login: user.username,
    id: user.id,
    node_id: Buffer.from(`User:${user.id}`).toString('base64'),
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
    gravatar_id: '',
    url: `/api/users/${user.username}`,
    html_url: `/${user.username}`,
    type: 'User',
    created_at: user.created_at
  });
});

export default router;
