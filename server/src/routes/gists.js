import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

function getGistWithFiles(gistId, userId = null) {
  const gistStmt = userId 
    ? db.prepare('SELECT * FROM gists WHERE id = ? AND (public = 1 OR user_id = ?)')
    : db.prepare('SELECT * FROM gists WHERE id = ? AND public = 1');
  
  const gist = userId ? gistStmt.get(gistId, userId) : gistStmt.get(gistId);
  
  if (!gist) return null;
  
  const filesStmt = db.prepare('SELECT * FROM gist_files WHERE gist_id = ?');
  const files = filesStmt.all(gistId);
  
  const starCountStmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
  const starCount = starCountStmt.get(gistId)?.count || 0;
  
  let starred = false;
  if (userId) {
    const starredStmt = db.prepare('SELECT 1 FROM gist_stars WHERE gist_id = ? AND user_id = ?');
    starred = !!starredStmt.get(gistId, userId);
  }
  
  const filesObj = {};
  let totalSize = 0;
  
  for (const file of files) {
    filesObj[file.filename] = {
      filename: file.filename,
      type: getMimeType(file.language),
      language: file.language,
      raw_url: `/api/gists/${gistId}/files/${encodeURIComponent(file.filename)}`,
      size: Buffer.byteLength(file.content, 'utf8'),
      content: file.content
    };
    totalSize += Buffer.byteLength(file.content, 'utf8');
  }
  
  return {
    id: gist.id,
    node_id: Buffer.from(`Gist:${gist.id}`).toString('base64'),
    url: `/api/gists/${gist.id}`,
    html_url: `/gists/${gist.id}`,
    public: Boolean(gist.public),
    description: gist.description || '',
    files: filesObj,
    owner: getOwner(gist.user_id),
    created_at: gist.created_at,
    updated_at: gist.updated_at,
    star_count: starCount,
    starred: starred
  };
}

function getMimeType(language) {
  const types = {
    javascript: 'application/javascript',
    typescript: 'application/typescript',
    python: 'text/python',
    html: 'text/html',
    css: 'text/css',
    json: 'application/json',
    markdown: 'text/markdown',
    text: 'text/plain'
  };
  return types[language] || 'text/plain';
}

function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    htm: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    txt: 'text'
  };
  return langMap[ext] || 'text';
}

function getOwner(userId) {
  if (!userId) return null;
  const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
  const user = stmt.get(userId);
  if (!user) return null;
  return {
    login: user.username,
    id: user.id,
    node_id: Buffer.from(`User:${user.id}`).toString('base64'),
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
    gravatar_id: '',
    url: `/api/users/${user.username}`,
    html_url: `/${user.username}`,
    type: 'User'
  };
}

router.get('/', optionalAuth, (req, res) => {
  const userId = req.user?.id;
  
  let gists;
  if (userId) {
    const stmt = db.prepare('SELECT * FROM gists WHERE user_id = ? ORDER BY updated_at DESC');
    gists = stmt.all(userId);
  } else {
    const stmt = db.prepare('SELECT * FROM gists WHERE public = 1 ORDER BY updated_at DESC');
    gists = stmt.all();
  }
  
  const result = gists.map(gist => {
    const filesStmt = db.prepare('SELECT filename, language FROM gist_files WHERE gist_id = ? LIMIT 1');
    const file = filesStmt.get(gist.id);
    
    const starCountStmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
    const starCount = starCountStmt.get(gist.id)?.count || 0;
    
    return {
      id: gist.id,
      node_id: Buffer.from(`Gist:${gist.id}`).toString('base64'),
      url: `/api/gists/${gist.id}`,
      html_url: `/gists/${gist.id}`,
      public: Boolean(gist.public),
      description: gist.description || '',
      files: file ? { [file.filename]: { filename: file.filename, language: file.language } } : {},
      owner: getOwner(gist.user_id),
      created_at: gist.created_at,
      updated_at: gist.updated_at,
      star_count: starCount
    };
  });
  
  res.json(result);
});

router.get('/starred', authenticateToken, (req, res) => {
  const stmt = db.prepare(`
    SELECT g.* FROM gists g
    JOIN gist_stars s ON g.id = s.gist_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `);
  const gists = stmt.all(req.user.id);
  
  const result = gists.map(gist => {
    const filesStmt = db.prepare('SELECT filename, language FROM gist_files WHERE gist_id = ? LIMIT 1');
    const file = filesStmt.get(gist.id);
    
    const starCountStmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
    const starCount = starCountStmt.get(gist.id)?.count || 0;
    
    return {
      id: gist.id,
      node_id: Buffer.from(`Gist:${gist.id}`).toString('base64'),
      url: `/api/gists/${gist.id}`,
      html_url: `/gists/${gist.id}`,
      public: Boolean(gist.public),
      description: gist.description || '',
      files: file ? { [file.filename]: { filename: file.filename, language: file.language } } : {},
      owner: getOwner(gist.user_id),
      created_at: gist.created_at,
      updated_at: gist.updated_at,
      star_count: starCount,
      starred: true
    };
  });
  
  res.json(result);
});

router.get('/:id', optionalAuth, (req, res) => {
  const gist = getGistWithFiles(req.params.id, req.user?.id);
  
  if (!gist) {
    return res.status(404).json({ error: 'Gist not found' });
  }
  
  res.json(gist);
});

router.get('/:id/files/:filename', optionalAuth, (req, res) => {
  const gist = getGistWithFiles(req.params.id, req.user?.id);
  
  if (!gist) {
    return res.status(404).json({ error: 'Gist not found' });
  }
  
  const file = gist.files[req.params.filename];
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.send(file.content);
});

router.post('/', authenticateToken, (req, res) => {
  const { description, public: isPublic, files } = req.body;
  
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'At least one file is required' });
  }
  
  const gistId = uuidv4();
  const now = new Date().toISOString();
  
  const insertGist = db.prepare(
    'INSERT INTO gists (id, user_id, description, public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertGist.run(gistId, req.user.id, description || '', isPublic ? 1 : 0, now, now);
  
  const insertFile = db.prepare(
    'INSERT INTO gist_files (id, gist_id, filename, content, language) VALUES (?, ?, ?, ?, ?)'
  );
  
  for (const [filename, fileData] of Object.entries(files)) {
    const fileId = uuidv4();
    const content = typeof fileData === 'string' ? fileData : fileData.content || '';
    const language = typeof fileData === 'object' ? (fileData.language || getLanguageFromFilename(filename)) : getLanguageFromFilename(filename);
    insertFile.run(fileId, gistId, filename, content, language);
  }
  
  const gist = getGistWithFiles(gistId, req.user.id);
  res.status(201).json(gist);
});

router.patch('/:id', authenticateToken, (req, res) => {
  const { description, public: isPublic, files } = req.body;
  
  const checkGist = db.prepare('SELECT * FROM gists WHERE id = ? AND user_id = ?');
  const existingGist = checkGist.get(req.params.id, req.user.id);
  
  if (!existingGist) {
    return res.status(404).json({ error: 'Gist not found' });
  }
  
  const now = new Date().toISOString();
  const updates = [];
  const params = [];
  
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  
  if (isPublic !== undefined) {
    updates.push('public = ?');
    params.push(isPublic ? 1 : 0);
  }
  
  updates.push('updated_at = ?');
  params.push(now);
  params.push(req.params.id);
  params.push(req.user.id);
  
  if (updates.length > 1) {
    const updateStmt = db.prepare(`UPDATE gists SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`);
    updateStmt.run(...params);
  }
  
  if (files) {
    const deleteFiles = db.prepare('DELETE FROM gist_files WHERE gist_id = ?');
    deleteFiles.run(req.params.id);
    
    const insertFile = db.prepare(
      'INSERT INTO gist_files (id, gist_id, filename, content, language) VALUES (?, ?, ?, ?, ?)'
    );
    
    for (const [filename, fileData] of Object.entries(files)) {
      const fileId = uuidv4();
      const content = typeof fileData === 'string' ? fileData : fileData.content || '';
      const language = typeof fileData === 'object' ? (fileData.language || getLanguageFromFilename(filename)) : getLanguageFromFilename(filename);
      insertFile.run(fileId, req.params.id, filename, content, language);
    }
  }
  
  const gist = getGistWithFiles(req.params.id, req.user.id);
  res.json(gist);
});

router.delete('/:id', authenticateToken, (req, res) => {
  const checkGist = db.prepare('SELECT * FROM gists WHERE id = ? AND user_id = ?');
  const existingGist = checkGist.get(req.params.id, req.user.id);
  
  if (!existingGist) {
    return res.status(404).json({ error: 'Gist not found' });
  }
  
  const deleteGist = db.prepare('DELETE FROM gists WHERE id = ?');
  deleteGist.run(req.params.id);
  
  res.status(204).send();
});

router.post('/:id/star', authenticateToken, (req, res) => {
  const gistId = req.params.id;
  
  const checkGist = db.prepare('SELECT id FROM gists WHERE id = ?');
  const gist = checkGist.get(gistId);
  
  if (!gist) {
    return res.status(404).json({ error: 'Gist not found' });
  }
  
  try {
    const starId = uuidv4();
    const insertStar = db.prepare('INSERT INTO gist_stars (id, gist_id, user_id) VALUES (?, ?, ?)');
    insertStar.run(starId, gistId, req.user.id);
    res.status(204).send();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      return res.status(204).send();
    }
    throw e;
  }
});

router.delete('/:id/star', authenticateToken, (req, res) => {
  const gistId = req.params.id;
  
  const deleteStar = db.prepare('DELETE FROM gist_stars WHERE gist_id = ? AND user_id = ?');
  deleteStar.run(gistId, req.user.id);
  
  res.status(204).send();
});

export default router;
