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

test('register rejects incomplete payloads or duplicates', async () => {
  await withTestApp(async (client) => {
    // Missing fields
    const missing = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: { username: 'short' },
    });
    assert.equal(missing.status, 400);
    assert.ok(missing.body?.error);

    // Invalid email
    const badEmail = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: { ...defaultUser, username: 'tester2', email: 'not-an-email' },
    });
    assert.equal(badEmail.status, 400);
    assert.match(badEmail.body?.error, /valid/);

    // Short password
    const badPassword = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/register',
      body: { ...defaultUser, username: 'tester3', password: '123' },
    });
    assert.equal(badPassword.status, 400);

    // Duplicate user
    await registerUser(client);
    const dup = await registerUser(client);
    assert.equal(dup.status, 400);
    assert.match(dup.body?.error, /taken|registered/);
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
    
    const badLoginPass = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: defaultUser.email, password: 'wrong' },
    });
    assert.equal(badLoginPass.status, 401);
    
    const badLoginUser = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'nobody@example.com', password: defaultUser.password },
    });
    assert.equal(badLoginUser.status, 401);

    const missingCreds = await apiRequest(client, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: defaultUser.email },
    });
    assert.equal(missingCreds.status, 400);
  });
});

test('authenticated user endpoint rejects missing or invalid token', async () => {
  await withTestApp(async (client) => {
    const missing = await apiRequest(client, { path: '/api/auth/user' });
    assert.equal(missing.status, 401);

    const malformed = await apiRequest(client, { 
      path: '/api/auth/user',
      headers: { Authorization: `Bearer completely-invalid-string` },
    });
    assert.equal(malformed.status, 403);

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
