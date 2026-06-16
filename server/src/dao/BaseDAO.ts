import {
  Model,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  RestoreOptions,
  FindAndCountOptions,
  BulkCreateOptions,
  CountOptions,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

class BaseDAO<T extends Model<InferAttributes<T>, InferCreationAttributes<T>>> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: number, options?: Omit<FindOptions<InferAttributes<T>>, 'where'>): Promise<T | null> {
    return this.model.findByPk(id, options) as Promise<T | null>;
  }

  async findOne(options: FindOptions<InferAttributes<T>>): Promise<T | null> {
    return this.model.findOne(options) as Promise<T | null>;
  }

  async findAll(options?: FindOptions<InferAttributes<T>>): Promise<T[]> {
    return this.model.findAll(options || {}) as Promise<T[]>;
  }

  async findAndCountAll(
    options?: FindAndCountOptions<InferAttributes<T>>,
  ): Promise<{ rows: T[]; count: number }> {
    return this.model.findAndCountAll(options || {}) as Promise<{ rows: T[]; count: number }>;
  }

  async create(values: InferCreationAttributes<T>, options?: CreateOptions<InferAttributes<T>>): Promise<T> {
    return this.model.create(values, options) as Promise<T>;
  }

  async bulkCreate(
    records: InferCreationAttributes<T>[],
    options?: BulkCreateOptions<InferAttributes<T>>,
  ): Promise<T[]> {
    return this.model.bulkCreate(records, options) as Promise<T[]>;
  }

  async update(
    values: Partial<InferAttributes<T>>,
    options: UpdateOptions<InferAttributes<T>>,
  ): Promise<[number]> {
    return this.model.update(values, options) as Promise<[number]>;
  }

  async delete(options: DestroyOptions<InferAttributes<T>>): Promise<number> {
    return this.model.destroy({ ...options, force: true });
  }

  async destroy(options?: DestroyOptions<InferAttributes<T>>): Promise<number> {
    return this.model.destroy(options || {});
  }

  async restore(options: RestoreOptions<InferAttributes<T>>): Promise<void> {
    return this.model.restore(options);
  }

  async count(options?: CountOptions<InferAttributes<T>>): Promise<number> {
    return this.model.count(options);
  }
}

export default BaseDAO;
