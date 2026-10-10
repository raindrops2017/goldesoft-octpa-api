const test = require('node:test');
const { before, after, describe, it } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const config = require('../src/config/env');
const { sequelize } = require('../src/config/database');

describe('Express API Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    return new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    try {
      await sequelize.close();
    } catch {
      // Ignore if already closed
    }
  });

  it('GET / returns 200 with API metadata', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'running');
    assert.strictEqual(data.name, 'GoldenSoft POS Sales Report API');
    assert.ok(data.endpoints.basicReport);
    assert.ok(data.endpoints.detailedReport);
  });

  it('GET /api/v1/health returns health status object', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.ok(res.status === 200 || res.status === 503);
    const data = await res.json();
    assert.ok(data.timestamp);
    assert.ok(data.database);
    assert.strictEqual(data.service, 'golden-soft-sales-report-api');
  });

  it('GET /api/v1/report/basic without x-api-key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic?dateFrom=2026-08-01&dateTo=2026-08-31`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Missing x-api-key/);
  });

  it('GET /api/v1/report/basic with invalid x-api-key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic?dateFrom=2026-08-01&dateTo=2026-08-31`, {
      headers: { 'x-api-key': 'invalid-secret-key' }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Invalid API Key/);
  });

  it('GET /api/v1/report/basic with missing query params returns 400 Validation failed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Validation failed');
    assert.ok(Array.isArray(data.details));
  });

  it('GET /api/v1/report/basic with invalid date format returns 400 Validation failed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic?dateFrom=bad-date&dateTo=2026-08-31`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Validation failed');
    assert.ok(data.details.some((d) => d.field === 'dateFrom'));
  });

  it('GET /api/v1/report/basic with non-existent calendar date (2026-04-31) returns 400 Validation failed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic?dateFrom=2026-04-01&dateTo=2026-04-31`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Validation failed');
    assert.ok(data.details.some((d) => d.field === 'dateTo'));
  });

  it('GET /api/v1/report/detailed without x-api-key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/detailed?dateFrom=2026-08-01&dateTo=2026-08-31`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Missing x-api-key/);
  });

  it('GET /api/v1/report/detailed with missing params returns 400 Validation failed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/detailed?dateFrom=2026-08-01`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Validation failed');
    assert.ok(data.details.some((d) => d.field === 'dateTo'));
  });

  it('GET /api/v1/report/basic with valid params returns 200 and single period object', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/basic?dateFrom=2026-08-01&dateTo=2026-08-31`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data, 'object');
    assert.strictEqual(Array.isArray(body.data), false);
    assert.strictEqual(body.data.dateFrom, '2026-08-01');
    assert.strictEqual(body.data.dateTo, '2026-08-31');
    assert.strictEqual(typeof body.data.chkQty, 'number');
    assert.strictEqual(typeof body.data.deliveryQty, 'number');
    assert.strictEqual(typeof body.data.delivery, 'number');
    assert.strictEqual(typeof body.data.clChecksQty, 'number');
    assert.strictEqual(typeof body.data.clChecksValue, 'number');
    assert.strictEqual(typeof body.data.totalRevenue, 'number');
  });

  it('GET /api/v1/report/detailed with valid params returns 200 and single period object', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/detailed?dateFrom=2026-08-01&dateTo=2026-08-31`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.data, 'object');
    assert.strictEqual(Array.isArray(body.data), false);
    assert.strictEqual(body.data.dateFrom, '2026-08-01');
    assert.strictEqual(body.data.dateTo, '2026-08-31');
    assert.strictEqual(typeof body.data.gSales, 'number');
    assert.strictEqual(typeof body.data.cashInDrawer, 'number');
  });

  it('GET /api/v1/report/checks without x-api-key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/checks?dateFrom=2026-03-01&dateTo=2026-03-31`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Missing x-api-key/);
  });

  it('GET /api/v1/report/checks with missing params returns 400 Validation failed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/checks?dateFrom=2026-03-01`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Validation failed');
  });

  it('GET /api/v1/report/checks with valid params returns 200 and checks array with line items', async () => {
    const res = await fetch(`${baseUrl}/api/v1/report/checks?dateFrom=2026-03-01&dateTo=2026-03-31&page=1&limit=5`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length <= 5);

    if (body.data.length > 0) {
      const check = body.data[0];
      assert.strictEqual(typeof check.checkNo, 'number');
      assert.match(check.businessDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(check.openedAt);
      assert.ok(['DINE_IN', 'DELIVERY', 'TAKEAWAY'].includes(check.orderType));
      assert.strictEqual(typeof check.netSales, 'number');
      assert.strictEqual(typeof check.service, 'number');
      assert.strictEqual(typeof check.tax, 'number');
      assert.strictEqual(typeof check.discount, 'number');
      assert.strictEqual(typeof check.total, 'number');
      assert.ok(['CLOSED', 'OPEN', 'VOID', 'COMP', 'OFFICER', 'FOOD TEST'].includes(check.status));
      assert.ok(check.updatedAt);
      assert.ok(Array.isArray(check.items));

      if (check.items.length > 0) {
        const item = check.items[0];
        assert.ok(typeof item.name === 'string');
        assert.ok(typeof item.category === 'string');
        assert.strictEqual(typeof item.qty, 'number');
        assert.strictEqual(typeof item.unitPrice, 'number');
        assert.strictEqual(typeof item.total, 'number');
        assert.strictEqual(typeof item.voided, 'boolean');
      }
    }
  });

  it('GET /report/checks directly at root alias returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/report/checks?dateFrom=2026-03-01&dateTo=2026-03-31&limit=2`, {
      headers: { 'x-api-key': config.apiKey }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('Unknown route returns 404 Not Found', async () => {
    const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Route not found/);
  });
});
