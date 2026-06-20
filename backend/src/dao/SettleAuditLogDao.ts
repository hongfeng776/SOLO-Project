import { BaseDao } from './BaseDao';
import { SettleAuditLog } from '../models/SettleAuditLog';
import { Op, FindOptions } from 'sequelize';

export class SettleAuditLogDao extends BaseDao<SettleAuditLog> {
  constructor() {
    super(SettleAuditLog);
  }

  async findBySettleApplyId(
    settleApplyId: number,
    options?: Omit<FindOptions<SettleAuditLog>, 'where'>
  ): Promise<SettleAuditLog[]> {
    return this.model.findAll({
      where: { settle_apply_id: settleApplyId } as any,
      order: [['created_at', 'ASC']],
      ...options,
    });
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<SettleAuditLog>, 'where'>
  ): Promise<SettleAuditLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: Omit<FindOptions<SettleAuditLog>, 'where'>
  ): Promise<SettleAuditLog[]> {
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

export default SettleAuditLogDao;
