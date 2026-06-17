import { Op } from 'sequelize';
import RecruitmentConfig from '../models/recruitment-config.model';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';

class RecruitmentConfigDao extends BaseDao<RecruitmentConfig> {
  constructor() {
    super(RecruitmentConfig);
  }

  async findByCompanyId(companyId: number): Promise<RecruitmentConfig | null> {
    return this.findOne({ where: { companyId } });
  }

  async getList(params: IPaginationParams): Promise<IPaginationResult<RecruitmentConfig>> {
    const { page = 1, pageSize = 10, companyName, configStatus, industry, activityLevelMin, positionGapMin } = params;
    const where: any = {};

    if (companyName) {
      where.companyName = { [Op.like]: `%${companyName}%` };
    }
    if (configStatus) {
      where.configStatus = configStatus;
    }
    if (activityLevelMin !== undefined) {
      where.activityLevel = { [Op.gte]: activityLevelMin };
    }
    if (positionGapMin !== undefined) {
      where.positionGapCount = { [Op.gte]: positionGapMin };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async getByIds(ids: number[]): Promise<RecruitmentConfig[]> {
    return this.findAll({ where: { id: { [Op.in]: ids } } });
  }

  async getByCompanyIds(companyIds: number[]): Promise<RecruitmentConfig[]> {
    return this.findAll({ where: { companyId: { [Op.in]: companyIds } } });
  }

  async batchUpdateStatus(ids: number[], configStatus: string, data: any): Promise<[number, RecruitmentConfig[]]> {
    return this.model.update(data, {
      where: { id: { [Op.in]: ids } },
      returning: true,
    });
  }
}

export default new RecruitmentConfigDao();
