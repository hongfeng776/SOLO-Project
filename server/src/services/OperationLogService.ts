import { Op } from 'sequelize';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

class OperationLogService {
  async createLog(data: {
    user_id?: number;
    username?: string;
    module: string;
    operation: string;
    operationType?: string;
    method?: string;
    url?: string;
    params?: string;
    ip?: string;
    ip_address?: string;
    user_agent?: string;
    target_type?: string;
    target_id?: number;
    request_params?: any;
    response_data?: any;
    operation_status?: string;
    status?: string;
    error_msg?: string;
    duration?: number;
    remark?: string;
  }) {
    return db.OperationLog.create({
      user_id: data.user_id,
      username: data.username,
      module: data.module,
      operation: data.operation,
      operation_type: data.operationType || data.method || 'other',
      target_type: data.target_type,
      target_id: data.target_id,
      ip_address: data.ip_address || data.ip,
      user_agent: data.user_agent,
      request_params: data.request_params ? JSON.stringify(data.request_params) : data.params,
      response_data: data.response_data ? JSON.stringify(data.response_data) : undefined,
      operation_status: data.operation_status || data.status || 'success',
      error_msg: data.error_msg,
      duration: data.duration,
      remark: data.remark,
    });
  }

  async getLogById(id: number) {
    const log = await db.OperationLog.findByPk(id);
    if (!log) {
      throw new AppError(404, 'Operation log not found');
    }
    return log;
  }

  async getLogList(params: {
    page: number;
    pageSize: number;
    userId?: number;
    module?: string;
    operation?: string;
    operationType?: string;
    operationStatus?: string;
    status?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) {
    const { page, pageSize, userId, module, operation, operationType, operationStatus, status, targetType, startDate, endDate, keyword } = params;
    const where: any = {};

    if (userId) {
      where.user_id = userId;
    }
    if (module) {
      where.module = module;
    }
    if (operation) {
      where.operation = { [Op.like]: `%${operation}%` };
    }
    if (operationType) {
      where.operation_type = operationType;
    }
    if (operationStatus || status) {
      where.operation_status = operationStatus || status;
    }
    if (targetType) {
      where.target_type = targetType;
    }
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.created_at = { [Op.gte]: startDate };
    } else if (endDate) {
      where.created_at = { [Op.lte]: endDate };
    }
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { operation: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.OperationLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }
}

export default new OperationLogService();
