import {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  Op,
} from 'sequelize';
import ProductScheduleRule, {
  ProductScheduleRuleAttributes,
  ProductScheduleRuleCreationAttributes,
} from '../models/ProductScheduleRule.model';
import { ProductScheduleRuleStatus } from '../constants/enum';

interface ProductScheduleRuleQueryParams {
  page: number;
  pageSize: number;
  productId?: string;
  action?: string;
  status?: ProductScheduleRuleStatus;
  creatorId?: string;
  startTime?: string;
  endTime?: string;
}

class ProductScheduleRuleDao {
  public async create(
    data: ProductScheduleRuleCreationAttributes,
    options?: CreateOptions
  ): Promise<ProductScheduleRule> {
    return ProductScheduleRule.create(data, options);
  }

  public async findByPk(
    id: string,
    options?: FindOptions
  ): Promise<ProductScheduleRule | null> {
    return ProductScheduleRule.findByPk(id, options);
  }

  public async findOne(
    options: FindOptions
  ): Promise<ProductScheduleRule | null> {
    return ProductScheduleRule.findOne(options);
  }

  public async findAll(
    options?: FindOptions
  ): Promise<ProductScheduleRule[]> {
    return ProductScheduleRule.findAll(options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: ProductScheduleRule[]; count: number }> {
    return ProductScheduleRule.findAndCountAll(options);
  }

  public async update(
    data: Partial<ProductScheduleRuleAttributes>,
    options: UpdateOptions
  ): Promise<[number, ProductScheduleRule[]]> {
    return ProductScheduleRule.update(data, options) as unknown as Promise<
      [number, ProductScheduleRule[]]
    >;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductScheduleRule.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductScheduleRule.count(options);
  }

  public async findById(id: string): Promise<ProductScheduleRule | null> {
    return this.findByPk(id);
  }

  public async findActiveByProductId(
    productId: string
  ): Promise<ProductScheduleRule[]> {
    return this.findAll({
      where: {
        productId,
        status: {
          [Op.in]: [ProductScheduleRuleStatus.PENDING, ProductScheduleRuleStatus.ACTIVE],
        },
      },
      order: [['startTime', 'ASC']],
    });
  }

  public async findPendingToExecute(): Promise<ProductScheduleRule[]> {
    return this.findAll({
      where: {
        status: {
          [Op.in]: [ProductScheduleRuleStatus.PENDING, ProductScheduleRuleStatus.ACTIVE],
        },
        nextExecuteTime: {
          [Op.lte]: new Date(),
        },
      },
      order: [['nextExecuteTime', 'ASC']],
    });
  }

  public async findAllPaged(
    params: ProductScheduleRuleQueryParams
  ): Promise<{ rows: ProductScheduleRule[]; count: number }> {
    const { page, pageSize, productId, action, status, creatorId, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }
    if (action) {
      where.action = action;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (creatorId) {
      where.creatorId = creatorId;
    }
    if (startTime || endTime) {
      where.startTime = {};
      if (startTime) {
        where.startTime[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.startTime[Op.lte] = end;
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

export default new ProductScheduleRuleDao();
