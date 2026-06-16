import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { CustomerService } from '../services';
import { CustomerQueryParams, CreateCustomerRequest, UpdateCustomerRequest } from '../types';

const customerService = new CustomerService();

export class CustomerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CustomerQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        id_card_no: req.query.id_card_no as string,
        customer_type: req.query.customer_type !== undefined ? Number(req.query.customer_type) as any : undefined,
        customer_level: req.query.customer_level !== undefined ? Number(req.query.customer_level) as any : undefined,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) as any : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string
      };
      const result = await customerService.getCustomerList(params);
      sendSuccessPage(res, result, '获取客户列表成功');
    } catch (error) {
      next(error);
    }
  }

  async all(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = {
        org_id: req.query.org_id as string,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined
      };
      const result = await customerService.getAllCustomers(options);
      sendSuccess(res, result, '获取全部客户成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      sendSuccess(res, customer, '获取客户详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.createCustomer(req.body as CreateCustomerRequest);
      sendSuccess(res, customer, '创建客户成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body as UpdateCustomerRequest);
      sendSuccess(res, customer, '更新客户成功');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerService.updateCustomerStatus(req.params.id, req.body.status);
      sendSuccess(res, null, '更新客户状态成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerService.deleteCustomer(req.params.id);
      sendSuccess(res, null, '删除客户成功');
    } catch (error) {
      next(error);
    }
  }

  async batchDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerService.batchDeleteCustomers(req.body.ids);
      sendSuccess(res, null, '批量删除客户成功');
    } catch (error) {
      next(error);
    }
  }
}
