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
}

export default new MarketingDao();
