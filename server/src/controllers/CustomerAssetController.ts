import { Request, Response, NextFunction } from 'express';
import customerAssetService from '@services/CustomerAssetService';
import { success, paginated } from '@utils/response';

export async function getCustomerList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const riskLevel = req.query.riskLevel as string | undefined;
    const customerType = req.query.customerType as string | undefined;
    const status = req.query.status as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const result = await customerAssetService.getCustomerList({ page, pageSize, riskLevel, customerType, status, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerAssetService.getCustomerById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customerAssetService.createCustomer(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerAssetService.updateCustomer(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await customerAssetService.deleteCustomer(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerSimpleList(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const result = await customerAssetService.getCustomerList({
      page: 1,
      pageSize: 1000,
      status: status || 'normal',
    });
    res.json(success(result.list));
  } catch (err) {
    next(err);
  }
}
