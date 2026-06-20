import {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  Op,
} from 'sequelize';
import ProductRiskRule, {
  ProductRiskRuleAttributes,
  ProductRiskRuleCreationAttributes,
} from '../models/ProductRiskRule.model';
import { ProductRiskType, ProductRiskSeverity } from '../constants/enum';

interface ProductRiskRuleQueryParams {
  page: number;
  pageSize: number;
  ruleType?: ProductRiskType;
  severity?: ProductRiskSeverity;
  enabled?: boolean;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
}

class ProductRiskRuleDao {
  public async create(
    data: ProductRiskRuleCreationAttributes,
    options?: CreateOptions
  ): Promise<ProductRiskRule> {
    return ProductRiskRule.create(data, options);
  }

  public async findByPk(
    id: string,
    options?: FindOptions
  ): Promise<ProductRiskRule | null> {
    return ProductRiskRule.findByPk(id, options);
  }

  public async findOne(
    options: FindOptions
  ): Promise<ProductRiskRule | null> {
    return ProductRiskRule.findOne(options);
  }

  public async findAll(
    options?: FindOptions
  ): Promise<ProductRiskRule[]> {
    return ProductRiskRule.findAll(options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: ProductRiskRule[]; count: number }> {
    return ProductRiskRule.findAndCountAll(options);
  }

  public async update(
    data: Partial<ProductRiskRuleAttributes>,
    options: UpdateOptions
  ): Promise<[number, ProductRiskRule[]]> {
    return ProductRiskRule.update(data, options) as unknown as Promise<
      [number, ProductRiskRule[]]
    >;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ProductRiskRule.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ProductRiskRule.count(options);
  }

  public async findById(id: string): Promise<ProductRiskRule | null> {
    return this.findByPk(id);
  }

  public async findAllEnabled(): Promise<ProductRiskRule[]> {
    const now = new Date();
    return this.findAll({
      where: {
        enabled: true,
        [Op.and]: [
          {
            [Op.or]: [
              { effectiveFrom: { [Op.is]: null } },
              { effectiveFrom: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { effectiveTo: { [Op.is]: null } },
              { effectiveTo: { [Op.gte]: now } },
            ],
          },
        ],
      },
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  public async findByType(
    ruleType: ProductRiskType
  ): Promise<ProductRiskRule | null> {
    return this.findOne({
      where: {
        ruleType,
        enabled: true,
      },
    });
  }

  public async findAllPaged(
    params: ProductRiskRuleQueryParams
  ): Promise<{ rows: ProductRiskRule[]; count: number }> {
    const {
      page,
      pageSize,
      ruleType,
      severity,
      enabled,
      keyword,
      sortBy = 'sort',
      sortOrder = 'ASC',
    } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (ruleType) {
      where.ruleType = ruleType;
    }
    if (severity) {
      where.severity = severity;
    }
    if (enabled !== undefined) {
      where.enabled = enabled;
    }
    if (keyword) {
      where[Op.or] = [
        { ruleName: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [[sortBy, sortOrder], ['createdAt', 'DESC']],
    });
  }
}

export default new ProductRiskRuleDao();
