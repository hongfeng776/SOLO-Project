import { BaseDao } from './BaseDao';
import { SettleApplyOrder } from '../models/SettleApplyOrder';
import { Op, FindOptions } from 'sequelize';

export class SettleApplyOrderDao extends BaseDao<SettleApplyOrder> {
  constructor() {
    super(SettleApplyOrder);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<SettleApplyOrder>, 'where'>
  ): Promise<SettleApplyOrder[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByStatus(
    applyStatus: number,
    options?: Omit<FindOptions<SettleApplyOrder>, 'where'>
  ): Promise<SettleApplyOrder[]> {
    return this.model.findAll({
      where: { apply_status: applyStatus } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByPeriod(
    periodType: number,
    options?: Omit<FindOptions<SettleApplyOrder>, 'where'>
  ): Promise<SettleApplyOrder[]> {
    return this.model.findAll({
      where: { settle_period_type: periodType } as any,
      order: [['period_end_date', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindOptions<SettleApplyOrder>, 'where'>
  ): Promise<SettleApplyOrder[]> {
    return this.model.findAll({
      where: {
        period_start_date: { [Op.lte]: endDate },
        period_end_date: { [Op.gte]: startDate },
      } as any,
      order: [['period_end_date', 'DESC']],
      ...options,
    });
  }

  async findByApplyNo(
    applyNo: string,
    options?: Omit<FindOptions<SettleApplyOrder>, 'where'>
  ): Promise<SettleApplyOrder | null> {
    return this.model.findOne({
      where: { apply_no: applyNo } as any,
      ...options,
    });
  }
}

export default SettleApplyOrderDao;
