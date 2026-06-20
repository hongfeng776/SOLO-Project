import {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  Op,
} from 'sequelize';
import ProductRiskRecord, {
  ProductRiskRecordAttributes,
  ProductRiskRecordCreationAttributes,
} from '../models/ProductRiskRecord.model';
import {
  ProductRiskType,
  ProductRiskStatus,
  ProductRiskSeverity,
  ProductRiskTrigger,
} from '../constants/enum';

interface ProductRiskRecordQueryParams {
  page: number;
  pageSize: number;
  productId?: string;
  riskType?: ProductRiskType;
  riskStatus?: ProductRiskStatus;
  riskSeverity?: ProductRiskSeverity;
  riskTrigger?: ProductRiskTrigger;
  resolved?: boolean;
  isFalseAlarm?: boolean;
  ruleId?: string;
  batchId?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
}

class ProductRiskRecordDao {
  public async create(
    data: ProductRiskRecordCreationAttributes,
    options?: CreateOptions
  ): Promise<ProductRiskRecord> {
    return ProductRiskRecord.create(data, options);
  }

  public async findByPk(
    id: string,
    options?: FindOptions
  ): Promise<ProductRiskRecord | null> {
    return ProductRiskRecord.findByPk(id, options);
  }

  public async findOne(
    options: FindOptions
  ): Promise<ProductRiskRecord | null> {
    return ProductRiskRecord.findOne(options);
  }

  public async findAll(
    options?: FindOptions
  ): Promise<ProductRiskRecord[]> {
    return ProductRiskRecord.findAll(options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: ProductRiskRecord[]; count: number }> {
    return ProductRiskRecord.findAndCountAll(options);
  }

  public async update(
    data: Partial<ProductRiskRecordAttributes>,
    options: UpdateOptions
  ): Promise<[number, ProductRiskRecord[]]> {
    return ProductRiskRecord.update(data, options) as unknown as Promise<
      [number, ProductRiskRecord[]]
    >;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductRiskRecord.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductRiskRecord.count(options);
  }

  public async findById(id: string): Promise<ProductRiskRecord | null> {
    return this.findByPk(id);
  }

  public async findActiveByProductId(
    productId: string
  ): Promise<ProductRiskRecord[]> {
    return this.findAll({
      where: {
        productId,
        resolved: false,
      },
      order: [['triggeredAt', 'DESC']],
    });
  }

  public async countFalseAlarmsByProductId(
    productId: string,
    days: number
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.count({
      where: {
        productId,
        isFalseAlarm: true,
        triggeredAt: {
          [Op.gte]: since,
        },
      },
    });
  }

  public async hasDuplicateRisk(
    productId: string,
    riskType: ProductRiskType,
    minutes: number
  ): Promise<boolean> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);
    const count = await this.count({
      where: {
        productId,
        riskType,
        triggeredAt: {
          [Op.gte]: since,
        },
      },
    });
    return count > 0;
  }

  public async findExpiredRecords(): Promise<ProductRiskRecord[]> {
    return this.findAll({
      where: {
        resolved: false,
        expireAt: {
          [Op.lte]: new Date(),
          [Op.not]: null,
        },
      },
    });
  }

  public async findAllPaged(
    params: ProductRiskRecordQueryParams
  ): Promise<{ rows: ProductRiskRecord[]; count: number }> {
    const {
      page,
      pageSize,
      productId,
      riskType,
      riskStatus,
      riskSeverity,
      riskTrigger,
      resolved,
      isFalseAlarm,
      ruleId,
      batchId,
      startTime,
      endTime,
      keyword,
    } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }
    if (riskType) {
      where.riskType = riskType;
    }
    if (riskStatus !== undefined) {
      where.riskStatus = riskStatus;
    }
    if (riskSeverity) {
      where.riskSeverity = riskSeverity;
    }
    if (riskTrigger) {
      where.riskTrigger = riskTrigger;
    }
    if (resolved !== undefined) {
      where.resolved = resolved;
    }
    if (isFalseAlarm !== undefined) {
      where.isFalseAlarm = isFalseAlarm;
    }
    if (ruleId) {
      where.ruleId = ruleId;
    }
    if (batchId) {
      where.batchId = batchId;
    }
    if (startTime || endTime) {
      where.triggeredAt = {};
      if (startTime) {
        where.triggeredAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.triggeredAt[Op.lte] = end;
      }
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['triggeredAt', 'DESC']],
    });
  }
}

export default new ProductRiskRecordDao();
