import { FindOptions, CreateOptions, Op } from 'sequelize';
import PromoterLevelAdjustRequest, { PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes } from '../models/PromoterLevelAdjustRequest.model';
import { ManualLevelAdjustStatus, PromoterLevel } from '../constants/enum';

class PromoterLevelAdjustRequestDao {
  public async create(data: PromoterLevelAdjustRequestCreationAttributes, options?: CreateOptions): Promise<PromoterLevelAdjustRequest> {
    return PromoterLevelAdjustRequest.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest | null> {
    return PromoterLevelAdjustRequest.findByPk(id, options);
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    applicantId?: string;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    approveStatus?: ManualLevelAdjustStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterLevelAdjustRequest[]; count: number }> {
    const { page, pageSize, promoterId, applicantId, fromLevel, toLevel, approveStatus, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (applicantId) {
      where.applicantId = applicantId;
    }
    if (fromLevel) {
      where.fromLevel = fromLevel;
    }
    if (toLevel) {
      where.toLevel = toLevel;
    }
    if (approveStatus !== undefined) {
      where.approveStatus = approveStatus;
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

    return PromoterLevelAdjustRequest.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByPromoterId(promoterId: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest[]> {
    return PromoterLevelAdjustRequest.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        promoterId,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findPendingByApproverId(_approverId: string, options?: FindOptions): Promise<PromoterLevelAdjustRequest[]> {
    return PromoterLevelAdjustRequest.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        approveStatus: ManualLevelAdjustStatus.PENDING,
      },
      order: [['createdAt', 'ASC']],
    });
  }

  public async update(id: string, data: Partial<PromoterLevelAdjustRequestAttributes>): Promise<[number, PromoterLevelAdjustRequest[]]> {
    return PromoterLevelAdjustRequest.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterLevelAdjustRequest.destroy({
      where: { id },
    });
  }
}

export default new PromoterLevelAdjustRequestDao();
