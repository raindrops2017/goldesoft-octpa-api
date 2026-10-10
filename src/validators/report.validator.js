const Joi = require('joi');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that a string is a real calendar date (checks leap years, month length, etc.)
 * @param {string} str YYYY-MM-DD
 * @returns {boolean}
 */
const isValidCalendarDate = (str) => {
  if (!datePattern.test(str)) return false;
  const parts = str.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

const dateFromValidator = Joi.string()
  .trim()
  .required()
  .custom((val, helpers) => {
    if (!datePattern.test(val)) {
      return helpers.error('string.pattern.base');
    }
    if (!isValidCalendarDate(val)) {
      return helpers.error('any.invalidDate');
    }
    return val;
  })
  .messages({
    'any.required': 'dateFrom is required',
    'string.empty': 'dateFrom cannot be empty',
    'string.pattern.base': 'dateFrom must be in YYYY-MM-DD format',
    'any.invalidDate': 'dateFrom must be a valid calendar date in YYYY-MM-DD format'
  });

const dateToValidator = Joi.string()
  .trim()
  .required()
  .custom((val, helpers) => {
    if (!datePattern.test(val)) {
      return helpers.error('string.pattern.base');
    }
    if (!isValidCalendarDate(val)) {
      return helpers.error('any.invalidDate');
    }
    return val;
  })
  .messages({
    'any.required': 'dateTo is required',
    'string.empty': 'dateTo cannot be empty',
    'string.pattern.base': 'dateTo must be in YYYY-MM-DD format',
    'any.invalidDate': 'dateTo must be a valid calendar date in YYYY-MM-DD format'
  });

const validateDateRange = (obj, helpers) => {
  if (obj.dateFrom && obj.dateTo && isValidCalendarDate(obj.dateFrom) && isValidCalendarDate(obj.dateTo)) {
    if (obj.dateFrom > obj.dateTo) {
      return helpers.error('date.rangeInvalid');
    }
  }
  return obj;
};

const reportQuerySchema = Joi.object({
  dateFrom: dateFromValidator,
  dateTo: dateToValidator
})
  .custom(validateDateRange)
  .messages({
    'date.rangeInvalid': 'dateFrom cannot be later than dateTo'
  });

const reportChecksQuerySchema = Joi.object({
  dateFrom: dateFromValidator,
  dateTo: dateToValidator,
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional()
})
  .custom(validateDateRange)
  .messages({
    'date.rangeInvalid': 'dateFrom cannot be later than dateTo'
  });

module.exports = {
  reportQuerySchema,
  reportChecksQuerySchema
};
