import { Op } from 'sequelize';
import assetProductDAO from '@dao/AssetProductDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';

const LIST_CACHE_TTL = 300;
const DETAIL_CACHE_TTL = 600;
const LIST_CACHE_PREFIX = 'asset:product:list:';
const DETAIL_CACHE_PREFIX = 'asset:product:id:';

type ProductListResult = { list: any[]; total: number; page: number; pageSize: number };

class AssetProductService {
  async getProductById(id: number) {
    const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;
    const cached = await CacheUtil.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await db.AssetProduct.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    await CacheUtil.set(cacheKey, product, DETAIL_CACHE_TTL);
    return product;
  }

  async getProductList(params: { page: number; pageSize: number; productType?: string; riskLevel?: string; productStatus?: string; keyword?: string }): Promise<ProductListResult> {
    const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(params)}`;
    const cached = await CacheUtil.get<ProductListResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, pageSize, productType, riskLevel, productStatus, keyword } = params;
    const where: any = {};

    if (productType) {
      where.product_type = productType;
    }

    if (riskLevel) {
      where.risk_level = riskLevel;
    }

    if (productStatus) {
      where.product_status = productStatus;
    }

    if (keyword) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${keyword}%` } },
        { product_name: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.AssetProduct.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const result = { list: rows, total: count, page, pageSize };
    await CacheUtil.set(cacheKey, result, LIST_CACHE_TTL);
    return result;
  }

  async getProductByCode(productCode: string) {
    const product = await assetProductDAO.findByProductCode(productCode);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  }

  async createProduct(data: any) {
    const existing = await assetProductDAO.findByProductCode(data.product_code);
    if (existing) {
      throw new AppError(409, 'Product code already exists');
    }
    const product = await db.AssetProduct.create(data);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
    return product;
  }

  async updateProduct(id: number, data: any) {
    const product = await db.AssetProduct.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    await db.AssetProduct.update(data, { where: { id } });
    const updatedProduct = await db.AssetProduct.findByPk(id);
    await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
    return updatedProduct;
  }

  async deleteProduct(id: number) {
    const product = await db.AssetProduct.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    await db.AssetProduct.destroy({ where: { id } });
    await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
  }
}

export default new AssetProductService();
