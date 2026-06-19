import { BaseDao } from './BaseDao';
import { ShopInfoChangeLog } from '../models/ShopInfoChangeLog';
import { Op, FindOptions } from 'sequelize';

export class ShopInfoChangeLogDao extends BaseDao<ShopInfoChangeLog> {
  constructor() {
    super(ShopInfoChangeLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<ShopInfoChangeLog>, 'where'>
  ): Promise<ShopInfoChangeLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByChangeField(
    merchantId: number,
    field: string,
    options?: Omit<FindOptions<ShopInfoChangeLog>, 'where'>
  ): Promise<ShopInfoChangeLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId, change_field: field } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByRiskLevel(
    level: number,
    options?: Omit<FindOptions<ShopInfoChangeLog>, 'where'>
  ): Promise<ShopInfoChangeLog[]> {
    return this.model.findAll({
      where: { risk_level: level } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<ShopInfoChangeLog>, 'where'>
  ): Promise<ShopInfoChangeLog[]> {
    return this.model.findAll({
      where: {
        created_at: { [Op.between]: [startTime, endTime] },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }
}

export default ShopInfoChangeLogDao;
