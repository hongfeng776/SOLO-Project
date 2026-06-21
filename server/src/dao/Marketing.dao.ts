import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Marketing, { MarketingAttributes, MarketingCreationAttributes } from '../models/Marketing.model';

interface MarketingQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  type?: string;
  status?: number;
}

class MarketingDao {
  public async create(data: MarketingCreationAttributes, options?: CreateOptions): Promise<Marketing> {
    return Marketing.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Marketing | null> {
    return Marketing.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Marketing | null> {
    return Marketing.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Marketing[]> {
    return Marketing.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Marketing[]; count: number }> {
    return Marketing.findAndCountAll(options);
  }

  public async update(data: Partial<MarketingAttributes>, options: UpdateOptions): Promise<[number, Marketing[]]> {
    return Marketing.update(data, options) as unknown as Promise<[number, Marketing[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Marketing.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Marketing.count(options);
  }

  public async findById(id: string): Promise<Marketing | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: MarketingQueryParams): Promise<{ rows: Marketing[]; count: number }> {
    const { page, pageSize, keyword, type, status } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (type) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
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

  public async checkTimeOverlap(
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    type?: string
  ): Promise<{ hasOverlap: boolean; overlappingActivities: any[] }> {
    const where: any = {
      [Op.and]: [
        { startTime: { [Op.lt]: endTime } },
        { endTime: { [Op.gt]: startTime } },
        { status: { [Op.ne]: 3 } },
      ],
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    if (type) {
      where.type = type;
    }

    const overlappingActivities = await this.findAll({ where } as any);
    return {
      hasOverlap: overlappingActivities.length > 0,
      overlappingActivities: overlappingActivities.map(a => ({
        id: a.id,
        name: a.name,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      })),
    };
  }

  public async existsBySubmitToken(token: string): Promise<boolean> {
    const count = await this.count({ where: { submitToken: token } });
    return count > 0;
  }

  public async findByTemplateId(templateId: string): Promise<any[]> {
    return this.findAll({ where: { templateId } } as any);
  }

  public async updateSort(id: string, sort: number): Promise<void> {
    await this.update({ sort } as any, { where: { id } });
  }

  public async updateSorts(updates: { id: string; sort: number }[]): Promise<void> {
    for (const update of updates) {
      await this.updateSort(update.id, update.sort);
    }
  }

  public async incrementPreviewCount(id: string): Promise<void> {
    await Marketing.increment('previewCount', { by: 1, where: { id } });
    await this.update({ lastPreviewAt: new Date() } as any, { where: { id } });
  }
}

export default new MarketingDao();
