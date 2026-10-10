const test = require('node:test');
const assert = require('node:assert');
const apiKeyAuth = require('../src/middlewares/auth.middleware');
const config = require('../src/config/env');

test('API Key Auth Middleware Tests', async (t) => {
  await t.test('Should return 401 when x-api-key header is missing', () => {
    const req = { headers: {} };
    let statusSet = null;
    let jsonBody = null;

    const res = {
      status(s) {
        statusSet = s;
        return this;
      },
      json(j) {
        jsonBody = j;
        return this;
      }
    };

    let nextCalled = false;
    apiKeyAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(statusSet, 401);
    assert.strictEqual(jsonBody.success, false);
    assert.match(jsonBody.error, /Missing x-api-key/);
    assert.strictEqual(nextCalled, false);
  });

  await t.test('Should return 401 when x-api-key header is incorrect', () => {
    const req = { headers: { 'x-api-key': 'wrong-key-123' } };
    let statusSet = null;
    let jsonBody = null;

    const res = {
      status(s) {
        statusSet = s;
        return this;
      },
      json(j) {
        jsonBody = j;
        return this;
      }
    };

    let nextCalled = false;
    apiKeyAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(statusSet, 401);
    assert.strictEqual(jsonBody.success, false);
    assert.match(jsonBody.error, /Invalid API Key/);
    assert.strictEqual(nextCalled, false);
  });

  await t.test('Should call next() when valid x-api-key header is provided', () => {
    const req = { headers: { 'x-api-key': config.apiKey } };
    let nextCalled = false;

    const res = {
      status() { return this; },
      json() { return this; }
    };

    apiKeyAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
  });
});
