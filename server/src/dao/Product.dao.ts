import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op, BulkCreateOptions } from 'sequelize';
import Product, { ProductAttributes, ProductCreationAttributes } from '../models/Product.model';

interface ProductQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: string;
  status?: number;
  auditStage?: number;
  channelId?: string;
  submitterId?: string;
  isHot?: boolean;
  isRecommended?: boolean;
  fakeProductFlag?: boolean;
}

class ProductDao {
  public async create(data: ProductCreationAttributes, options?: CreateOptions): Promise<Product> {
    return Product.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Product | null> {
    return Product.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Product | null> {
    return Product.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Product[]> {
    return Product.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Product[]; count: number }> {
    return Product.findAndCountAll(options);
  }

  public async update(data: Partial<ProductAttributes>, options: UpdateOptions): Promise<[number, Product[]]> {
    return Product.update(data, options) as unknown as Promise<[number, Product[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Product.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Product.count(options);
  }

  public async findById(id: string): Promise<Product | null> {
    return this.findByPk(id);
  }

  public async findBySku(sku: string): Promise<Product | null> {
    return this.findOne({ where: { sku } });
  }

  public async findAllPaged(params: ProductQueryParams): Promise<{ rows: Product[]; count: number }> {
    const { page, pageSize, keyword, category, status, auditStage, channelId, submitterId, isHot, isRecommended, fakeProductFlag } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { sku: { [Op.like]: `%${keyword}%` } },
        { brand: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (auditStage !== undefined) {
      where.auditStage = auditStage;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (submitterId) {
      where.submitterId = submitterId;
    }
    if (isHot !== undefined) {
      where.isHot = isHot;
    }
    if (isRecommended !== undefined) {
      where.isRecommended = isRecommended;
    }
    if (fakeProductFlag !== undefined) {
      where.fakeProductFlag = fakeProductFlag;
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  public async findExpiredPromotionProducts(): Promise<Product[]> {
    return this.findAll({
      where: {
        status: 3,
        limitedPromotion: true,
        promotionEndTime: {
          [Op.and]: {
            [Op.ne]: null,
            [Op.lt]: new Date(),
          },
        },
      },
    });
  }

  public async findExpiredListProducts(): Promise<Product[]> {
    return this.findAll({
      where: {
        status: 3,
        listEndTime: {
          [Op.and]: {
            [Op.ne]: null,
            [Op.lt]: new Date(),
          },
        },
      },
    });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async existsBySku(sku: string): Promise<boolean> {
    const count = await this.count({ where: { sku } });
    return count > 0;
  }

  public async existsBySkuAndId(sku: string, excludeId: string): Promise<boolean> {
    const count = await this.count({ where: { sku, id: { [Op.ne]: excludeId } } });
    return count > 0;
  }

  public async checkDuplicate(name: string, excludeId?: string): Promise<Product[]> {
    const where: any = {
      name: { [Op.like]: `%${name}%` },
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.findAll({ where, limit: 10 });
  }

  public async bulkCreate(data: ProductCreationAttributes[], options?: BulkCreateOptions<ProductAttributes>): Promise<Product[]> {
    return Product.bulkCreate(data, options as any);
  }

  public async bulkUpdate(ids: string[], data: Partial<ProductAttributes>): Promise<[number, Product[]]> {
    return this.update(data, { where: { id: { [Op.in]: ids } } });
  }
}

export default new ProductDao();
