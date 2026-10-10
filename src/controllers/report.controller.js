const reportService = require('../services/report.service');
const { success } = require('../utils/response');

class ReportController {
  /**
   * GET /api/v1/report/basic
   * Lightweight daily totals
   */
  async getBasic(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await reportService.getBasicSalesReport({ dateFrom, dateTo });
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/report/detailed
   * Full detailed sales report with category breakdown
   */
  async getDetailed(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await reportService.getDetailedSalesReport({ dateFrom, dateTo });
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/report/checks
   * Detailed check breakdown with line items
   */
  async getChecks(req, res, next) {
    try {
      const { dateFrom, dateTo, page, limit } = req.query;
      const data = await reportService.getChecksReport({ dateFrom, dateTo, page, limit });
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
