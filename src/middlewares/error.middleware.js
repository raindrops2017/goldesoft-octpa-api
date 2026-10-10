const config = require('../config/env');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Handle MSSQL datetime conversion out-of-range error (error number 242)
  const isDateConversionError =
    err.name === 'SequelizeDatabaseError' &&
    err.parent &&
    (err.parent.number === 242 || /conversion.*datetime.*out-of-range/i.test(err.parent.message || ''));

  const statusCode = err.statusCode || (
    err.name === 'SequelizeValidationError' || isDateConversionError ? 400 : 500
  );

  const response = {
    success: false,
    error: isDateConversionError
      ? 'Invalid date: the provided date is not a valid calendar date or is out of range.'
      : (err.message || 'Internal Server Error')
  };

  if (config.env === 'development') {
    response.stack = err.stack;
    if (err.errors) {
      response.details = err.errors;
    }
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
