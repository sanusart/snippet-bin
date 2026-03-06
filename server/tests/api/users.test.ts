import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../setup.js';
import { withTestApp, apiRequest } from '../helpers/client.js';

const viewer = {
  username: 'viewer',
  email: 'viewer@example.com',
  password: 'ViewerPass123',
  name: 'Viewer One',
};

async function registerViewer(client) {
  const response = await apiRequest(client, {
    method: 'POST',
    path: '/api/auth/register',
    body: viewer,
  });
  return response;
}

test('GET /api/users/:username returns profile data', async () => {
  await withTestApp(async (client) => {
    await registerViewer(client);
    const profile = await apiRequest(client, { path: `/api/users/${viewer.username}` });
    assert.equal(profile.status, 200);
    assert.equal(profile.body.login, viewer.username);
    assert.equal(profile.body.name, viewer.name);
    assert.ok(profile.body.avatar_url);
    assert.equal(profile.body.email, viewer.email);
  });
});

test('missing user returns 404', async () => {
  await withTestApp(async (client) => {
    const profile = await apiRequest(client, { path: '/api/users/not-there' });
    assert.equal(profile.status, 404);
  });
});
