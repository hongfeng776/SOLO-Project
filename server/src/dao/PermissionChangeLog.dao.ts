import { CreateOptions, Op } from 'sequelize';
import PermissionChangeLog, { PermissionChangeLogCreationAttributes, ChangeTargetType, ChangeAction } from '../models/PermissionChangeLog.model';

export interface PermissionChangeLogQueryParams {
  page: number;
  pageSize: number;
  operatorId?: string;
  operatorName?: string;
  targetType?: ChangeTargetType;
  targetId?: string;
  action?: ChangeAction;
  module?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
}

export interface AnomalyDetectionParams {
  userId?: string;
  timeWindowMinutes?: number;
  frequencyThreshold?: number;
  startTime?: string;
  endTime?: string;
}

class PermissionChangeLogDao {
  public async create(data: PermissionChangeLogCreationAttributes, options?: CreateOptions): Promise<PermissionChangeLog> {
    return PermissionChangeLog.create(data, options);
  }

  public async findById(id: string): Promise<PermissionChangeLog | null> {
    return PermissionChangeLog.findByPk(id);
  }

  public async findAllPaged(params: PermissionChangeLogQueryParams): Promise<{ rows: PermissionChangeLog[]; count: number }> {
    const { page, pageSize, operatorId, operatorName, targetType, targetId, action, module, startTime, endTime, keyword } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (operatorId) where.operatorId = operatorId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (action) where.action = action;
    if (module) where.module = module;

    if (operatorName) {
      where.operatorName = { [Op.like]: `%${operatorName}%` };
    }

    if (keyword) {
      where[Op.or] = [
        { operatorName: { [Op.like]: `%${keyword}%` } },
        { targetName: { [Op.like]: `%${keyword}%` } },
        { reason: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return PermissionChangeLog.findAndCountAll({ where, offset, limit: pageSize, order: [['createdAt', 'DESC']] });
  }

  public async findAllForExport(params: Omit<PermissionChangeLogQueryParams, 'page' | 'pageSize'>): Promise<PermissionChangeLog[]> {
    const { operatorId, operatorName, targetType, targetId, action, module, startTime, endTime, keyword } = params;
    const where: any = {};

    if (operatorId) where.operatorId = operatorId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (action) where.action = action;
    if (module) where.module = module;
    if (operatorName) where.operatorName = { [Op.like]: `%${operatorName}%` };

    if (keyword) {
      where[Op.or] = [
        { operatorName: { [Op.like]: `%${keyword}%` } },
        { targetName: { [Op.like]: `%${keyword}%` } },
        { reason: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return PermissionChangeLog.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  public async detectHighFrequencyOperations(params: AnomalyDetectionParams): Promise<any[]> {
    const { userId, timeWindowMinutes = 10, frequencyThreshold = 20, startTime, endTime } = params;
    const windowMs = timeWindowMinutes * 60 * 1000;

    const where: any = {};
    if (userId) where.operatorId = userId;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) where.createdAt[Op.lte] = new Date(endTime);
    }

    const logs = await PermissionChangeLog.findAll({ where, order: [['createdAt', 'ASC']] });
    const clusters: any[] = [];
    let currentCluster: any[] = [];

    for (const log of logs) {
      if (currentCluster.length === 0) {
        currentCluster.push(log);
      } else {
        const firstLog = currentCluster[0];
        const diff = new Date(log.createdAt).getTime() - new Date(firstLog.createdAt).getTime();
        if (diff <= windowMs) {
          currentCluster.push(log);
        } else {
          if (currentCluster.length >= frequencyThreshold) {
            clusters.push({
              startTime: currentCluster[0].createdAt,
              endTime: currentCluster[currentCluster.length - 1].createdAt,
              count: currentCluster.length,
              operatorId: currentCluster[0].operatorId,
              operatorName: currentCluster[0].operatorName,
              actions: [...new Set(currentCluster.map(l => l.action))],
              ips: [...new Set(currentCluster.map(l => l.ip))],
              sampleLogs: currentCluster.slice(0, 5),
            });
          }
          currentCluster = [log];
        }
      }
    }

    if (currentCluster.length >= frequencyThreshold) {
      clusters.push({
        startTime: currentCluster[0].createdAt,
        endTime: currentCluster[currentCluster.length - 1].createdAt,
        count: currentCluster.length,
        operatorId: currentCluster[0].operatorId,
        operatorName: currentCluster[0].operatorName,
        actions: [...new Set(currentCluster.map(l => l.action))],
        ips: [...new Set(currentCluster.map(l => l.ip))],
        sampleLogs: currentCluster.slice(0, 5),
      });
    }

    return clusters;
  }

  public async findAnomalyOperations(params: AnomalyDetectionParams): Promise<PermissionChangeLog[]> {
    const { userId, startTime, endTime } = params;
    const where: any = { action: { [Op.in]: ['batch_assign', 'batch_revoke', 'delete'] } };
    if (userId) where.operatorId = userId;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = new Date(startTime);
      if (endTime) where.createdAt[Op.lte] = new Date(endTime);
    }
    return PermissionChangeLog.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
  }
}

export default new PermissionChangeLogDao();
