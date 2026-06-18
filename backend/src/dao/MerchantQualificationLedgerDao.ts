import { BaseDao } from './BaseDao';
import { MerchantQualificationLedger } from '../models/MerchantQualificationLedger';
import { Op, FindOptions } from 'sequelize';

export class MerchantQualificationLedgerDao extends BaseDao<MerchantQualificationLedger> {
  constructor() {
    super(MerchantQualificationLedger);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<MerchantQualificationLedger>, 'where'>
  ): Promise<MerchantQualificationLedger[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByQualificationId(
    qualificationId: number,
    options?: Omit<FindOptions<MerchantQualificationLedger>, 'where'>
  ): Promise<MerchantQualificationLedger[]> {
    return this.model.findAll({
      where: { qualification_id: qualificationId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByOperationType(
    operationType: string,
    options?: Omit<FindOptions<MerchantQualificationLedger>, 'where'>
  ): Promise<MerchantQualificationLedger[]> {
    return this.model.findAll({
      where: { operation_type: operationType } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<MerchantQualificationLedger>, 'where'>
  ): Promise<MerchantQualificationLedger[]> {
    return this.model.findAll({
      where: {
        created_at: {
          [Op.between]: [startTime, endTime],
        },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }
}

export default MerchantQualificationLedgerDao;
