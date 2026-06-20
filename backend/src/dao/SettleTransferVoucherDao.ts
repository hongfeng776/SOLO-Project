import { BaseDao } from './BaseDao';
import { SettleTransferVoucher } from '../models/SettleTransferVoucher';
import { FindOptions } from 'sequelize';

export class SettleTransferVoucherDao extends BaseDao<SettleTransferVoucher> {
  constructor() {
    super(SettleTransferVoucher);
  }

  async findBySettleApplyId(
    settleApplyId: number,
    options?: Omit<FindOptions<SettleTransferVoucher>, 'where'>
  ): Promise<SettleTransferVoucher | null> {
    return this.model.findOne({
      where: { settle_apply_id: settleApplyId } as any,
      ...options,
    });
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<SettleTransferVoucher>, 'where'>
  ): Promise<SettleTransferVoucher[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByTransferNo(
    transferNo: string,
    options?: Omit<FindOptions<SettleTransferVoucher>, 'where'>
  ): Promise<SettleTransferVoucher | null> {
    return this.model.findOne({
      where: { transfer_no: transferNo } as any,
      ...options,
    });
  }
}

export default SettleTransferVoucherDao;
