import { Router } from 'express';
import { storage } from '../storage/index.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const gists = await storage.listGists(req.user?.id);
    res.json(gists);
  } catch (error) {
    console.error('Error listing gists:', error);
    res.status(500).json({ error: 'Failed to list gists' });
  }
});

router.get('/starred', authenticateToken, async (req, res) => {
  try {
    const gists = await storage.getStarredGists(req.user.id);
    res.json(gists);
  } catch (error) {
    console.error('Error listing starred gists:', error);
    res.status(500).json({ error: 'Failed to list starred gists' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const gist = await storage.getGist(req.params.id, req.user?.id);

    if (!gist) {
      return res.status(404).json({ error: 'Gist not found' });
    }

    res.json(gist);
  } catch (error) {
    console.error('Error getting gist:', error);
    res.status(500).json({ error: 'Failed to get gist' });
  }
});

router.get('/:id/files/:filename', optionalAuth, async (req, res) => {
  try {
    const file = await storage.getGistFile(req.params.id, req.params.filename, req.user?.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.send(file.content);
  } catch (error) {
    console.error('Error getting gist file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description, public: isPublic, files } = req.body;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    const gist = await storage.createGist(req.user.id, {
      description,
      public: isPublic,
      files,
    });

    res.status(201).json(gist);
  } catch (error) {
    console.error('Error creating gist:', error);
    res.status(500).json({ error: 'Failed to create gist' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { description, public: isPublic, files } = req.body;

    const gist = await storage.updateGist(req.params.id, req.user.id, {
      description,
      public: isPublic,
      files,
    });

    if (!gist) {
      return res.status(404).json({ error: 'Gist not found' });
    }

    res.json(gist);
  } catch (error) {
    console.error('Error updating gist:', error);
    res.status(500).json({ error: 'Failed to update gist' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await storage.deleteGist(req.params.id, req.user.id);

    if (!result.deleted) {
      if (result.reason === 'forbidden') {
        return res.status(403).json({ error: 'You do not have permission to delete this gist' });
      }
      return res.status(404).json({ error: 'Gist not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gist:', error);
    res.status(500).json({ error: 'Failed to delete gist' });
  }
});

router.post('/:id/star', authenticateToken, async (req, res) => {
  try {
    const success = await storage.starGist(req.params.id, req.user.id);

    if (!success) {
      return res.status(404).json({ error: 'Gist not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error starring gist:', error);
    res.status(500).json({ error: 'Failed to star gist' });
  }
});

router.delete('/:id/star', authenticateToken, async (req, res) => {
  try {
    await storage.unstarGist(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error unstarring gist:', error);
    res.status(500).json({ error: 'Failed to unstar gist' });
  }
});

export default router;
