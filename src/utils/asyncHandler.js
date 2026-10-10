/**
 * Wrapper for Express async route handlers to catch uncaught rejections
 * @param {Function} fn 
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
