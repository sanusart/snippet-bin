import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const gitDataDir = join(tmpdir(), 'snippet-bin-git-tests');
process.env.STORAGE_BACKEND = 'git';
process.env.STORAGE_GISTS_DIR = gitDataDir;
process.env.SNIPPETBIN_DB_PATH = process.env.SNIPPETBIN_DB_PATH || 'memory';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function cleanGitDir() {
  fs.rmSync(gitDataDir, { recursive: true, force: true });
  fs.mkdirSync(gitDataDir, { recursive: true });
}

cleanGitDir();

import '../setup.js';
import { withTestApp, apiRequest } from '../helpers/client.js';
import { resetStorageInstance } from '../../src/storage/index.js';

const gitUser = {
  username: 'git-user',
  email: 'git-user@example.com',
  password: 'GitPass012',
  name: 'Git Maestro',
};

async function registerAndGetJwt(client) {
  const response = await apiRequest(client, {
    method: 'POST',
    path: '/api/auth/register',
    body: gitUser,
  });
  assert.equal(response.status, 200);
  return response.body.token;
}

beforeEach(() => {
  cleanGitDir();
  resetStorageInstance();
});

afterEach(() => {
  cleanGitDir();
});

test('git backend writes gist files and keeps repos in the configured directory', async () => {
  await withTestApp(async (client) => {
    const jwt = await registerAndGetJwt(client);
    const gistPayload = {
      description: 'git storage gist',
      public: true,
      files: {
        'snippet.txt': {
          content: 'console.log(\"git storage\");',
          language: 'javascript',
        },
      },
    };

    const created = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      headers: { Authorization: `Bearer ${jwt}` },
      body: gistPayload,
    });
    assert.equal(created.status, 201);
    const gistId = created.body.id;

    const workPath = join(gitDataDir, gistId);
    assert.ok(fs.existsSync(workPath));
    assert.ok(fs.existsSync(join(workPath, '.git')));

    const snippetPath = join(workPath, 'snippet.txt');
    assert.equal(fs.readFileSync(snippetPath, 'utf8'), gistPayload.files['snippet.txt'].content);
    const head = execSync('git rev-parse HEAD', { cwd: workPath, encoding: 'utf8' }).trim();
    assert.ok(head);
    const author = execSync("git log -1 --pretty=format:'%an <%ae>'", {
      cwd: workPath,
      encoding: 'utf8',
    }).trim();
    assert.equal(author, `${gitUser.name} <${gitUser.email}>`);
    const committer = execSync("git log -1 --pretty=format:'%cn <%ce>'", {
      cwd: workPath,
      encoding: 'utf8',
    }).trim();
    assert.equal(committer, `${gitUser.name} <${gitUser.email}>`);

    const deleteResponse = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/gists/${gistId}`,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(deleteResponse.status, 204);
    assert.equal(fs.existsSync(workPath), false);
  });
});
