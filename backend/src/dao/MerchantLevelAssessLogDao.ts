import { BaseDao } from './BaseDao';
import { MerchantLevelAssessLog } from '../models/MerchantLevelAssessLog';
import { Op, FindOptions } from 'sequelize';

export class MerchantLevelAssessLogDao extends BaseDao<MerchantLevelAssessLog> {
  constructor() {
    super(MerchantLevelAssessLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<MerchantLevelAssessLog>, 'where'>
  ): Promise<MerchantLevelAssessLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByPeriod(
    periodType: number,
    options?: Omit<FindOptions<MerchantLevelAssessLog>, 'where'>
  ): Promise<MerchantLevelAssessLog[]> {
    return this.model.findAll({
      where: { assess_period_type: periodType } as any,
      order: [['assess_end_date', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindOptions<MerchantLevelAssessLog>, 'where'>
  ): Promise<MerchantLevelAssessLog[]> {
    return this.model.findAll({
      where: {
        assess_start_date: { [Op.lte]: endDate },
        assess_end_date: { [Op.gte]: startDate },
      } as any,
      order: [['assess_end_date', 'DESC']],
      ...options,
    });
  }
}

export default MerchantLevelAssessLogDao;
