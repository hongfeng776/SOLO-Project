const { OperationLog } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class OperationLogService {
  async getOperationLogList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);

    const where = {};

    if (query.operatorId) where.operator_id = query.operatorId;
    if (query.operationType) where.operation_type = query.operationType;
    if (query.operationModule) where.operation_module = query.operationModule;
    if (query.isSuccess !== undefined) where.is_success = query.isSuccess;

    if (query.startTime || query.endTime) {
      where.created_at = {};
      if (query.startTime) where.created_at[Op.gte] = new Date(query.startTime);
      if (query.endTime) where.created_at[Op.lte] = new Date(query.endTime);
    }

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((log) => ({
        id: log.id,
        operatorId: log.operator_id,
        operatorName: log.operator_name,
        operationType: log.operation_type,
        operationModule: log.operation_module,
        operationDesc: log.operation_desc,
        targetType: log.target_type,
        targetId: log.target_id,
        targetName: log.target_name,
        beforeData: log.before_data,
        afterData: log.after_data,
        requestMethod: log.request_method,
        requestUrl: log.request_url,
        requestParams: log.request_params,
        responseCode: log.response_code,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        duration: log.duration,
        isSuccess: log.is_success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getOperationLogById(id) {
    const log = await OperationLog.findByPk(id);
    if (!log) {
      throw new NotFoundError('操作日志不存在');
    }
    return {
      id: log.id,
      operatorId: log.operator_id,
      operatorName: log.operator_name,
      operationType: log.operation_type,
      operationModule: log.operation_module,
      operationDesc: log.operation_desc,
      targetType: log.target_type,
      targetId: log.target_id,
      targetName: log.target_name,
      beforeData: log.before_data,
      afterData: log.after_data,
      requestMethod: log.request_method,
      requestUrl: log.request_url,
      requestParams: log.request_params,
      responseCode: log.response_code,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      duration: log.duration,
      isSuccess: log.is_success,
      errorMessage: log.error_message,
      createdAt: log.created_at,
    };
  }

  async createOperationLog(data) {
    const log = await OperationLog.create({
      operator_id: data.operatorId,
      operator_name: data.operatorName,
      operation_type: data.operationType,
      operation_module: data.operationModule,
      operation_desc: data.operationDesc || null,
      target_type: data.targetType || null,
      target_id: data.targetId || null,
      target_name: data.targetName || null,
      before_data: data.beforeData || null,
      after_data: data.afterData || null,
      request_method: data.requestMethod || null,
      request_url: data.requestUrl || null,
      request_params: data.requestParams || null,
      response_code: data.responseCode || null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      duration: data.duration || null,
      is_success: data.isSuccess ?? 1,
      error_message: data.errorMessage || null,
    });
    return log.id;
  }

  async getOperationStats(query) {
    const where = {};

    if (query.startTime || query.endTime) {
      where.created_at = {};
      if (query.startTime) where.created_at[Op.gte] = new Date(query.startTime);
      if (query.endTime) where.created_at[Op.lte] = new Date(query.endTime);
    }

    const moduleStats = await OperationLog.findAll({
      where,
      attributes: ['operation_module', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['operation_module'],
      raw: true,
    });

    const typeStats = await OperationLog.findAll({
      where,
      attributes: ['operation_type', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['operation_type'],
      raw: true,
    });

    const operatorStats = await OperationLog.findAll({
      where,
      attributes: ['operator_id', 'operator_name', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['operator_id', 'operator_name'],
      raw: true,
      order: [[require('../config/database').sequelize.literal('count'), 'DESC']],
      limit: 10,
    });

    const moduleMap = {};
    for (const item of moduleStats) {
      moduleMap[item.operation_module] = Number(item.count);
    }

    const typeMap = {};
    for (const item of typeStats) {
      typeMap[item.operation_type] = Number(item.count);
    }

    return {
      moduleStats: moduleMap,
      typeStats: typeMap,
      operatorStats: operatorStats.map((item) => ({
        operatorId: item.operator_id,
        operatorName: item.operator_name,
        count: Number(item.count),
      })),
    };
  }

  async exportLogs(query) {
    const where = {};

    if (query.operatorId) where.operator_id = query.operatorId;
    if (query.operationType) where.operation_type = query.operationType;
    if (query.operationModule) where.operation_module = query.operationModule;
    if (query.isSuccess !== undefined) where.is_success = query.isSuccess;

    if (query.startTime || query.endTime) {
      where.created_at = {};
      if (query.startTime) where.created_at[Op.gte] = new Date(query.startTime);
      if (query.endTime) where.created_at[Op.lte] = new Date(query.endTime);
    }

    const logs = await OperationLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 10000,
    });

    return logs.map((log) => ({
      id: log.id,
      operatorName: log.operator_name,
      operationType: log.operation_type,
      operationModule: log.operation_module,
      operationDesc: log.operation_desc,
      targetType: log.target_type,
      targetId: log.target_id,
      targetName: log.target_name,
      requestMethod: log.request_method,
      requestUrl: log.request_url,
      responseCode: log.response_code,
      ipAddress: log.ip_address,
      duration: log.duration,
      isSuccess: log.is_success,
      errorMessage: log.error_message,
      createdAt: log.created_at,
    }));
  }
}

module.exports = new OperationLogService();
