import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../setup.js';
import { withTestApp, apiRequest } from '../helpers/client.js';

const defaultUser = {
  username: 'tester',
  email: 'tester@example.com',
  password: 'aStrongPassword1',
  name: 'Tester Reed',
};

async function registerUser(client, overrides = {}) {
  const payload = { ...defaultUser, ...overrides };
  const response = await apiRequest(client, {
    method: 'POST',
    path: '/api/auth/register',
    body: payload,
  });
  return response;
}

test('registering returns a token and user', async () => {
  await withTestApp(async (client) => {
    const response = await registerUser(client);
    assert.equal(response.status, 200);
    assert.ok(response.body?.token);
    assert.equal(response.body.user.username, defaultUser.username);
    assert.equal(response.body.user.email, defaultUser.email);
    assert.equal(response.body.user.name, defaultUser.name);
  });
});

test('register rejects incomplete payloads', async () => {
  await withTestApp(async (client) => {
    const response = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: { username: 'short' },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body?.error);
  });
});

test('login requires correct credentials and returns a user snapshot', async () => {
  await withTestApp(async (client) => {
    await registerUser(client);
    const login = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: defaultUser.email, password: defaultUser.password },
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.email, defaultUser.email);
    assert.equal(login.body.user.name, defaultUser.name);
    const badLogin = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: defaultUser.email, password: 'wrong' },
    });
    assert.equal(badLogin.status, 401);
    assert.ok(badLogin.body?.error);
  });
});

test('authenticated user endpoint rejects missing or invalid token', async () => {
  await withTestApp(async (client) => {
    const missing = await apiRequest(client, { path: '/api/auth/user' });
    assert.equal(missing.status, 401);

    await registerUser(client);
    const login = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: defaultUser.email, password: defaultUser.password },
    });

    const user = await apiRequest(client, {
      path: '/api/auth/user',
      headers: { Authorization: `Bearer ${login.body.token}` },
    });
    assert.equal(user.status, 200);
    assert.equal(user.body.email, defaultUser.email);
    assert.equal(user.body.name, defaultUser.name);
  });
});

test('PATCH /api/auth/user updates name', async () => {
  await withTestApp(async (client) => {
    const response = await registerUser(client);
    const newName = 'Tester Updated';
    const updated = await apiRequest(client, {
      method: 'PATCH',
      path: '/api/auth/user',
      headers: { Authorization: `Bearer ${response.body.token}` },
      body: { name: newName },
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.name, newName);

    const fetched = await apiRequest(client, {
      path: '/api/auth/user',
      headers: { Authorization: `Bearer ${response.body.token}` },
    });
    assert.equal(fetched.body.name, newName);
  });
});
