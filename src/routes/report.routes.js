const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const apiKeyAuth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { reportQuerySchema, reportChecksQuerySchema } = require('../validators/report.validator');

// All report routes require API Key authentication
router.use(apiKeyAuth);

/**
 * @route   GET /api/v1/report/basic?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * @desc    Lightweight daily totals sales report
 * @access  Protected (x-api-key)
 */
router.get(
  '/basic',
  validate(reportQuerySchema, 'query'),
  reportController.getBasic.bind(reportController)
);

/**
 * @route   GET /api/v1/report/detailed?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * @desc    Full detailed summary sales report with category breakdown
 * @access  Protected (x-api-key)
 */
router.get(
  '/detailed',
  validate(reportQuerySchema, 'query'),
  reportController.getDetailed.bind(reportController)
);

/**
 * @route   GET /api/v1/report/checks?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * @desc    Individual checks report with line items
 * @access  Protected (x-api-key)
 */
router.get(
  '/checks',
  validate(reportChecksQuerySchema, 'query'),
  reportController.getChecks.bind(reportController)
);

module.exports = router;
