import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../setup.js';
import { withTestApp, apiRequest } from '../helpers/client.js';

const user = {
  username: 'gist-user',
  email: 'gist-user@example.com',
  password: 'GistPass789',
};
const userName = 'Gist Maestro';
user.name = userName;

async function registerAndGetJwt(client) {
  const response = await apiRequest(client, {
    method: 'POST',
    path: '/api/auth/register',
    body: user,
  });
  return response.body.token;
}

test('gist endpoints support create/read/update/delete and starring', async () => {
  await withTestApp(async (client) => {
    const jwt = await registerAndGetJwt(client);

    const initial = await apiRequest(client, { path: '/api/gists' });
    assert.equal(initial.status, 200);
    assert.equal(initial.body.length, 0);

    const gistPayload = {
      description: 'test gist',
      public: true,
      files: {
        'snippet.txt': {
          content: 'console.log(\"hi\");',
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
    assert.equal(created.body.description, gistPayload.description);
    assert.equal(created.body.owner?.name, userName);
    assert.equal(created.body.owner?.email, user.email);

    const listed = await apiRequest(client, { path: '/api/gists' });
    assert.equal(listed.status, 200);
    const listGist = listed.body.find((g) => g.id === gistId);
    assert.ok(listGist);
    assert.equal(listGist.owner?.name, userName);
    assert.equal(listGist.owner?.email, user.email);

    const fetched = await apiRequest(client, { path: `/api/gists/${gistId}` });
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.id, gistId);

    const fileResponse = await apiRequest(client, {
      path: `/api/gists/${gistId}/files/${encodeURIComponent('snippet.txt')}`,
    });
    assert.equal(fileResponse.status, 200);
    assert.equal(fileResponse.body, gistPayload.files['snippet.txt'].content);

    const updated = await apiRequest(client, {
      method: 'PATCH',
      path: `/api/gists/${gistId}`,
      headers: { Authorization: `Bearer ${jwt}` },
      body: { description: 'updated gist', public: false },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.description, 'updated gist');
    assert.strictEqual(Boolean(updated.body.public), false);

    const starResp = await apiRequest(client, {
      method: 'POST',
      path: `/api/gists/${gistId}/star`,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(starResp.status, 204);

    const starred = await apiRequest(client, {
      path: '/api/gists/starred',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(starred.status, 200);
    assert.equal(starred.body.length, 1);

    const unstarResp = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/gists/${gistId}/star`,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(unstarResp.status, 204);

    const deleted = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/gists/${gistId}`,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(deleted.status, 204);

    const afterDelete = await apiRequest(client, { path: `/api/gists/${gistId}` });
    assert.equal(afterDelete.status, 404);
  });
});

test('creating gists requires authentication and files', async () => {
  await withTestApp(async (client) => {
    const withoutAuth = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      body: { description: 'no auth', files: { 'a.txt': { content: 'ok' } } },
    });
    assert.equal(withoutAuth.status, 401);

    const jwt = await registerAndGetJwt(client);
    const missingFiles = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      headers: { Authorization: `Bearer ${jwt}` },
      body: { description: 'empty files' },
    });
    assert.equal(missingFiles.status, 400);
  });
});

test('gist authorization enforces privacy and mutation boundaries', async () => {
  await withTestApp(async (client) => {
    // User A creates a private gist and a public gist
    const jwtA = await registerAndGetJwt(client);

    const privateGist = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      headers: { Authorization: `Bearer ${jwtA}` },
      body: {
        description: 'private gist',
        public: false,
        files: { 'secret.txt': { content: 'hidden', language: 'text' } },
      },
    });
    assert.equal(privateGist.status, 201);

    // User B attempts to access A's private gist
    const jwtB = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: { username: 'userB', email: 'b@example.com', password: 'password123', name: 'User B' },
    });
    const tokenB = jwtB.body.token;

    const accessPrivate = await apiRequest(client, {
      method: 'GET',
      path: `/api/gists/${privateGist.body.id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(accessPrivate.status, 404); // Should be completely hidden

    // User B attempts to modify A's private gist
    const modifyPrivate = await apiRequest(client, {
      method: 'PATCH',
      path: `/api/gists/${privateGist.body.id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { description: 'hacked' },
    });
    assert.equal(modifyPrivate.status, 404);

    // User B attempts to delete A's private gist (403 - gist exists but not owner)
    const deletePrivate = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/gists/${privateGist.body.id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(deletePrivate.status, 403);

    // Create a public gist and try to delete it (should be 403 - visible but not owner)
    const publicGist = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      headers: { Authorization: `Bearer ${jwtA}` },
      body: {
        description: 'public gist',
        public: true,
        files: { 'public.txt': { content: 'visible', language: 'text' } },
      },
    });
    assert.equal(publicGist.status, 201);

    const deletePublic = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/gists/${publicGist.body.id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(deletePublic.status, 403);

    // Invalid starring operations
    const starMissing = await apiRequest(client, {
      method: 'POST',
      path: `/api/gists/fake-uuid-not-real/star`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(starMissing.status, 404);
  });
});

test('gist file manipulations handle partial datasets', async () => {
  await withTestApp(async (client) => {
    const jwt = await registerAndGetJwt(client);

    const created = await apiRequest(client, {
      method: 'POST',
      path: '/api/gists',
      headers: { Authorization: `Bearer ${jwt}` },
      body: {
        description: 'multi file',
        public: true,
        files: {
          'a.txt': { content: 'A' },
          'b.txt': { content: 'B' },
        },
      },
    });
    assert.equal(created.status, 201);
    const gistId = created.body.id;

    // Ensure missing file returns 404
    const fileResponse = await apiRequest(client, {
      path: `/api/gists/${gistId}/files/${encodeURIComponent('missing.txt')}`,
    });
    assert.equal(fileResponse.status, 404);

    // Replace files (dropping b.txt)
    const updated = await apiRequest(client, {
      method: 'PATCH',
      path: `/api/gists/${gistId}`,
      headers: { Authorization: `Bearer ${jwt}` },
      body: {
        files: {
          'a.txt': { content: 'updated A' },
          'c.txt': { content: 'new C' },
        },
      },
    });
    assert.equal(updated.status, 200);
    assert.ok(updated.body.files['a.txt']);
    assert.ok(updated.body.files['c.txt']);
    assert.equal(updated.body.files['b.txt'], undefined);
  });
});
