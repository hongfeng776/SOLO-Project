import { BaseDao } from './BaseDao';
import { BrandAuthorization } from '../models/BrandAuthorization';
import { Op, FindOptions } from 'sequelize';

export class BrandAuthorizationDao extends BaseDao<BrandAuthorization> {
  constructor() {
    super(BrandAuthorization);
  }

  async findValidByMerchantAndBrand(
    merchantId: number,
    brandId: number,
    options?: Omit<FindOptions<BrandAuthorization>, 'where'>
  ): Promise<BrandAuthorization[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        merchant_id: merchantId,
        brand_id: brandId,
        status: 1,
        valid_from: { [Op.lte]: now },
        valid_to: { [Op.gte]: now },
      },
      ...options,
    } as FindOptions<BrandAuthorization>);
  }
}

export default BrandAuthorizationDao;
