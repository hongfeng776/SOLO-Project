const BaseService = require('./BaseService');
const SystemLog = require('../models/SystemLog');

class SystemLogService extends BaseService {
  constructor() {
    super(SystemLog);
  }

  async recordLog(data) {
    return await this.create(data);
  }

  async getLogList(params = {}) {
    return super.getList(params, {
      searchFields: ['action', 'module', 'username'],
      fieldMap: {
        dateField: 'createdAt'
      },
      defaultOrder: [['id', 'DESC']]
    });
  }

  async exportLogs(params = {}) {
    const { startTime, endTime, action, module } = params;
    const where = {};
    if (startTime && endTime) {
      where.createdAt = { between: [new Date(startTime), new Date(endTime)] };
    }
    if (action) where.action = action;
    if (module) where.module = module;

    const logs = await SystemLog.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });

    return logs;
  }
}

module.exports = new SystemLogService();
