import { Model, FindOptions, CreateOptions, UpdateOptions, DestroyOptions, WhereOptions, Order } from 'sequelize';
import { PaginatedResult, PaginationParams, SortParams } from '../types';

export abstract class BaseRepository<T extends Model> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string, options?: Omit<FindOptions, 'where'>): Promise<T | null> {
    return await this.model.findByPk(id, options);
  }

  async findOne(where: WhereOptions, options?: Omit<FindOptions, 'where'>): Promise<T | null> {
    return await this.model.findOne({ where, ...options });
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    return await this.model.findAll(options);
  }

  async findByWhere(where: WhereOptions, options?: Omit<FindOptions, 'where'>): Promise<T[]> {
    return await this.model.findAll({ where, ...options });
  }

  async findPaginated(
    pagination: PaginationParams,
    where?: WhereOptions,
    sort?: SortParams,
    options?: Omit<FindOptions, 'where' | 'limit' | 'offset' | 'order'>
  ): Promise<PaginatedResult<T>> {
    const { page, pageSize } = pagination;
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    let order: Order | undefined;
    if (sort?.sortBy) {
      order = [[sort.sortBy, sort.sortOrder || 'ASC']];
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      ...options
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize
    };
  }

  async count(where?: WhereOptions): Promise<number> {
    return await this.model.count({ where });
  }

  async exists(where: WhereOptions): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  async create(data: any, options?: CreateOptions): Promise<T> {
    return await this.model.create(data, options);
  }

  async bulkCreate(data: any[], options?: CreateOptions): Promise<T[]> {
    return await this.model.bulkCreate(data, options);
  }

  async update(id: string, data: any, options?: Omit<UpdateOptions, 'where'>): Promise<[number, T[]]> {
    const result: any = await this.model.update(data, {
      where: { id },
      individualHooks: true,
      ...options
    });
    return result as [number, T[]];
  }

  async updateByWhere(where: WhereOptions, data: any, options?: Omit<UpdateOptions, 'where'>): Promise<[number, T[]]> {
    const result: any = await this.model.update(data, {
      where,
      individualHooks: true,
      ...options
    });
    return result as [number, T[]];
  }

  async delete(id: string, options?: Omit<DestroyOptions, 'where'>): Promise<number> {
    return await this.model.destroy({
      where: { id },
      ...options
    });
  }

  async deleteByWhere(where: WhereOptions, options?: Omit<DestroyOptions, 'where'>): Promise<number> {
    return await this.model.destroy({
      where,
      ...options
    });
  }

  async restore(id: string): Promise<void> {
    await this.model.restore({ where: { id } });
  }
}