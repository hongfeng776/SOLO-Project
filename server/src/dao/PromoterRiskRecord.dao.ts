import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import PromoterRiskRecord, { PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes } from '../models/PromoterRiskRecord.model';

class PromoterRiskRecordDao {
  public async create(data: PromoterRiskRecordCreationAttributes, options?: CreateOptions): Promise<PromoterRiskRecord> {
    return PromoterRiskRecord.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterRiskRecord | null> {
    return PromoterRiskRecord.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterRiskRecord | null> {
    return PromoterRiskRecord.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterRiskRecord[]> {
    return PromoterRiskRecord.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterRiskRecord[]; count: number }> {
    return PromoterRiskRecord.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return PromoterRiskRecord.count(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterRiskRecord[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    riskLevel?: string;
    riskType?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterRiskRecord[]; count: number }> {
    const { page, pageSize, promoterId, riskLevel, riskType, isActive, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (riskLevel) {
      where.riskLevel = riskLevel;
    }
    if (riskType) {
      where.riskType = riskType;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async update(id: string, data: Partial<PromoterRiskRecordAttributes>): Promise<[number, PromoterRiskRecord[]]> {
    return PromoterRiskRecord.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterRiskRecord.destroy({
      where: { id },
    });
  }
}

export default new PromoterRiskRecordDao();
