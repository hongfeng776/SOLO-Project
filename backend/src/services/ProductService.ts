import { ProductRepository } from '../repositories';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  PaginatedResult
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId, isValidAmount } from '../utils/validate';
import { Op } from 'sequelize';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  async getProductList(params: ProductQueryParams): Promise<PaginatedResult<any>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.productRepository.buildQuery(queryParams);

    return await this.productRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'sort', sortOrder: 'ASC' }
    );
  }

  async getAllProducts(): Promise<any[]> {
    const products = await this.productRepository.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });

    return products.map(p => {
      const data = p.toJSON ? p.toJSON() : p;
      return data;
    });
  }

  async getProductById(id: string): Promise<any> {
    if (!isValidId(id)) {
      throwValidationError('无效的产品ID');
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throwNotFoundError('产品不存在');
    }

    return product.toJSON ? product.toJSON() : product;
  }

  async createProduct(request: CreateProductRequest): Promise<any> {
    const { name, code, ...productData } = request;

    if (!name || name.trim().length === 0) {
      throwValidationError('产品名称不能为空');
    }

    if (!code || code.trim().length === 0) {
      throwValidationError('产品代码不能为空');
    }

    const existing = await this.productRepository.findByCode(code);
    if (existing) {
      throwConflictError('产品代码已存在');
    }

    if (productData.min_amount !== undefined && !isValidAmount(productData.min_amount)) {
      throwValidationError('起购金额无效');
    }

    if (productData.max_amount !== undefined && !isValidAmount(productData.max_amount)) {
      throwValidationError('最高金额无效');
    }

    if (productData.min_amount !== undefined && productData.max_amount !== undefined) {
      if (productData.max_amount > 0 && productData.min_amount > productData.max_amount) {
        throwValidationError('起购金额不能大于最高金额');
      }
    }

    if (productData.interest_rate !== undefined) {
      if (productData.interest_rate < 0 || productData.interest_rate > 100) {
        throwValidationError('利率范围应为0-100');
      }
    }

    if (productData.risk_level !== undefined) {
      if (![1, 2, 3, 4, 5].includes(productData.risk_level)) {
        throwValidationError('风险等级无效');
      }
    }

    if (productData.term_days !== undefined) {
      if (productData.term_days < 0) {
        throwValidationError('期限天数不能为负数');
      }
    }

    const product = await this.productRepository.create({
      ...productData,
      name: name.trim(),
      code: code.trim(),
      status: request.status ?? 1
    });

    return this.getProductById(product.id);
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<any> {
    if (!isValidId(id)) {
      throwValidationError('无效的产品ID');
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throwNotFoundError('产品不存在');
    }

    if (request.min_amount !== undefined && !isValidAmount(request.min_amount)) {
      throwValidationError('起购金额无效');
    }

    if (request.max_amount !== undefined && !isValidAmount(request.max_amount)) {
      throwValidationError('最高金额无效');
    }

    if (request.interest_rate !== undefined) {
      if (request.interest_rate < 0 || request.interest_rate > 100) {
        throwValidationError('利率范围应为0-100');
      }
    }

    if (request.risk_level !== undefined) {
      if (![1, 2, 3, 4, 5].includes(request.risk_level)) {
        throwValidationError('风险等级无效');
      }
    }

    await this.productRepository.update(id, request);

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的产品ID');
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throwNotFoundError('产品不存在');
    }

    await this.productRepository.delete(id);
  }

  async batchDeleteProducts(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的产品');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的产品ID');
      }
    }

    await this.productRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async updateProductStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的产品ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throwNotFoundError('产品不存在');
    }

    await this.productRepository.update(id, { status });
  }
}