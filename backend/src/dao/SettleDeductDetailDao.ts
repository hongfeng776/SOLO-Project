import { BaseDao } from './BaseDao';
import { SettleDeductDetail } from '../models/SettleDeductDetail';
import { Op, FindOptions } from 'sequelize';

export class SettleDeductDetailDao extends BaseDao<SettleDeductDetail> {
  constructor() {
    super(SettleDeductDetail);
  }

  async findBySettleApplyId(
    settleApplyId: number,
    options?: Omit<FindOptions<SettleDeductDetail>, 'where'>
  ): Promise<SettleDeductDetail[]> {
    return this.model.findAll({
      where: { settle_apply_id: settleApplyId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<SettleDeductDetail>, 'where'>
  ): Promise<SettleDeductDetail[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDeductType(
    deductType: number,
    options?: Omit<FindOptions<SettleDeductDetail>, 'where'>
  ): Promise<SettleDeductDetail[]> {
    return this.model.findAll({
      where: { deduct_type: deductType } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindOptions<SettleDeductDetail>, 'where'>
  ): Promise<SettleDeductDetail[]> {
    return this.model.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }
}

export default SettleDeductDetailDao;
