import { Op } from 'sequelize';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';
import { PermissionLog } from '../models';
import PermissionLogModel from '../models/permission-log.model';

class PermissionLogDao extends BaseDao<PermissionLogModel> {
  constructor() {
    super(PermissionLog);
  }

  async findByUserId(userId: number, page = 1, pageSize = 20): Promise<IPaginationResult<PermissionLogModel>> {
    const { count, rows } = await this.model.findAndCountAll({
      where: { userId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
    return { list: rows, total: count, page, pageSize };
  }

  async findWithFilters(params: IPaginationParams): Promise<IPaginationResult<PermissionLogModel>> {
    const {
      page = 1,
      pageSize = 20,
      userId,
      companyId,
      action,
      operatorId,
      startTime,
      endTime,
      changeType,
      keyword,
    } = params;
    const where: any = {};

    if (userId) where.userId = userId;
    if (companyId) where.companyId = companyId;
    if (action) where.action = action;
    if (operatorId) where.operatorId = operatorId;
    if (changeType) where.changeType = changeType;
    if (startTime) where.created_at = { ...where.created_at, [Op.gte]: startTime };
    if (endTime) where.created_at = { ...where.created_at, [Op.lte]: endTime };
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { operatorName: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async findLatestByUserId(userId: number, limit = 5): Promise<PermissionLogModel[]> {
    return this.model.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }
}

export default new PermissionLogDao();
