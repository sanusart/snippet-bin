/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import { GistWithStats } from '@snippet-bin/shared';
import db from '../db.js';
import { getMimeType, getLanguageFromFilename } from '../constants.js';

function getOwner(userId: string | null): any {
  if (!userId) return null;
  const stmt = db.prepare('SELECT id, username, name, email, created_at FROM users WHERE id = ?');
  const user = stmt.get(userId);
  if (!user) return null;
  return {
    login: user.username,
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    node_id: Buffer.from(`User:${user.id}`).toString('base64'),
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
    gravatar_id: '',
    url: `/api/users/${user.username}`,
    html_url: `/${user.username}`,
    type: 'User',
  };
}

function gistToApiResponse(gist: any, files: any[], userId: string | null = null): GistWithStats {
  const starCountStmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
  const starCount = starCountStmt.get(gist.id)?.count || 0;

  let starred = false;
  if (userId) {
    const starredStmt = db.prepare('SELECT 1 FROM gist_stars WHERE gist_id = ? AND user_id = ?');
    starred = !!starredStmt.get(gist.id, userId);
  }

  const filesObj: Record<string, any> = {};

  for (const file of files) {
    filesObj[file.filename] = {
      filename: file.filename,
      type: getMimeType(file.language),
      language: file.language,
      raw_url: `/api/gists/${gist.id}/files/${encodeURIComponent(file.filename)}`,
      size: Buffer.byteLength(file.content, 'utf8'),
      content: file.content,
    };
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
    starred: starred,
  } as unknown as GistWithStats;
}

function gistToListItem(gist: any): GistWithStats {
  const filesStmt = db.prepare('SELECT filename, language FROM gist_files WHERE gist_id = ?');
  const files = filesStmt.all(gist.id);

  const starCountStmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
  const starCount = starCountStmt.get(gist.id)?.count || 0;

  const filesObj: Record<string, any> = {};
  for (const file of files) {
    filesObj[file.filename] = {
      filename: file.filename,
      language: file.language,
    };
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
  } as unknown as GistWithStats;
}

export default {
  async getGist(gistId: string, userId: string | null = null) {
    const gistStmt = userId
      ? db.prepare('SELECT * FROM gists WHERE id = ? AND (public = 1 OR user_id = ?)')
      : db.prepare('SELECT * FROM gists WHERE id = ? AND public = 1');

    const gist = userId ? gistStmt.get(gistId, userId) : gistStmt.get(gistId);
    if (!gist) return null;

    const filesStmt = db.prepare('SELECT * FROM gist_files WHERE gist_id = ?');
    const files = filesStmt.all(gistId);

    return gistToApiResponse(gist, files, userId);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listGists(userId: string | null = null, includePublic: boolean = true) {
    let gists;
    if (userId) {
      const stmt = db.prepare('SELECT * FROM gists WHERE user_id = ? ORDER BY updated_at DESC');
      gists = stmt.all(userId);
    } else {
      const stmt = db.prepare('SELECT * FROM gists WHERE public = 1 ORDER BY updated_at DESC');
      gists = stmt.all();
    }
    return gists.map(gistToListItem);
  },

  async createGist(userId: string, { description, public: isPublic, files }: any) {
    const gistId = uuidv4();
    const now = new Date().toISOString();

    const insertGist = db.prepare(
      'INSERT INTO gists (id, user_id, description, public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertGist.run(gistId, userId, description || '', isPublic ? 1 : 0, now, now);

    const insertFile = db.prepare(
      'INSERT INTO gist_files (id, gist_id, filename, content, language) VALUES (?, ?, ?, ?, ?)'
    );

    for (const [filename, fileData] of Object.entries(files as Record<string, any>)) {
      const fileId = uuidv4();
      const content = typeof fileData === 'string' ? fileData : fileData?.content || '';
      const language =
        typeof fileData === 'object' && fileData !== null
          ? fileData.language || getLanguageFromFilename(filename)
          : getLanguageFromFilename(filename);
      insertFile.run(fileId, gistId, filename, content, language);
    }

    return this.getGist(gistId, userId);
  },

  async updateGist(gistId: string, userId: string, { description, public: isPublic, files }: any) {
    const checkGist = db.prepare('SELECT * FROM gists WHERE id = ? AND user_id = ?');
    const existingGist = checkGist.get(gistId, userId);

    if (!existingGist) {
      return null;
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
    params.push(gistId);
    params.push(userId);

    if (updates.length > 1) {
      const updateStmt = db.prepare(
        `UPDATE gists SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      );
      updateStmt.run(...params);
    }

    if (files) {
      const deleteFiles = db.prepare('DELETE FROM gist_files WHERE gist_id = ?');
      deleteFiles.run(gistId);

      const insertFile = db.prepare(
        'INSERT INTO gist_files (id, gist_id, filename, content, language) VALUES (?, ?, ?, ?, ?)'
      );

      for (const [filename, fileData] of Object.entries(files as Record<string, any>)) {
        const fileId = uuidv4();
        const content = typeof fileData === 'string' ? fileData : fileData?.content || '';
        const language =
          typeof fileData === 'object' && fileData !== null
            ? fileData.language || getLanguageFromFilename(filename)
            : getLanguageFromFilename(filename);
        insertFile.run(fileId, gistId, filename, content, language);
      }
    }

    return this.getGist(gistId, userId);
  },

  async deleteGist(gistId: string, userId: string) {
    const checkGist = db.prepare('SELECT * FROM gists WHERE id = ? AND user_id = ?');
    const existingGist = checkGist.get(gistId, userId);

    if (!existingGist) {
      return false;
    }

    const deleteGist = db.prepare('DELETE FROM gists WHERE id = ?');
    deleteGist.run(gistId);

    return true;
  },

  async starGist(gistId: string, userId: string) {
    const checkGist = db.prepare('SELECT id FROM gists WHERE id = ?');
    const gist = checkGist.get(gistId);

    if (!gist) {
      return false;
    }

    try {
      const starId = uuidv4();
      const insertStar = db.prepare(
        'INSERT INTO gist_stars (id, gist_id, user_id) VALUES (?, ?, ?)'
      );
      insertStar.run(starId, gistId, userId);
      return true;
    } catch (e) {
      if (e instanceof Error && e.message.includes('UNIQUE constraint')) {
        return true;
      }
      throw e;
    }
  },

  async unstarGist(gistId: string, userId: string) {
    const deleteStar = db.prepare('DELETE FROM gist_stars WHERE gist_id = ? AND user_id = ?');
    deleteStar.run(gistId, userId);
    return true;
  },

  async getStarredGists(userId: string) {
    const stmt = db.prepare(`
      SELECT g.* FROM gists g
      JOIN gist_stars s ON g.id = s.gist_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `);
    const gists = stmt.all(userId);

    return gists.map((gist) => ({
      ...gistToListItem(gist),
      starred: true,
    }));
  },

  async getGistFile(gistId: string, filename: string, userId: string | null = null) {
    const gist = await this.getGist(gistId, userId);
    if (!gist) return null;
    return (gist.files as Record<string, any>)[filename] || null;
  },
};
