import { Op } from 'sequelize';
import RecruitmentConfigLog from '../models/recruitment-config-log.model';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';

class RecruitmentConfigLogDao extends BaseDao<RecruitmentConfigLog> {
  constructor() {
    super(RecruitmentConfigLog);
  }

  async findByConfigId(configId: number, page = 1, pageSize = 20): Promise<IPaginationResult<RecruitmentConfigLog>> {
    const { count, rows } = await this.model.findAndCountAll({
      where: { configId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
    return { list: rows, total: count, page, pageSize };
  }

  async findLatestByConfigId(configId: number): Promise<RecruitmentConfigLog | null> {
    return this.model.findOne({
      where: { configId },
      order: [['created_at', 'DESC']],
    });
  }

  async findWithFilters(params: IPaginationParams): Promise<IPaginationResult<RecruitmentConfigLog>> {
    const {
      page = 1,
      pageSize = 20,
      configId,
      companyId,
      action,
      operatorId,
      startTime,
      endTime,
      changedFields,
      isComplianceChecked,
    } = params;
    const where: any = {};

    if (configId) where.configId = configId;
    if (companyId) where.companyId = companyId;
    if (action) where.action = action;
    if (operatorId) where.operatorId = operatorId;
    if (startTime) where.created_at = { ...where.created_at, [Op.gte]: startTime };
    if (endTime) where.created_at = { ...where.created_at, [Op.lte]: endTime };
    if (changedFields) where.changedFields = { [Op.like]: `%${changedFields}%` };
    if (isComplianceChecked !== undefined) where.isComplianceChecked = isComplianceChecked;

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });
    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async findDuplicateConfig(configId: number, newValues: string): Promise<RecruitmentConfigLog | null> {
    return this.model.findOne({
      where: {
        configId,
        newValues,
        action: { [Op.in]: ['create', 'update'] },
      },
      order: [['created_at', 'DESC']],
    });
  }
}

export default new RecruitmentConfigLogDao();
