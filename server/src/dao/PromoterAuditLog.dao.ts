import { FindOptions, CreateOptions, Op } from 'sequelize';
import PromoterAuditLog, { PromoterAuditLogAttributes, PromoterAuditLogCreationAttributes } from '../models/PromoterAuditLog.model';
import { AuditAction } from '../constants/enum';

class PromoterAuditLogDao {
  public async create(data: PromoterAuditLogCreationAttributes, options?: CreateOptions): Promise<PromoterAuditLog> {
    return PromoterAuditLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterAuditLog | null> {
    return PromoterAuditLog.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterAuditLog | null> {
    return PromoterAuditLog.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterAuditLog[]> {
    return PromoterAuditLog.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterAuditLog[]; count: number }> {
    return PromoterAuditLog.findAndCountAll(options);
  }

  public async findByPromoterId(promoterId: string): Promise<PromoterAuditLog[]> {
    return this.findAll({
      where: { promoterId },
      order: [['createdAt', 'ASC']],
    });
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    operatorId?: string;
    action?: AuditAction;
    phone?: string;
    idCard?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterAuditLog[]; count: number }> {
    const { page, pageSize, promoterId, operatorId, action, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (action) {
      where.action = action;
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

  public async checkDuplicateApply(phone?: string, idCard?: string): Promise<boolean> {
    if (!phone && !idCard) return false;

    const promoterWhere: any = {};
    const orConditions: any[] = [];
    if (phone) orConditions.push({ phone });
    if (idCard) orConditions.push({ idCard });
    if (orConditions.length > 0) {
      promoterWhere[Op.or] = orConditions;
    }

    const recentLogs = await this.findAll({
      where: {
        action: AuditAction.SUBMIT,
      },
      include: [
        {
          association: 'promoter',
          where: promoterWhere,
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return recentLogs.length > 0;
  }
}

export default new PromoterAuditLogDao();
