const express = require('express');
const router = express.Router();

const reportRoutes = require('./report.routes');
const healthRoutes = require('./health.routes');

// Mount routes under /api/v1 (and /api alias)
router.use('/report', reportRoutes);
router.use('/health', healthRoutes);

module.exports = router;
