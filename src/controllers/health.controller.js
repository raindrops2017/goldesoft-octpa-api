const { sequelize } = require('../config/database');

class HealthController {
  /**
   * GET /api/v1/health
   * Public health check for server uptime and database connectivity
   */
  async checkHealth(req, res) {
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
      await sequelize.authenticate();
      dbStatus = 'connected';
    } catch (err) {
      dbError = err.message;
    }

    const isHealthy = dbStatus === 'connected';

    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'golden-soft-sales-report-api',
      database: {
        status: dbStatus,
        error: dbError
      },
      uptime: process.uptime()
    });
  }
}

module.exports = new HealthController();
