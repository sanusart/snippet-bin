import { once } from 'node:events';
import { Duplex } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../../src/app.js';

function createMockSocket() {
  const socket = new Duplex({
    read() {},
    write(chunk, encoding, callback) {
      callback?.();
      return true;
    },
  });
  socket.writable = true;
  socket.readable = true;
  socket.destroy = () => {};
  return socket;
}

function buildRequest({ method, path, headers, body }) {
  const socket = createMockSocket();
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = path;
  const normalizedHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    normalizedHeaders[key.toLowerCase()] = value;
  }
  req.headers = { ...normalizedHeaders };

  if (body !== undefined) {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    req.headers['content-length'] = Buffer.byteLength(payload).toString();
    if (!req.headers['content-type'] && !req.headers['Content-Type']) {
      req.headers['content-type'] = 'application/json';
    }
    req.push(payload);
  }
  req.push(null);

  return { req, socket };
}

export async function withTestApp(callback) {
  const app = createApp();
  return callback({ app });
}

export async function apiRequest(client, { path, method = 'GET', headers = {}, body } = {}) {
  const { req, socket } = buildRequest({ method, path, headers, body });
  const res = new ServerResponse(req);
  res.assignSocket(socket);

  const chunks = [];
  const originalWrite = res.write;
  res.write = function (chunk, encoding, cb) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }
    return originalWrite.call(this, chunk, encoding, cb);
  };

  const originalEnd = res.end;
  res.end = function (chunk, encoding, cb) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }
    return originalEnd.call(this, chunk, encoding, cb);
  };

  const finished = once(res, 'finish');
  client.app.handle(req, res);
  await finished;

  const text = Buffer.concat(chunks).toString('utf8');
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return {
    status: res.statusCode,
    body: parsed,
    rawBody: text,
  };
}
