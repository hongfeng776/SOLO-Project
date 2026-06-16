const { success, pagination } = require('../utils/result');
const systemLogService = require('../services/SystemLogService');

class SystemLogController {
  async list(req, res, next) {
    try {
      const { pageNum, pageSize } = req.pagination;
      const params = { ...req.query, pageNum, pageSize };
      const result = await systemLogService.getLogList(params);
      res.json(pagination(result.list, result.total, result.pageNum, result.pageSize));
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const logs = await systemLogService.exportLogs(req.query);
      res.json(success(logs));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SystemLogController();
