const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Request logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Alias for convenience
app.use('/', apiRoutes);    // Direct alias (e.g. /report/checks)

// Root endpoint: returns API metadata
app.get('/', (req, res) => {
  return res.status(200).json({
    name: 'GoldenSoft POS Sales Report API',
    version: '1.0.0',
    status: 'running',
    baseUrl: config.baseUrl,
    apiBaseUrl: config.apiBaseUrl,
    endpoints: {
      health: `${config.apiBaseUrl}/health`,
      basicReport: `${config.apiBaseUrl}/report/basic?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`,
      detailedReport: `${config.apiBaseUrl}/report/detailed?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`,
      checksReport: `${config.apiBaseUrl}/report/checks?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
