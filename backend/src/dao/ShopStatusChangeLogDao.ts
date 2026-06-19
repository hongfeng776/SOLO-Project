import { BaseDao } from './BaseDao';
import { ShopStatusChangeLog } from '../models/ShopStatusChangeLog';
import { Op, FindOptions } from 'sequelize';

export class ShopStatusChangeLogDao extends BaseDao<ShopStatusChangeLog> {
  constructor() {
    super(ShopStatusChangeLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<ShopStatusChangeLog>, 'where'>
  ): Promise<ShopStatusChangeLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByStatusSource(
    source: string,
    options?: Omit<FindOptions<ShopStatusChangeLog>, 'where'>
  ): Promise<ShopStatusChangeLog[]> {
    return this.model.findAll({
      where: { status_source: source } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<ShopStatusChangeLog>, 'where'>
  ): Promise<ShopStatusChangeLog[]> {
    return this.model.findAll({
      where: {
        created_at: { [Op.between]: [startTime, endTime] },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findLatestByMerchantId(merchantId: number): Promise<ShopStatusChangeLog | null> {
    return this.model.findOne({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
    });
  }
}

export default ShopStatusChangeLogDao;
