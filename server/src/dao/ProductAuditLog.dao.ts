import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import ProductAuditLog, { ProductAuditLogAttributes, ProductAuditLogCreationAttributes } from '../models/ProductAuditLog.model';

interface ProductAuditLogQueryParams {
  page: number;
  pageSize: number;
  productId?: string;
  operatorId?: string;
  action?: string;
  toStage?: number;
  toStatus?: number;
  startTime?: string;
  endTime?: string;
}

class ProductAuditLogDao {
  public async create(data: ProductAuditLogCreationAttributes, options?: CreateOptions): Promise<ProductAuditLog> {
    return ProductAuditLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ProductAuditLog | null> {
    return ProductAuditLog.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<ProductAuditLog | null> {
    return ProductAuditLog.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<ProductAuditLog[]> {
    return ProductAuditLog.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: ProductAuditLog[]; count: number }> {
    return ProductAuditLog.findAndCountAll(options);
  }

  public async update(data: Partial<ProductAuditLogAttributes>, options: UpdateOptions): Promise<[number, ProductAuditLog[]]> {
    return ProductAuditLog.update(data, options) as unknown as Promise<[number, ProductAuditLog[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductAuditLog.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductAuditLog.count(options);
  }

  public async findById(id: string): Promise<ProductAuditLog | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: ProductAuditLogQueryParams): Promise<{ rows: ProductAuditLog[]; count: number }> {
    const { page, pageSize, productId, operatorId, action, toStage, toStatus, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (action) {
      where.action = action;
    }
    if (toStage !== undefined) {
      where.toStage = toStage;
    }
    if (toStatus !== undefined) {
      where.toStatus = toStatus;
    }
    if (startTime && endTime) {
      where.createdAt = {
        [Op.between]: [new Date(startTime), new Date(endTime)],
      };
    } else if (startTime) {
      where.createdAt = {
        [Op.gte]: new Date(startTime),
      };
    } else if (endTime) {
      where.createdAt = {
        [Op.lte]: new Date(endTime),
      };
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByProductId(productId: string): Promise<ProductAuditLog[]> {
    return this.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async bulkCreate(data: ProductAuditLogCreationAttributes[]): Promise<ProductAuditLog[]> {
    return ProductAuditLog.bulkCreate(data);
  }
}

export default new ProductAuditLogDao();
