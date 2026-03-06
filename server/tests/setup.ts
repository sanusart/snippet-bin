process.env.SNIPPETBIN_DB_PATH = process.env.SNIPPETBIN_DB_PATH || 'memory';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

import { beforeEach } from 'node:test';

const { default: db } = await import('../src/db.js');

function resetDatabase() {
  const tables = ['gist_files', 'gist_stars', 'tokens', 'gists', 'users'];
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
}

beforeEach(() => {
  resetDatabase();
});

export { resetDatabase };
