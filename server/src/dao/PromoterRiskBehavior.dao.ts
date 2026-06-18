import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import PromoterRiskBehavior, { PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes } from '../models/PromoterRiskBehavior.model';

class PromoterRiskBehaviorDao {
  public async create(data: PromoterRiskBehaviorCreationAttributes, options?: CreateOptions): Promise<PromoterRiskBehavior> {
    return PromoterRiskBehavior.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterRiskBehavior | null> {
    return PromoterRiskBehavior.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterRiskBehavior | null> {
    return PromoterRiskBehavior.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterRiskBehavior[]> {
    return PromoterRiskBehavior.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterRiskBehavior[]; count: number }> {
    return PromoterRiskBehavior.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return PromoterRiskBehavior.count(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterRiskBehavior[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    behaviorType?: string;
    riskFlagged?: boolean;
    riskType?: string;
    orderId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterRiskBehavior[]; count: number }> {
    const { page, pageSize, promoterId, behaviorType, riskFlagged, riskType, orderId, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (behaviorType) {
      where.behaviorType = behaviorType;
    }
    if (riskFlagged !== undefined) {
      where.riskFlagged = riskFlagged;
    }
    if (riskType) {
      where.riskType = riskType;
    }
    if (orderId) {
      where.orderId = orderId;
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

  public async update(id: string, data: Partial<PromoterRiskBehaviorAttributes>): Promise<[number, PromoterRiskBehavior[]]> {
    return PromoterRiskBehavior.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterRiskBehavior.destroy({
      where: { id },
    });
  }
}

export default new PromoterRiskBehaviorDao();
