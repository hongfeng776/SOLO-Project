const OperationLogService = require('../services/OperationLogService');
const { success, paginated } = require('../utils/response');
const { validate, paginationSchema, Joi } = require('../middleware/validator');

class OperationLogController {
  getOperationLogList = [
    validate(paginationSchema.keys({
      module: Joi.string().allow(null, ''),
      action: Joi.string().allow(null, ''),
      operator: Joi.string().allow(null, ''),
      startTime: Joi.date().allow(null, ''),
      endTime: Joi.date().allow(null, ''),
    }), 'query'),
    async (req, res, next) => {
      try {
        const result = await OperationLogService.getOperationLogList(req.query);
        return paginated(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getOperationLogById = [
    async (req, res, next) => {
      try {
        const result = await OperationLogService.getOperationLogById(parseInt(req.params.id));
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  getOperationStats = [
    async (req, res, next) => {
      try {
        const result = await OperationLogService.getOperationStats(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];

  exportLogs = [
    async (req, res, next) => {
      try {
        const result = await OperationLogService.exportLogs(req.query);
        return success(res, result);
      } catch (error) {
        next(error);
      }
    }
  ];
}

module.exports = new OperationLogController();
