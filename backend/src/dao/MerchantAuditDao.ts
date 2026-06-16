import { BaseDao } from './BaseDao';
import { MerchantAudit } from '../models/MerchantAudit';

export class MerchantAuditDao extends BaseDao<MerchantAudit> {
  constructor() {
    super(MerchantAudit);
  }

  async findByMerchantId(merchantId: number): Promise<MerchantAudit[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
    });
  }

  async findLatestByMerchantId(merchantId: number): Promise<MerchantAudit | null> {
    return this.model.findOne({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
    });
  }
}

export default MerchantAuditDao;
