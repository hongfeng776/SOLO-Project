import { BaseDao } from './BaseDao';
import { MerchantQualification } from '../models/MerchantQualification';
import { Op, FindOptions } from 'sequelize';

export class MerchantQualificationDao extends BaseDao<MerchantQualification> {
  constructor() {
    super(MerchantQualification);
  }

  async findValidByMerchantAndCategory(
    merchantId: number,
    categoryId: number,
    options?: Omit<FindOptions<MerchantQualification>, 'where'>
  ): Promise<MerchantQualification[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        merchant_id: merchantId,
        category_id: categoryId,
        status: 1,
        [Op.or]: [
          { valid_from: { [Op.lte]: now } },
          { valid_from: null },
        ],
        [Op.and]: [
          {
            [Op.or]: [
              { valid_to: { [Op.gte]: now } },
              { valid_to: null },
            ],
          },
        ],
      },
      ...options,
    } as FindOptions<MerchantQualification>);
  }
}

export default MerchantQualificationDao;
