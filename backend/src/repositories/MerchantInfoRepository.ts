import { BaseRepository } from './BaseRepository';
import { MerchantInfo } from '../models';
import { Op } from 'sequelize';

export class MerchantInfoRepository extends BaseRepository<MerchantInfo> {
  constructor() {
    super(MerchantInfo);
  }

  async findByMerchantNo(merchantNo: string): Promise<MerchantInfo | null> {
    return await this.model.findOne({ where: { merchant_no: merchantNo } });
  }

  async findByName(name: string): Promise<MerchantInfo | null> {
    return await this.model.findOne({
      where: {
        merchant_name: { [Op.like]: `%${name}%` }
      }
    });
  }

  async getByMerchantType(type: number): Promise<MerchantInfo[]> {
    return await this.model.findAll({
      where: { merchant_type: type },
      order: [['created_at', 'DESC']]
    });
  }

  async updateRiskLevel(id: string, riskLevel: number): Promise<[number, MerchantInfo[]]> {
    return await this.update(id, { risk_level: riskLevel });
  }
}
