import { FindOptions, CreateOptions, Op } from 'sequelize';
import PromoterChangeLog, { PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes } from '../models/PromoterChangeLog.model';

class PromoterChangeLogDao {
  public async create(data: PromoterChangeLogCreationAttributes, options?: CreateOptions): Promise<PromoterChangeLog> {
    return PromoterChangeLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterChangeLog | null> {
    return PromoterChangeLog.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterChangeLog | null> {
    return PromoterChangeLog.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterChangeLog[]> {
    return PromoterChangeLog.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterChangeLog[]; count: number }> {
    return PromoterChangeLog.findAndCountAll(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterChangeLog[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    operatorId?: string;
    fieldName?: string;
    changeType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterChangeLog[]; count: number }> {
    const { page, pageSize, promoterId, operatorId, fieldName, changeType, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (fieldName) {
      where.fieldName = fieldName;
    }
    if (changeType) {
      where.changeType = changeType;
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

  public async update(id: string, data: Partial<PromoterChangeLogAttributes>): Promise<[number, PromoterChangeLog[]]> {
    return PromoterChangeLog.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterChangeLog.destroy({
      where: { id },
    });
  }
}

export default new PromoterChangeLogDao();
