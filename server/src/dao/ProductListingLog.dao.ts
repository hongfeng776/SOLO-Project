import {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  Op,
} from 'sequelize';
import ProductListingLog, {
  ProductListingLogAttributes,
  ProductListingLogCreationAttributes,
} from '../models/ProductListingLog.model';
import { ProductListingAction, ProductListingTrigger } from '../constants/enum';

interface ProductListingLogQueryParams {
  page: number;
  pageSize: number;
  productId?: string;
  action?: ProductListingAction;
  trigger?: ProductListingTrigger;
  operatorId?: string;
  batchId?: string;
  startTime?: string;
  endTime?: string;
}

class ProductListingLogDao {
  public async create(
    data: ProductListingLogCreationAttributes,
    options?: CreateOptions
  ): Promise<ProductListingLog> {
    return ProductListingLog.create(data, options);
  }

  public async findByPk(
    id: string,
    options?: FindOptions
  ): Promise<ProductListingLog | null> {
    return ProductListingLog.findByPk(id, options);
  }

  public async findOne(
    options: FindOptions
  ): Promise<ProductListingLog | null> {
    return ProductListingLog.findOne(options);
  }

  public async findAll(
    options?: FindOptions
  ): Promise<ProductListingLog[]> {
    return ProductListingLog.findAll(options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: ProductListingLog[]; count: number }> {
    return ProductListingLog.findAndCountAll(options);
  }

  public async update(
    data: Partial<ProductListingLogAttributes>,
    options: UpdateOptions
  ): Promise<[number, ProductListingLog[]]> {
    return ProductListingLog.update(data, options) as unknown as Promise<
      [number, ProductListingLog[]]
    >;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductListingLog.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductListingLog.count(options);
  }

  public async findById(id: string): Promise<ProductListingLog | null> {
    return this.findByPk(id);
  }

  public async countByProductIdInDays(
    productId: string,
    days: number
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.count({
      where: {
        productId,
        createdAt: {
          [Op.gte]: since,
        },
      },
    });
  }

  public async findAllPaged(
    params: ProductListingLogQueryParams
  ): Promise<{ rows: ProductListingLog[]; count: number }> {
    const { page, pageSize, productId, action, trigger, operatorId, batchId, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }
    if (action) {
      where.action = action;
    }
    if (trigger) {
      where.trigger = trigger;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (batchId) {
      where.batchId = batchId;
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new ProductListingLogDao();
