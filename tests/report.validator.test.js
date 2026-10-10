const test = require('node:test');
const assert = require('node:assert');
const { reportQuerySchema, reportChecksQuerySchema } = require('../src/validators/report.validator');

test('Report Query Validator Tests', async (t) => {
  await t.test('Valid dateFrom and dateTo pass validation', () => {
    const query = {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31'
    };

    const { error, value } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.strictEqual(error, undefined);
    assert.strictEqual(value.dateFrom, '2026-08-01');
    assert.strictEqual(value.dateTo, '2026-08-31');
  });

  await t.test('Missing dateFrom fails validation', () => {
    const query = {
      dateTo: '2026-08-31'
    };

    const { error } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.ok(error.details.some((d) => d.path.includes('dateFrom')));
  });

  await t.test('Missing dateTo fails validation', () => {
    const query = {
      dateFrom: '2026-08-01'
    };

    const { error } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.ok(error.details.some((d) => d.path.includes('dateTo')));
  });

  await t.test('Invalid date format fails validation with all details', () => {
    const query = {
      dateFrom: '01-08-2026',
      dateTo: 'invalid-date'
    };

    const { error } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.strictEqual(error.details.length, 2);
    assert.ok(error.details.some((d) => d.path.includes('dateFrom')));
    assert.ok(error.details.some((d) => d.path.includes('dateTo')));
  });

  await t.test('reportChecksQuerySchema accepts optional page and limit', () => {
    const query = {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 2,
      limit: 50
    };

    const { error, value } = reportChecksQuerySchema.validate(query, { abortEarly: false });
    assert.strictEqual(error, undefined);
    assert.strictEqual(value.page, 2);
    assert.strictEqual(value.limit, 50);
  });

  await t.test('reportChecksQuerySchema rejects negative or non-integer page and limit', () => {
    const query = {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 0,
      limit: 'abc'
    };

    const { error } = reportChecksQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.ok(error.details.some((d) => d.path.includes('page')));
    assert.ok(error.details.some((d) => d.path.includes('limit')));
  });

  await t.test('Invalid calendar dates (e.g. 2026-04-31 or 2026-02-29) fail validation', () => {
    const query = {
      dateFrom: '2026-02-29',
      dateTo: '2026-04-31'
    };

    const { error } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.strictEqual(error.details.length, 2);
    assert.ok(error.details.some((d) => d.path.includes('dateFrom')));
    assert.ok(error.details.some((d) => d.path.includes('dateTo')));
    assert.match(error.details[0].message, /valid calendar date/i);
  });

  await t.test('dateFrom greater than dateTo fails validation', () => {
    const query = {
      dateFrom: '2026-05-10',
      dateTo: '2026-05-01'
    };

    const { error } = reportQuerySchema.validate(query, { abortEarly: false });
    assert.ok(error);
    assert.match(error.message, /cannot be later than/i);
  });
});
