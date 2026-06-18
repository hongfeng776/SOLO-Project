import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import ChannelAudit, { ChannelAuditAttributes, ChannelAuditCreationAttributes } from '../models/ChannelAudit.model';
import { ChannelAuditStage, ChannelAuditStatus } from '../constants/enum';

interface ChannelAuditQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  auditStageList?: ChannelAuditStage[];
  auditStatusList?: ChannelAuditStatus[];
  priority?: number;
  riskFlagged?: boolean;
  contactPhone?: string;
  creditCode?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  isKeyChannel?: boolean;
}

class ChannelAuditDao {
  public async create(data: ChannelAuditCreationAttributes, options?: CreateOptions): Promise<ChannelAudit> {
    return ChannelAudit.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelAudit | null> {
    return ChannelAudit.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<ChannelAudit | null> {
    return ChannelAudit.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<ChannelAudit[]> {
    return ChannelAudit.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: ChannelAudit[]; count: number }> {
    return ChannelAudit.findAndCountAll(options);
  }

  public async update(data: Partial<ChannelAuditAttributes>, options: UpdateOptions): Promise<[number, ChannelAudit[]]> {
    return ChannelAudit.update(data, options) as unknown as Promise<[number, ChannelAudit[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ChannelAudit.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ChannelAudit.count(options);
  }

  public async findById(id: string): Promise<ChannelAudit | null> {
    return this.findByPk(id);
  }

  public async findByIdWithAuditLogs(id: string): Promise<ChannelAudit | null> {
    return this.findByPk(id, {
      include: [
        { association: 'auditLogs', separate: true, order: [['createdAt', 'DESC']] },
        { association: 'qualifications', separate: true, order: [['createdAt', 'DESC']] },
        { association: 'dataAuditor', attributes: ['id', 'username', 'nickname'] },
        { association: 'qualificationAuditor', attributes: ['id', 'username', 'nickname'] },
        { association: 'permissionAuditor', attributes: ['id', 'username', 'nickname'] },
      ],
    });
  }

  public async findAllPaged(params: ChannelAuditQueryParams): Promise<{ rows: ChannelAudit[]; count: number }> {
    const { page, pageSize, keyword, auditStageList, auditStatusList, priority, riskFlagged, contactPhone, creditCode, companyName, startDate, endDate, isKeyChannel } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { contactName: { [Op.like]: `%${keyword}%` } },
        { contactPhone: { [Op.like]: `%${keyword}%` } },
        { companyName: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (auditStageList && auditStageList.length > 0) {
      where.auditStage = { [Op.in]: auditStageList };
    }
    if (auditStatusList && auditStatusList.length > 0) {
      where.auditStatus = { [Op.in]: auditStatusList };
    }
    if (priority !== undefined) {
      where.priority = priority;
    }
    if (riskFlagged !== undefined) {
      where.riskFlagged = riskFlagged;
    }
    if (contactPhone) {
      where.contactPhone = { [Op.like]: `%${contactPhone}%` };
    }
    if (creditCode) {
      where.creditCode = { [Op.like]: `%${creditCode}%` };
    }
    if (companyName) {
      where.companyName = { [Op.like]: `%${companyName}%` };
    }
    if (startDate) {
      where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(endDate + ' 23:59:59') };
    }
    if (isKeyChannel !== undefined) {
      where.isKeyChannel = isKeyChannel;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  public async existsByContactPhone(contactPhone: string, excludeId?: string): Promise<boolean> {
    const where: any = { contactPhone };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async existsByCreditCode(creditCode: string, excludeId?: string): Promise<boolean> {
    const where: any = { creditCode };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async existsByCompanyName(companyName: string, excludeId?: string): Promise<boolean> {
    const where: any = { companyName };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async checkLockStatus(contactPhone?: string, creditCode?: string): Promise<{ locked: boolean; lockUntil?: Date }> {
    const where: any = {
      lockUntil: { [Op.gt]: new Date() },
    };
    const orConditions: any[] = [];
    if (contactPhone) orConditions.push({ contactPhone });
    if (creditCode) orConditions.push({ creditCode });
    if (orConditions.length > 0) {
      where[Op.or] = orConditions;
    }
    const record = await this.findOne({ where, order: [['lockUntil', 'DESC']] });
    if (record && (record as any).lockUntil) {
      return { locked: true, lockUntil: (record as any).lockUntil };
    }
    return { locked: false };
  }

  public async getTodayCount(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.count({
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
    });
  }
}

export default new ChannelAuditDao();
