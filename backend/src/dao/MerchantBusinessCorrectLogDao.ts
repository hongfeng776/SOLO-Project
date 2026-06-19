import { BaseDao } from './BaseDao';
import { MerchantBusinessCorrectLog } from '../models/MerchantBusinessCorrectLog';
import { Op, FindOptions } from 'sequelize';

export class MerchantBusinessCorrectLogDao extends BaseDao<MerchantBusinessCorrectLog> {
  constructor() {
    super(MerchantBusinessCorrectLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<MerchantBusinessCorrectLog>, 'where'>
  ): Promise<MerchantBusinessCorrectLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByBusinessDataId(
    businessDataId: number,
    options?: Omit<FindOptions<MerchantBusinessCorrectLog>, 'where'>
  ): Promise<MerchantBusinessCorrectLog[]> {
    return this.model.findAll({
      where: { business_data_id: businessDataId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<MerchantBusinessCorrectLog>, 'where'>
  ): Promise<MerchantBusinessCorrectLog[]> {
    return this.model.findAll({
      where: {
        created_at: { [Op.between]: [startTime, endTime] },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }
}

export default MerchantBusinessCorrectLogDao;
