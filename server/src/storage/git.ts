/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { GistWithStats } from '@snippet-bin/shared';
import db from '../db.js';
import { getMimeType, getLanguageFromFilename } from '../constants.js';

function getOwnerData(userId: string | null): any {
  if (!userId) return null;
  const stmt = db.prepare('SELECT id, username, name, email, created_at FROM users WHERE id = ?');
  const user = stmt.get(userId);
  if (!user) return null;

  const cleanedName = user.name?.trim() || '';
  const displayName = cleanedName || user.username || '';
  const cleanedEmail = user.email?.trim() || '';

  return {
    login: user.username,
    id: user.id,
    name: displayName,
    email: cleanedEmail,
    node_id: Buffer.from(`User:${user.id}`).toString('base64'),
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
    gravatar_id: '',
    url: `/api/users/${user.username}`,
    html_url: `/${user.username}`,
    type: 'User',
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envDataDir = process.env.STORAGE_GISTS_DIR;
const defaultDataDir = join(__dirname, '..', '..', 'data', 'gists');
const dataDir = envDataDir ? resolve(envDataDir) : defaultDataDir;

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getGist(gistId: string): any {
  const stmt = db.prepare('SELECT * FROM gists WHERE id = ?');
  return stmt.get(gistId);
}

function getGistsForUser(userId: string): any[] {
  const stmt = db.prepare('SELECT * FROM gists WHERE user_id = ? ORDER BY updated_at DESC');
  return stmt.all(userId);
}

function getPublicGists(): any[] {
  const stmt = db.prepare('SELECT * FROM gists WHERE public = 1 ORDER BY updated_at DESC');
  return stmt.all();
}

function insertGist(gist: any) {
  const stmt = db.prepare(
    'INSERT INTO gists (id, user_id, description, public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    gist.id,
    gist.user_id,
    gist.description,
    gist.public ? 1 : 0,
    gist.created_at,
    gist.updated_at
  );
}

function updateGist(gistId: string, updates: any) {
  const setClauses = [];
  const params = [];

  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    params.push(updates.description);
  }
  if (updates.public !== undefined) {
    setClauses.push('public = ?');
    params.push(updates.public ? 1 : 0);
  }
  if (updates.updated_at !== undefined) {
    setClauses.push('updated_at = ?');
    params.push(updates.updated_at);
  }

  if (setClauses.length === 0) return;

  params.push(gistId);
  const stmt = db.prepare(`UPDATE gists SET ${setClauses.join(', ')} WHERE id = ?`);
  stmt.run(...params);
}

function deleteGist(gistId: string) {
  const stmt = db.prepare('DELETE FROM gists WHERE id = ?');
  stmt.run(gistId);
}

function getStarCount(gistId: string): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM gist_stars WHERE gist_id = ?');
  return stmt.get(gistId)?.count || 0;
}

function isGistStarred(gistId: string, userId: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM gist_stars WHERE gist_id = ? AND user_id = ?');
  return !!stmt.get(gistId, userId);
}

function addStar(gistId: string, userId: string) {
  try {
    const stmt = db.prepare('INSERT INTO gist_stars (id, gist_id, user_id) VALUES (?, ?, ?)');
    stmt.run(uuidv4(), gistId, userId);
    return true;
  } catch (e) {
    if (e instanceof Error && e.message?.includes('UNIQUE constraint')) {
      return true;
    }
    throw e;
  }
}

function removeStar(gistId: string, userId: string) {
  const stmt = db.prepare('DELETE FROM gist_stars WHERE gist_id = ? AND user_id = ?');
  stmt.run(gistId, userId);
}

function getStarredGistIdsForUser(userId: string): string[] {
  const stmt = db.prepare('SELECT gist_id FROM gist_stars WHERE user_id = ?');
  return stmt.all(userId).map((row: any) => row.gist_id);
}

function execGit(repoPath: string, args: string, options: any = {}) {
  const env = { ...process.env, ...(options.env || {}) };
  return execSync(args, {
    cwd: repoPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

function buildAuthorEnv(author: any) {
  if (!author) return null;
  const env: Record<string, string> = {};
  if (author.name) {
    env.GIT_AUTHOR_NAME = author.name;
    env.GIT_COMMITTER_NAME = author.name;
  }
  if (author.email) {
    env.GIT_AUTHOR_EMAIL = author.email;
    env.GIT_COMMITTER_EMAIL = author.email;
  }
  return env;
}

function initGitRepo(gistId: string) {
  const repoPath = join(dataDir, `${gistId}.git`);
  fs.mkdirSync(repoPath, { recursive: true });
  execGit(repoPath, 'git init --bare');
  return repoPath;
}

function createWorkingRepo(gistId: string) {
  const workPath = join(dataDir, gistId);
  if (fs.existsSync(workPath) && fs.existsSync(join(workPath, '.git'))) {
    return workPath;
  }
  fs.mkdirSync(workPath, { recursive: true });
  execGit(workPath, 'git init');
  execGit(workPath, 'git config user.email "snippet-bin@localhost"');
  execGit(workPath, 'git config user.name "Snippet Bin"');
  return workPath;
}

function commitFiles(workPath: string, files: any, message: string, author: any) {
  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(workPath, filename);
    const dir = dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content as string);
  }

  execGit(workPath, 'git add -A');
  try {
    execGit(workPath, `git commit -m "${message}"`, {
      env: buildAuthorEnv(author),
    });
  } catch (e) {
    if (e instanceof Error && !(e as any).stdout?.includes('nothing to commit')) {
      throw e;
    }
  }
}

function getFilesFromRepo(workPath: string) {
  const files: Record<string, string> = {};
  if (!fs.existsSync(join(workPath, '.git'))) {
    return files;
  }

  try {
    const output = execGit(workPath, 'git ls-tree -r HEAD --name-only');
    const filePaths = output.trim().split('\n').filter(Boolean);

    for (const filePath of filePaths) {
      const content = execGit(workPath, `git show HEAD:${filePath}`);
      files[filePath] = content;
    }
  } catch (e) {
    // No commits yet
  }

  return files;
}

function cleanupWorkingRepo(gistId: string) {
  const workPath = join(dataDir, gistId);
  if (fs.existsSync(workPath)) {
    fs.rmSync(workPath, { recursive: true, force: true });
  }
}

function pushToBare(gistId: string) {
  const workPath = join(dataDir, gistId);
  const barePath = join(dataDir, `${gistId}.git`);

  if (!fs.existsSync(join(workPath, '.git'))) {
    return;
  }

  execGit(workPath, `git remote add bare ${barePath}`);
  try {
    execGit(workPath, 'git push bare master');
  } catch (e) {
    try {
      execGit(workPath, 'git push -u bare master');
    } catch (e2) {
      // May already exist
    }
  }
}

export default {
  async getGist(gistId: string, userId: string | null = null) {
    const gist = getGist(gistId);

    if (!gist) return null;

    if (!gist.public && gist.user_id !== userId) {
      return null;
    }

    const workPath = createWorkingRepo(gistId);
    const files = getFilesFromRepo(workPath);

    return this.buildGistResponse(gistId, gist, files, userId);
  },

  async listGists(userId: string | null = null, includePublic: boolean = true) {
    let gists;
    if (userId) {
      gists = getGistsForUser(userId);
      if (includePublic) {
        const publicGists = getPublicGists();
        const userGistIds = new Set(gists.map((g) => g.id));
        const combined = [...gists, ...publicGists.filter((g) => !userGistIds.has(g.id))];
        gists = combined.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }
    } else {
      gists = getPublicGists();
    }

    return gists.map((gist) => {
      const workPath = createWorkingRepo(gist.id);
      const files = getFilesFromRepo(workPath);
      const fileList = Object.keys(files);
      const starCount = getStarCount(gist.id);

      const filesObj: Record<string, any> = {};
      for (const filename of fileList) {
        filesObj[filename] = {
          filename,
          language: getLanguageFromFilename(filename),
        };
      }

      return {
        id: gist.id,
        node_id: Buffer.from(`Gist:${gist.id}`).toString('base64'),
        url: `/api/gists/${gist.id}`,
        html_url: `/gists/${gist.id}`,
        public: gist.public,
        description: gist.description || '',
        files: filesObj,
        owner: gist.user_id ? getOwnerData(gist.user_id) : null,
        created_at: gist.created_at,
        updated_at: gist.updated_at,
        star_count: starCount,
      } as unknown as GistWithStats;
    });
  },

  async createGist(userId: string, { description, public: isPublic, files }: any) {
    const gistId = uuidv4();
    const now = new Date().toISOString();

    insertGist({
      id: gistId,
      user_id: userId,
      description: description || '',
      public: Boolean(isPublic),
      created_at: now,
      updated_at: now,
    });

    const workPath = createWorkingRepo(gistId);
    const filesWithContent: Record<string, string> = {};
    for (const [filename, fileData] of Object.entries(files as Record<string, any>)) {
      filesWithContent[filename] =
        typeof fileData === 'string' ? fileData : fileData?.content || '';
    }
    const owner = getOwnerData(userId);
    commitFiles(workPath, filesWithContent, 'Initial commit', owner);

    return this.getGist(gistId, userId);
  },

  async updateGist(gistId: string, userId: string, { description, public: isPublic, files }: any) {
    const gist = getGist(gistId);

    if (!gist || gist.user_id !== userId) {
      return null;
    }

    const now = new Date().toISOString();

    updateGist(gistId, {
      description: description !== undefined ? description : gist.description,
      public: isPublic !== undefined ? Boolean(isPublic) : gist.public,
      updated_at: now,
    });

    if (files) {
      const workPath = createWorkingRepo(gistId);
      const currentFiles = getFilesFromRepo(workPath);
      const newFilenames = Object.keys(files);

      for (const filename of Object.keys(currentFiles)) {
        if (!newFilenames.includes(filename)) {
          const filePath = join(workPath, filename);
          if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
          }
        }
      }

      const filesWithContent: Record<string, string> = {};
      for (const [filename, fileData] of Object.entries(files as Record<string, any>)) {
        filesWithContent[filename] =
          typeof fileData === 'string' ? fileData : fileData?.content || '';
      }
      const owner = getOwnerData(userId);
      commitFiles(workPath, filesWithContent, 'Update files', owner);
    }

    return this.getGist(gistId, userId);
  },

  async deleteGist(gistId: string, userId: string) {
    const gist = getGist(gistId);

    if (!gist || gist.user_id !== userId) {
      return false;
    }

    deleteGist(gistId);

    const workPath = join(dataDir, gistId);

    if (fs.existsSync(workPath)) {
      fs.rmSync(workPath, { recursive: true, force: true });
    }

    return true;
  },

  async starGist(gistId: string, userId: string) {
    const gist = getGist(gistId);
    if (!gist) {
      return false;
    }

    return addStar(gistId, userId);
  },

  async unstarGist(gistId: string, userId: string) {
    return removeStar(gistId, userId);
  },

  async getStarredGists(userId: string) {
    const starredGistIds = getStarredGistIdsForUser(userId);

    const starredGists = [];
    for (const gistId of starredGistIds) {
      const gist = getGist(gistId);
      if (gist) {
        starredGists.push(gist);
      }
    }

    return starredGists.map((gist) => {
      const workPath = createWorkingRepo(gist.id);
      const files = getFilesFromRepo(workPath);
      const fileList = Object.keys(files);
      const firstFile = fileList[0];
      const starCount = getStarCount(gist.id);

      return {
        id: gist.id,
        node_id: Buffer.from(`Gist:${gist.id}`).toString('base64'),
        url: `/api/gists/${gist.id}`,
        html_url: `/gists/${gist.id}`,
        public: gist.public,
        description: gist.description || '',
        files: firstFile
          ? {
              [firstFile]: {
                filename: firstFile,
                language: getLanguageFromFilename(firstFile),
              },
            }
          : {},
        owner: gist.user_id ? getOwnerData(gist.user_id) : null,
        created_at: gist.created_at,
        updated_at: gist.updated_at,
        star_count: starCount,
        starred: true,
      } as unknown as GistWithStats;
    });
  },

  async getGistFile(gistId: string, filename: string, userId: string | null = null) {
    const gist = await this.getGist(gistId, userId);
    if (!gist) return null;
    return (gist.files as Record<string, any>)[filename] || null;
  },

  buildGistResponse(
    gistId: string,
    gist: any,
    files: any,
    userId: string | null = null
  ): GistWithStats {
    const starCount = getStarCount(gistId);
    const starred = userId ? isGistStarred(gistId, userId) : false;

    const filesObj: Record<string, any> = {};
    for (const [filename, content] of Object.entries(files)) {
      filesObj[filename] = {
        filename,
        type: getMimeType(getLanguageFromFilename(filename)),
        language: getLanguageFromFilename(filename),
        raw_url: `/api/gists/${gistId}/files/${encodeURIComponent(filename)}`,
        size: Buffer.byteLength(content as string, 'utf8'),
        content,
      };
    }

    return {
      id: gistId,
      node_id: Buffer.from(`Gist:${gistId}`).toString('base64'),
      url: `/api/gists/${gistId}`,
      html_url: `/gists/${gistId}`,
      public: gist.public,
      description: gist.description || '',
      files: filesObj,
      owner: gist.user_id ? getOwnerData(gist.user_id) : null,
      created_at: gist.created_at,
      updated_at: gist.updated_at,
      star_count: starCount,
      starred,
    } as unknown as GistWithStats;
  },
};
