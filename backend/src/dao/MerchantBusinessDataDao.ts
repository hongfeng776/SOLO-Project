import { BaseDao } from './BaseDao';
import { MerchantBusinessData } from '../models/MerchantBusinessData';
import { Op, FindOptions } from 'sequelize';

export class MerchantBusinessDataDao extends BaseDao<MerchantBusinessData> {
  constructor() {
    super(MerchantBusinessData);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['stat_end_date', 'DESC']],
      ...options,
    });
  }

  async findByPeriod(
    merchantId: number,
    periodType: number,
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: {
        merchant_id: merchantId,
        stat_period_type: periodType,
      } as any,
      order: [['stat_end_date', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: {
        stat_start_date: { [Op.lte]: endDate },
        stat_end_date: { [Op.gte]: startDate },
      } as any,
      order: [['stat_end_date', 'DESC']],
      ...options,
    });
  }

  async findByStatus(
    dataStatus: number,
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: { data_status: dataStatus } as any,
      order: [['updated_at', 'DESC']],
      ...options,
    });
  }

  async findByRiskLevel(
    riskLevel: number,
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: { risk_level: riskLevel } as any,
      order: [['updated_at', 'DESC']],
      ...options,
    });
  }

  async findAbnormal(
    options?: Omit<FindOptions<MerchantBusinessData>, 'where'>
  ): Promise<MerchantBusinessData[]> {
    return this.model.findAll({
      where: { is_abnormal: 1 } as any,
      order: [['updated_at', 'DESC']],
      ...options,
    });
  }
}

export default MerchantBusinessDataDao;
