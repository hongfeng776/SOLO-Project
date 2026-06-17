import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, fn, col, where } from 'sequelize';
import Promoter, { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { Channel, User, PromoterAuditLog } from '../models';
import { AuditStage, AuditStatus, PromoterStatus } from '../constants/enum';

interface PromoterQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  channelId?: string;
  level?: string;
  status?: number;
  auditStage?: AuditStage;
  auditStatus?: AuditStatus;
  phone?: string;
  idCard?: string;
  riskFlagged?: boolean;
  startDate?: string;
  endDate?: string;
}

interface AuditListQueryParams extends PromoterQueryParams {
  auditStageList?: AuditStage[];
  auditStatusList?: AuditStatus[];
}

class PromoterDao {
  public async create(data: PromoterCreationAttributes, options?: CreateOptions): Promise<Promoter> {
    return Promoter.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Promoter | null> {
    return Promoter.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Promoter | null> {
    return Promoter.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Promoter[]> {
    return Promoter.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Promoter[]; count: number }> {
    return Promoter.findAndCountAll(options);
  }

  public async update(data: Partial<PromoterAttributes>, options: UpdateOptions): Promise<[number, Promoter[]]> {
    return Promoter.update(data, options) as unknown as Promise<[number, Promoter[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Promoter.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Promoter.count(options);
  }

  public async findById(id: string): Promise<Promoter | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: PromoterQueryParams): Promise<{ rows: Promoter[]; count: number }> {
    const { page, pageSize, keyword, channelId, level, status, auditStage, auditStatus, phone, idCard, riskFlagged, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { idCard: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (phone) {
      where.phone = { [Op.like]: `%${phone}%` };
    }
    if (idCard) {
      where.idCard = { [Op.like]: `%${idCard}%` };
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (level) {
      where.level = level;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (auditStage !== undefined) {
      where.auditStage = auditStage;
    }
    if (auditStatus) {
      where.auditStatus = auditStatus;
    }
    if (riskFlagged !== undefined) {
      where.riskFlagged = riskFlagged;
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
      include: [
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'firstAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
        {
          model: User,
          as: 'secondAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
      ],
    });
  }

  public async findAuditListPaged(params: AuditListQueryParams): Promise<{ rows: Promoter[]; count: number }> {
    const { page, pageSize, keyword, channelId, level, auditStage, auditStageList, auditStatus, auditStatusList, phone, idCard, riskFlagged, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { idCard: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (phone) {
      where.phone = phone;
    }
    if (idCard) {
      where.idCard = idCard;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (level) {
      where.level = level;
    }
    if (auditStage !== undefined) {
      where.auditStage = auditStage;
    }
    if (auditStageList && auditStageList.length > 0) {
      where.auditStage = { [Op.in]: auditStageList };
    }
    if (auditStatus) {
      where.auditStatus = auditStatus;
    }
    if (auditStatusList && auditStatusList.length > 0) {
      where.auditStatus = { [Op.in]: auditStatusList };
    }
    if (riskFlagged !== undefined) {
      where.riskFlagged = riskFlagged;
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
      order: [
        ['riskFlagged', 'DESC'],
        ['createdAt', 'ASC'],
      ],
      include: [
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'firstAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
        {
          model: User,
          as: 'secondAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
      ],
    });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async existsByCode(code: string): Promise<boolean> {
    const count = await this.count({ where: { code } });
    return count > 0;
  }

  public async existsByCodeAndId(code: string, excludeId: string): Promise<boolean> {
    const count = await this.count({ where: { code, id: { [Op.ne]: excludeId } } });
    return count > 0;
  }

  public async findByChannelId(channelId: string): Promise<Promoter[]> {
    return this.findAll({ where: { channelId } });
  }

  public async updateCommission(promoterId: string, totalDelta: number, availableDelta: number): Promise<[number, Promoter[]]> {
    const promoter = await this.findById(promoterId);
    if (!promoter) return [0, []];
    const totalCommission = Number(promoter.totalCommission || 0) + totalDelta;
    const availableCommission = Number(promoter.availableCommission || 0) + availableDelta;
    return this.update(
      { totalCommission, availableCommission } as any,
      { where: { id: promoterId } }
    );
  }

  public async getTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });
  }

  public async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    const where: any = { phone };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async existsByIdCard(idCard: string, excludeId?: string): Promise<boolean> {
    const where: any = { idCard };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async findByPhone(phone: string): Promise<Promoter | null> {
    return this.findOne({ where: { phone } });
  }

  public async findByIdCard(idCard: string): Promise<Promoter | null> {
    return this.findOne({ where: { idCard } });
  }

  public async findByIdWithAuditLogs(id: string): Promise<Promoter | null> {
    return this.findByPk(id, {
      include: [
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'firstAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
        {
          model: User,
          as: 'secondAuditor',
          attributes: ['id', 'name', 'username'],
          required: false,
        },
        {
          model: PromoterAuditLog,
          as: 'auditLogs',
          required: false,
          order: [['createdAt', 'ASC']],
        },
      ],
    });
  }

  public async checkLockStatus(phone?: string, idCard?: string): Promise<{ locked: boolean; lockUntil?: Date; promoterId?: string }> {
    const where: any = {};
    const orConditions: any[] = [];
    if (phone) orConditions.push({ phone });
    if (idCard) orConditions.push({ idCard });
    if (orConditions.length > 0) {
      where[Op.or] = orConditions;
    }

    const promoter = await this.findOne({
      where: {
        ...where,
        lockUntil: { [Op.gt]: new Date() },
      },
      attributes: ['id', 'lockUntil'],
    });

    if (promoter && promoter.lockUntil) {
      return {
        locked: true,
        lockUntil: promoter.lockUntil,
        promoterId: promoter.id,
      };
    }

    return { locked: false };
  }
}

export default new PromoterDao();
