const test = require('node:test');
const assert = require('node:assert');
const { toNumber, formatMoney, trimString, formatDate, formatIsoDateTime } = require('../src/utils/formatters');
const { sanitizeMenuName } = require('../src/services/report.service');

test('Formatters and Utilities Tests', async (t) => {
  await t.test('toNumber correctly converts strings and handles null/undefined/NaN', () => {
    assert.strictEqual(toNumber('123.45'), 123.45);
    assert.strictEqual(toNumber(100), 100);
    assert.strictEqual(toNumber(null), 0);
    assert.strictEqual(toNumber(undefined), 0);
    assert.strictEqual(toNumber(''), 0);
    assert.strictEqual(toNumber('abc'), 0);
    assert.strictEqual(toNumber('abc', 5), 5);
  });

  await t.test('formatMoney formats numbers with decimal precision', () => {
    assert.strictEqual(formatMoney(1000, 4), 1000);
    assert.strictEqual(formatMoney(120.55554, 4), 120.5555);
    assert.strictEqual(formatMoney(120.55556, 4), 120.5556);
    assert.strictEqual(formatMoney('250.5000', 4), 250.5);
    assert.strictEqual(formatMoney(null, 4), 0);
    assert.strictEqual(formatMoney(undefined, 4), 0);
  });

  await t.test('trimString removes whitespace padding from MSSQL CHAR fields', () => {
    assert.strictEqual(trimString('Beverages               '), 'Beverages');
    assert.strictEqual(trimString('  Hot Drinks  '), 'Hot Drinks');
    assert.strictEqual(trimString(null), '');
    assert.strictEqual(trimString(undefined), '');
  });

  await t.test('formatDate correctly formats date strings and Date objects', () => {
    const d = new Date('2026-08-19T10:01:00Z');
    assert.strictEqual(formatDate(d), '2026-08-19');
    assert.strictEqual(formatDate('2026-08-19'), '2026-08-19');
    assert.strictEqual(formatDate(null), '');
  });

  await t.test('formatIsoDateTime formats times and datetimes to ISO local format', () => {
    assert.strictEqual(formatIsoDateTime('11:27:12', '2026-03-16'), '2026-03-16T11:27:12');
    assert.strictEqual(formatIsoDateTime('9:05:00', '2026-10-02'), '2026-10-02T09:05:00');
    assert.strictEqual(formatIsoDateTime('2025/12/10 12:35:49 AM'), '2025-12-10T00:35:49');
    assert.strictEqual(formatIsoDateTime('2026/03/17 9:38:52 P'), '2026-03-17T21:38:52');
    assert.strictEqual(formatIsoDateTime('2026/03/17 9:38:52 PM'), '2026-03-17T21:38:52');
    assert.strictEqual(formatIsoDateTime(null), null);
    assert.strictEqual(formatIsoDateTime(''), null);
  });

  await t.test('sanitizeMenuName cleans menu names and falls back to Kind<menuCode>', () => {
    assert.strictEqual(sanitizeMenuName('Hot Drinks', 1), 'HotDrinks');
    assert.strictEqual(sanitizeMenuName('Food & Beverages', 2), 'FoodBeverages');
    assert.strictEqual(sanitizeMenuName('!!!', 5), 'Kind5');
    assert.strictEqual(sanitizeMenuName('', 8), 'Kind8');
    assert.strictEqual(sanitizeMenuName(null, 10), 'Kind10');
  });
});
