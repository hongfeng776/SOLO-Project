import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { ProductQueryParams, CreateProductRequest, UpdateProductRequest } from '../types';
import { ProductService } from '../services';

const productService = new ProductService();

const channels = [
  { id: '1', name: '线上银行', code: 'ONLINE_BANK', type: 1, status: 1, sort: 1 },
  { id: '2', name: '手机银行', code: 'MOBILE_BANK', type: 1, status: 1, sort: 2 },
  { id: '3', name: '柜面渠道', code: 'COUNTER', type: 2, status: 1, sort: 3 },
  { id: '4', name: 'ATM渠道', code: 'ATM', type: 2, status: 1, sort: 4 },
  { id: '5', name: '微信银行', code: 'WECHAT', type: 1, status: 0, sort: 5 },
  { id: '6', name: '第三方支付', code: 'THIRD_PARTY', type: 3, status: 1, sort: 6 }
];

export class ProductController {
  async channelList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const result = {
        list: channels.slice(start, end),
        total: channels.length,
        page,
        pageSize
      };
      sendSuccessPage(res, result, '获取渠道业务列表成功');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: ProductQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        code: req.query.code as string,
        category: req.query.category as string,
        type: req.query.type as string,
        status: req.query.status ? Number(req.query.status) as 0 | 1 : undefined,
        risk_level: req.query.risk_level ? Number(req.query.risk_level) as 1 | 2 | 3 | 4 | 5 : undefined
      };
      const result = await productService.getProductList(params);
      sendSuccessPage(res, result, '获取产品列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      sendSuccess(res, product, '获取产品详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body as CreateProductRequest);
      sendSuccess(res, product, '创建产品成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id, req.body as UpdateProductRequest);
      sendSuccess(res, product, '更新产品成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id);
      sendSuccess(res, null, '删除产品成功');
    } catch (error) {
      next(error);
    }
  }
}
