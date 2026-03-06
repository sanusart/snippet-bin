import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../setup.js';
import { withTestApp, apiRequest } from '../helpers/client.js';

const user = {
  username: 'token-user',
  email: 'token-user@example.com',
  password: 'TokenPass456',
  name: 'Token Keeper',
};

async function registerAndGetJwt(client) {
  const response = await apiRequest(client, {
    method: 'POST',
    path: '/api/auth/register',
    body: user,
  });
  return response.body.token;
}

test('token management endpoints require auth and follow lifecycle', async () => {
  await withTestApp(async (client) => {
    const jwt = await registerAndGetJwt(client);
    const listBefore = await apiRequest(client, {
      path: '/api/tokens',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(listBefore.status, 200);
    assert.equal(listBefore.body.length, 0);

    const created = await apiRequest(client, {
      method: 'POST',
      path: '/api/tokens',
      headers: { Authorization: `Bearer ${jwt}` },
      body: { note: 'CI token' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.note, 'CI token');
    assert.ok(created.body.token);

    const listAfter = await apiRequest(client, {
      path: '/api/tokens',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(listAfter.status, 200);
    assert.equal(listAfter.body.length, 1);

    const deleteResponse = await apiRequest(client, {
      method: 'DELETE',
      path: `/api/tokens/${created.body.id}`,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(deleteResponse.status, 204);

    const listFinal = await apiRequest(client, {
      path: '/api/tokens',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    assert.equal(listFinal.status, 200);
    assert.equal(listFinal.body.length, 0);
  });
});

test('create token using credentials when no JWT is provided', async () => {
  await withTestApp(async (client) => {
    await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: user,
    });

    const response = await apiRequest(client, {
      method: 'POST',
      path: '/api/tokens',
      body: {
        email: user.email,
        password: user.password,
        note: 'credential token',
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.note, 'credential token');
    assert.ok(response.body.token?.startsWith('sb_tkn_'));
  });
});
