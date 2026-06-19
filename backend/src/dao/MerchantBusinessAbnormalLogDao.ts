import { BaseDao } from './BaseDao';
import { MerchantBusinessAbnormalLog } from '../models/MerchantBusinessAbnormalLog';
import { Op, FindOptions, fn, col } from 'sequelize';

export interface AbnormalStats {
  total: number;
  byType: Record<number, number>;
  byLevel: Record<number, number>;
  byStatus: Record<number, number>;
}

export class MerchantBusinessAbnormalLogDao extends BaseDao<MerchantBusinessAbnormalLog> {
  constructor() {
    super(MerchantBusinessAbnormalLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<MerchantBusinessAbnormalLog>, 'where'>
  ): Promise<MerchantBusinessAbnormalLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByCheckStatus(
    checkStatus: number,
    options?: Omit<FindOptions<MerchantBusinessAbnormalLog>, 'where'>
  ): Promise<MerchantBusinessAbnormalLog[]> {
    return this.model.findAll({
      where: { check_status: checkStatus } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByAbnormalType(
    abnormalType: number,
    options?: Omit<FindOptions<MerchantBusinessAbnormalLog>, 'where'>
  ): Promise<MerchantBusinessAbnormalLog[]> {
    return this.model.findAll({
      where: { abnormal_type: abnormalType } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<MerchantBusinessAbnormalLog>, 'where'>
  ): Promise<MerchantBusinessAbnormalLog[]> {
    return this.model.findAll({
      where: {
        created_at: { [Op.between]: [startTime, endTime] },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async getAbnormalStats(): Promise<AbnormalStats> {
    const total = await this.model.count();

    const byTypeResult = await this.model.findAll({
      attributes: ['abnormal_type', [fn('COUNT', col('id')), 'count']],
      group: ['abnormal_type'],
      raw: true,
    } as any);

    const byLevelResult = await this.model.findAll({
      attributes: ['abnormal_level', [fn('COUNT', col('id')), 'count']],
      group: ['abnormal_level'],
      raw: true,
    } as any);

    const byStatusResult = await this.model.findAll({
      attributes: ['check_status', [fn('COUNT', col('id')), 'count']],
      group: ['check_status'],
      raw: true,
    } as any);

    const byType: Record<number, number> = {};
    byTypeResult.forEach((item: any) => {
      byType[item.abnormal_type] = Number(item.count);
    });

    const byLevel: Record<number, number> = {};
    byLevelResult.forEach((item: any) => {
      byLevel[item.abnormal_level] = Number(item.count);
    });

    const byStatus: Record<number, number> = {};
    byStatusResult.forEach((item: any) => {
      byStatus[item.check_status] = Number(item.count);
    });

    return { total, byType, byLevel, byStatus };
  }
}

export default MerchantBusinessAbnormalLogDao;
