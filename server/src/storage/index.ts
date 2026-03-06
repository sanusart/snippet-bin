/* eslint-disable @typescript-eslint/no-explicit-any */
export const StorageType = {
  SQLITE: 'sqlite',
  GIT: 'git',
};

let storageInstance: any = null;

async function getStorage() {
  if (!storageInstance) {
    const type = process.env.STORAGE_BACKEND || StorageType.SQLITE;
    switch (type) {
      case 'git':
        const gitModule = await import('./git.js');
        storageInstance = gitModule.default || gitModule;
        break;
      case 'sqlite':
      default:
        const sqliteModule = await import('./sqlite.js');
        storageInstance = sqliteModule.default || sqliteModule;
        break;
    }
  }
  return storageInstance;
}

export const storage = {
  async getGist(gistId: string, userId: string | null = null) {
    const store = await getStorage();
    return store.getGist(gistId, userId);
  },

  async listGists(userId: string | null = null, includePublic: boolean = true) {
    const store = await getStorage();
    return store.listGists(userId, includePublic);
  },

  async createGist(userId: string, data: any) {
    const store = await getStorage();
    return store.createGist(userId, data);
  },

  async updateGist(gistId: string, userId: string, data: any) {
    const store = await getStorage();
    return store.updateGist(gistId, userId, data);
  },

  async deleteGist(gistId: string, userId: string) {
    const store = await getStorage();
    return store.deleteGist(gistId, userId);
  },

  async starGist(gistId: string, userId: string) {
    const store = await getStorage();
    return store.starGist(gistId, userId);
  },

  async unstarGist(gistId: string, userId: string) {
    const store = await getStorage();
    return store.unstarGist(gistId, userId);
  },

  async getStarredGists(userId: string) {
    const store = await getStorage();
    return store.getStarredGists(userId);
  },

  async getGistFile(gistId: string, filename: string, userId: string | null = null) {
    const store = await getStorage();
    return store.getGistFile(gistId, filename, userId);
  },
};

export function resetStorageInstance() {
  storageInstance = null;
}
