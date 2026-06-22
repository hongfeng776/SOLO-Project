import { Op } from 'sequelize';
import MessagePermissionLog from '../models/message-permission-log.model';
import { MessagePermissionAction } from '../constants/recruitment.enum';

export interface MessagePermissionLogQueryParams {
  page?: number;
  pageSize?: number;
  permissionId?: number;
  userId?: number;
  action?: MessagePermissionAction;
  operatorId?: number;
  startTime?: string;
  endTime?: string;
}

class MessagePermissionLogDAO {
  async create(data: any) {
    return MessagePermissionLog.create(data);
  }

  async getByPermissionId(permissionId: number, page = 1, pageSize = 20) {
    return MessagePermissionLog.findAndCountAll({
      where: { permissionId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
  }

  async getByUserId(userId: number, page = 1, pageSize = 20) {
    return MessagePermissionLog.findAndCountAll({
      where: { userId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
  }

  async getList(params: MessagePermissionLogQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      permissionId,
      userId,
      action,
      operatorId,
      startTime,
      endTime,
    } = params;

    const where: any = {};

    if (permissionId !== undefined) where.permissionId = permissionId;
    if (userId !== undefined) where.userId = userId;
    if (action) where.action = action;
    if (operatorId !== undefined) where.operatorId = operatorId;

    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = new Date(startTime);
      if (endTime) where.created_at[Op.lte] = new Date(endTime);
    }

    return MessagePermissionLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
  }

  async getLatestLog(userId: number, action?: MessagePermissionAction) {
    const where: any = { userId };
    if (action) where.action = action;
    return MessagePermissionLog.findOne({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getOperatorStats(operatorId: number, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return MessagePermissionLog.count({
      where: {
        operatorId,
        created_at: { [Op.gte]: startDate },
      },
    });
  }
}

export default new MessagePermissionLogDAO();
