import { Model, FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, QueryOptions } from 'sequelize';
import sequelize from '../config/database';

export interface IPaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPaginationParams {
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

export class BaseDao<T extends Model> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    return this.model.findAll(options);
  }

  async findOne(options?: FindOptions): Promise<T | null> {
    return this.model.findOne(options);
  }

  async findById(id: number, options?: FindOptions): Promise<T | null> {
    return this.model.findByPk(id, options);
  }

  async create(data: any, options?: CreateOptions): Promise<T> {
    return this.model.create(data, options);
  }

  async bulkCreate(data: any[], options?: CreateOptions): Promise<T[]> {
    return this.model.bulkCreate(data, options);
  }

  async update(data: any, options: UpdateOptions): Promise<[number, T[]]> {
    return this.model.update(data, { ...options, returning: true });
  }

  async updateById(id: number, data: any, options?: Omit<UpdateOptions, 'where'>): Promise<[number, T[]]> {
    return this.model.update(data, { where: { id }, ...options, returning: true });
  }

  async destroy(options: DestroyOptions): Promise<number> {
    return this.model.destroy(options);
  }

  async destroyById(id: number, options?: Omit<DestroyOptions, 'where'>): Promise<number> {
    return this.model.destroy({ where: { id }, ...options });
  }

  async execute(sql: string, options?: QueryOptions): Promise<any> {
    return sequelize.query(sql, options);
  }

  async count(options?: CountOptions): Promise<number> {
    return this.model.count(options);
  }

  async findAndCountAll(options: FindOptions): Promise<{ rows: T[]; count: number }> {
    return this.model.findAndCountAll(options);
  }

  async paginate(params: IPaginationParams, options: FindOptions = {}): Promise<IPaginationResult<T>> {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await this.model.findAndCountAll({
      ...options,
      offset,
      limit: pageSize,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
    };
  }
}
