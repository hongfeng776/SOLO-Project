import { FindOptions, CreateOptions, Op } from 'sequelize';
import PromoterQualification, { PromoterQualificationAttributes, PromoterQualificationCreationAttributes } from '../models/PromoterQualification.model';
import { QualificationType, VerifyStatus } from '../constants/enum';

class PromoterQualificationDao {
  public async create(data: PromoterQualificationCreationAttributes, options?: CreateOptions): Promise<PromoterQualification> {
    return PromoterQualification.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterQualification | null> {
    return PromoterQualification.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterQualification | null> {
    return PromoterQualification.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterQualification[]> {
    return PromoterQualification.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterQualification[]; count: number }> {
    return PromoterQualification.findAndCountAll(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterQualification[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    type?: QualificationType;
    verifyStatus?: VerifyStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterQualification[]; count: number }> {
    const { page, pageSize, promoterId, type, verifyStatus, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (type) {
      where.type = type;
    }
    if (verifyStatus !== undefined) {
      where.verifyStatus = verifyStatus;
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

  public async update(id: string, data: Partial<PromoterQualificationAttributes>): Promise<[number, PromoterQualification[]]> {
    return PromoterQualification.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterQualification.destroy({
      where: { id },
    });
  }
}

export default new PromoterQualificationDao();
