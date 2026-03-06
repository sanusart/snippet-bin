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
