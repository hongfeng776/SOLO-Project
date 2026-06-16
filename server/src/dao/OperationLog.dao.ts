import { CreateOptions, Op } from 'sequelize';
import OperationLog, { OperationLogCreationAttributes } from '../models/OperationLog.model';

interface OperationLogQueryParams {
  page: number;
  pageSize: number;
  userId?: string;
  module?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}

class OperationLogDao {
  public async create(data: OperationLogCreationAttributes, options?: CreateOptions): Promise<OperationLog> {
    return OperationLog.create(data, options);
  }

  public async findAllPaged(params: OperationLogQueryParams): Promise<{ rows: OperationLog[]; count: number }> {
    const { page, pageSize, userId, module, action, targetType, targetId, status, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (status !== undefined) where.status = status;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }
    return OperationLog.findAndCountAll({ where, offset, limit: pageSize, order: [['createdAt', 'DESC']] });
  }
}

export default new OperationLogDao();
