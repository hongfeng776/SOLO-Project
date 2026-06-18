import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import PromoterRiskRelease, { PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes } from '../models/PromoterRiskRelease.model';

class PromoterRiskReleaseDao {
  public async create(data: PromoterRiskReleaseCreationAttributes, options?: CreateOptions): Promise<PromoterRiskRelease> {
    return PromoterRiskRelease.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterRiskRelease | null> {
    return PromoterRiskRelease.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterRiskRelease | null> {
    return PromoterRiskRelease.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterRiskRelease[]> {
    return PromoterRiskRelease.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterRiskRelease[]; count: number }> {
    return PromoterRiskRelease.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return PromoterRiskRelease.count(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterRiskRelease[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    verifyStatus?: number;
    riskRecordId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterRiskRelease[]; count: number }> {
    const { page, pageSize, promoterId, verifyStatus, riskRecordId, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (verifyStatus !== undefined) {
      where.verifyStatus = verifyStatus;
    }
    if (riskRecordId) {
      where.riskRecordId = riskRecordId;
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

  public async update(id: string, data: Partial<PromoterRiskReleaseAttributes>): Promise<[number, PromoterRiskRelease[]]> {
    return PromoterRiskRelease.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterRiskRelease.destroy({
      where: { id },
    });
  }
}

export default new PromoterRiskReleaseDao();
