import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import PromoterRiskWarning, { PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes } from '../models/PromoterRiskWarning.model';

class PromoterRiskWarningDao {
  public async create(data: PromoterRiskWarningCreationAttributes, options?: CreateOptions): Promise<PromoterRiskWarning> {
    return PromoterRiskWarning.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterRiskWarning | null> {
    return PromoterRiskWarning.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterRiskWarning | null> {
    return PromoterRiskWarning.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterRiskWarning[]> {
    return PromoterRiskWarning.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterRiskWarning[]; count: number }> {
    return PromoterRiskWarning.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return PromoterRiskWarning.count(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterRiskWarning[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    warningLevel?: string;
    warningType?: string;
    isHandled?: boolean;
    ruleCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterRiskWarning[]; count: number }> {
    const { page, pageSize, promoterId, warningLevel, warningType, isHandled, ruleCode, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (warningLevel) {
      where.warningLevel = warningLevel;
    }
    if (warningType) {
      where.warningType = warningType;
    }
    if (isHandled !== undefined) {
      where.isHandled = isHandled;
    }
    if (ruleCode) {
      where.ruleCode = ruleCode;
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

  public async update(id: string, data: Partial<PromoterRiskWarningAttributes>): Promise<[number, PromoterRiskWarning[]]> {
    return PromoterRiskWarning.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterRiskWarning.destroy({
      where: { id },
    });
  }
}

export default new PromoterRiskWarningDao();
