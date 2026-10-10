const crypto = require('crypto');
const config = require('../config/env');

/**
 * Middleware for API Key authentication
 * Checks for 'x-api-key' header
 */
const apiKeyAuth = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'] || req.headers['X-Api-Key'];

  if (!providedApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing x-api-key header'
    });
  }

  const expectedKey = config.apiKey;

  try {
    const providedBuffer = Buffer.from(String(providedApiKey));
    const expectedBuffer = Buffer.from(String(expectedKey));

    if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API Key'
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API Key'
    });
  }

  next();
};

module.exports = apiKeyAuth;
