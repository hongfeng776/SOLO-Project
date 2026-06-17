import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, Op } from 'sequelize';
import PromoterBlacklist, { PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes } from '../models/PromoterBlacklist.model';
import { BlacklistType } from '../constants/enum';

interface BlacklistMatchResult {
  matched: boolean;
  items: PromoterBlacklist[];
}

class PromoterBlacklistDao {
  public async create(data: PromoterBlacklistCreationAttributes, options?: CreateOptions): Promise<PromoterBlacklist> {
    return PromoterBlacklist.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterBlacklist | null> {
    return PromoterBlacklist.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<PromoterBlacklist | null> {
    return PromoterBlacklist.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<PromoterBlacklist[]> {
    return PromoterBlacklist.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: PromoterBlacklist[]; count: number }> {
    return PromoterBlacklist.findAndCountAll(options);
  }

  public async update(data: Partial<PromoterBlacklistAttributes>, options: UpdateOptions): Promise<[number, PromoterBlacklist[]]> {
    return PromoterBlacklist.update(data, options) as unknown as Promise<[number, PromoterBlacklist[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return PromoterBlacklist.destroy(options);
  }

  public async findById(id: string): Promise<PromoterBlacklist | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    type?: BlacklistType;
    keyword?: string;
    isActive?: boolean;
  }): Promise<{ rows: PromoterBlacklist[]; count: number }> {
    const { page, pageSize, type, keyword, isActive } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (type) {
      where.type = type;
    }
    if (keyword) {
      where.value = { [Op.like]: `%${keyword}%` };
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    where[Op.or] = [
      { expiredAt: { [Op.is]: null } },
      { expiredAt: { [Op.gt]: new Date() } },
    ];

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async checkMatch(params: {
    phone?: string;
    idCard?: string;
    name?: string;
    wechatId?: string;
  }): Promise<BlacklistMatchResult> {
    const conditions: any[] = [];
    const now = new Date();

    if (params.phone) {
      conditions.push({
        type: BlacklistType.PHONE,
        value: params.phone,
      });
    }
    if (params.idCard) {
      conditions.push({
        type: BlacklistType.ID_CARD,
        value: params.idCard,
      });
    }
    if (params.name) {
      conditions.push({
        type: BlacklistType.NAME,
        value: params.name,
      });
    }
    if (params.wechatId) {
      conditions.push({
        type: BlacklistType.WECHAT,
        value: params.wechatId,
      });
    }

    if (conditions.length === 0) {
      return { matched: false, items: [] };
    }

    const items = await this.findAll({
      where: {
        [Op.and]: [
          { [Op.or]: conditions },
          { isActive: true },
          {
            [Op.or]: [
              { expiredAt: { [Op.is]: null } },
              { expiredAt: { [Op.gt]: now } },
            ],
          },
        ],
      },
    });

    return {
      matched: items.length > 0,
      items,
    };
  }

  public async existsByTypeAndValue(type: BlacklistType, value: string, excludeId?: string): Promise<boolean> {
    const where: any = { type, value };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await PromoterBlacklist.count({ where });
    return count > 0;
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async setInactive(id: string): Promise<[number, PromoterBlacklist[]]> {
    return this.update({ isActive: false } as any, { where: { id } });
  }
}

export default new PromoterBlacklistDao();
