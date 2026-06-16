import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Promoter, { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { Channel } from '../models';

interface PromoterQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  channelId?: string;
  level?: string;
  status?: number;
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
    const { page, pageSize, keyword, channelId, level, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
      ];
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
}

export default new PromoterDao();
