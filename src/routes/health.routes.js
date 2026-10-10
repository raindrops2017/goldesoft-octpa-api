const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route   GET /api/v1/health
 * @desc    Public health check endpoint
 * @access  Public
 */
router.get('/', healthController.checkHealth.bind(healthController));

module.exports = router;
