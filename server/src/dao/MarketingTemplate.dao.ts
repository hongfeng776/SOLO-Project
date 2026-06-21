import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import MarketingTemplate, { MarketingTemplateAttributes, MarketingTemplateCreationAttributes } from '../models/MarketingTemplate.model';
import { ActivityTemplateCategory, MarketingType } from '../constants/enum';

interface TemplateQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: ActivityTemplateCategory;
  marketingType?: MarketingType;
  isHot?: boolean;
  isRecommended?: boolean;
}

class MarketingTemplateDao {
  public async create(data: MarketingTemplateCreationAttributes, options?: CreateOptions): Promise<MarketingTemplate> {
    return MarketingTemplate.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<MarketingTemplate | null> {
    return MarketingTemplate.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<MarketingTemplate | null> {
    return MarketingTemplate.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<MarketingTemplate[]> {
    return MarketingTemplate.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: MarketingTemplate[]; count: number }> {
    return MarketingTemplate.findAndCountAll(options);
  }

  public async update(data: Partial<MarketingTemplateAttributes>, options: UpdateOptions): Promise<[number, MarketingTemplate[]]> {
    return MarketingTemplate.update(data, options) as unknown as Promise<[number, MarketingTemplate[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return MarketingTemplate.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return MarketingTemplate.count(options);
  }

  public async findById(id: string): Promise<MarketingTemplate | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: TemplateQueryParams): Promise<{ rows: MarketingTemplate[]; count: number }> {
    const { page, pageSize, keyword, category, marketingType, isHot, isRecommended } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (marketingType) {
      where.marketingType = marketingType;
    }
    if (isHot !== undefined) {
      where.isHot = isHot;
    }
    if (isRecommended !== undefined) {
      where.isRecommended = isRecommended;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['useCount', 'DESC'], ['createdAt', 'DESC']],
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

  public async incrementUseCount(id: string): Promise<void> {
    await MarketingTemplate.increment('useCount', { by: 1, where: { id } });
  }

  public async updateSort(id: string, sort: number): Promise<void> {
    await this.update({ sort } as any, { where: { id } });
  }
}

export default new MarketingTemplateDao();
