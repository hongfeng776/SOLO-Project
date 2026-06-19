import { BaseDao } from './BaseDao';
import { ShopOperationLedger } from '../models/ShopOperationLedger';
import { Op, FindOptions } from 'sequelize';

export class ShopOperationLedgerDao extends BaseDao<ShopOperationLedger> {
  constructor() {
    super(ShopOperationLedger);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<ShopOperationLedger>, 'where'>
  ): Promise<ShopOperationLedger[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByOperationType(
    merchantId: number,
    type: string,
    options?: Omit<FindOptions<ShopOperationLedger>, 'where'>
  ): Promise<ShopOperationLedger[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId, operation_type: type } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<ShopOperationLedger>, 'where'>
  ): Promise<ShopOperationLedger[]> {
    return this.model.findAll({
      where: {
        created_at: { [Op.between]: [startTime, endTime] },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async getOperationStats(merchantId: number, type?: string, startTime?: Date, endTime?: Date) {
    const where: any = { merchant_id: merchantId };
    if (type) where.operation_type = type;
    if (startTime && endTime) where.created_at = { [Op.between]: [startTime, endTime] };
    return this.model.findAndCountAll({ where } as any);
  }
}

export default ShopOperationLedgerDao;
