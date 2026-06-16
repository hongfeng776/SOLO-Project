import { Model, ModelCtor } from 'sequelize-typescript';
import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, WhereOptions, Order, FindAttributeOptions } from 'sequelize';

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageOptions {
  page?: number;
  pageSize?: number;
  where?: WhereOptions;
  order?: Order;
  attributes?: FindAttributeOptions;
  include?: FindOptions['include'];
}

export class BaseDao<T extends Model<T>> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  async findById(id: number, options?: Omit<FindOptions<T>, 'where'>): Promise<T | null> {
    return this.model.findByPk(id, options);
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    return this.model.findAll(options);
  }

  async findPage(options: PageOptions): Promise<PageResult<T>> {
    const { page = 1, pageSize = 10, where, order, attributes, include } = options;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await this.model.findAndCountAll({
      where,
      order,
      attributes,
      include,
      limit: pageSize,
      offset,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async create(data: Partial<T['_attributes']>, options?: CreateOptions<T>): Promise<T> {
    return this.model.create(data as any, options);
  }

  async update(id: number, data: Partial<T['_attributes']>, options?: Omit<UpdateOptions<T>, 'where'>): Promise<number> {
    const [affectedCount] = await this.model.update(data, {
      where: { id } as WhereOptions<T>,
      ...options,
    });
    return affectedCount;
  }

  async delete(id: number, options?: Omit<DestroyOptions<T>, 'where'>): Promise<number> {
    return this.model.destroy({
      where: { id } as WhereOptions<T>,
      ...options,
    });
  }

  async batchDelete(ids: number[], options?: Omit<DestroyOptions<T>, 'where'>): Promise<number> {
    return this.model.destroy({
      where: { id: ids } as WhereOptions<T>,
      ...options,
    });
  }
}

export default BaseDao;
