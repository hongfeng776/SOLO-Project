import {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  Op,
} from 'sequelize';
import ProductEditApproval, {
  ProductEditApprovalAttributes,
  ProductEditApprovalCreationAttributes,
} from '../models/ProductEditApproval.model';
import { ProductEditApprovalStatus } from '../constants/enum';

interface ProductEditApprovalQueryParams {
  page: number;
  pageSize: number;
  productId?: string;
  applicantId?: string;
  approverId?: string;
  status?: ProductEditApprovalStatus;
  startTime?: string;
  endTime?: string;
}

class ProductEditApprovalDao {
  public async create(
    data: ProductEditApprovalCreationAttributes,
    options?: CreateOptions
  ): Promise<ProductEditApproval> {
    return ProductEditApproval.create(data, options);
  }

  public async findByPk(
    id: string,
    options?: FindOptions
  ): Promise<ProductEditApproval | null> {
    return ProductEditApproval.findByPk(id, options);
  }

  public async findOne(
    options: FindOptions
  ): Promise<ProductEditApproval | null> {
    return ProductEditApproval.findOne(options);
  }

  public async findAll(
    options?: FindOptions
  ): Promise<ProductEditApproval[]> {
    return ProductEditApproval.findAll(options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: ProductEditApproval[]; count: number }> {
    return ProductEditApproval.findAndCountAll(options);
  }

  public async update(
    data: Partial<ProductEditApprovalAttributes>,
    options: UpdateOptions
  ): Promise<[number, ProductEditApproval[]]> {
    return ProductEditApproval.update(data, options) as unknown as Promise<
      [number, ProductEditApproval[]]
    >;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductEditApproval.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductEditApproval.count(options);
  }

  public async findById(
    id: string
  ): Promise<ProductEditApproval | null> {
    return this.findByPk(id);
  }

  public async findPendingByProductId(
    productId: string
  ): Promise<ProductEditApproval | null> {
    return this.findOne({
      where: {
        productId,
        status: ProductEditApprovalStatus.PENDING,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(
    params: ProductEditApprovalQueryParams
  ): Promise<{ rows: ProductEditApproval[]; count: number }> {
    const {
      page,
      pageSize,
      productId,
      applicantId,
      approverId,
      status,
      startTime,
      endTime,
    } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }
    if (applicantId) {
      where.applicantId = applicantId;
    }
    if (approverId) {
      where.approverId = approverId;
    }
    if (status !== undefined) {
      where.status = status;
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

  public async findPendingApproval(
    productId: string
  ): Promise<ProductEditApproval | null> {
    return this.findOne({
      where: {
        productId,
        status: ProductEditApprovalStatus.PENDING,
      },
    });
  }
}

export default new ProductEditApprovalDao();
