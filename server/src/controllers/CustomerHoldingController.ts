import { Request, Response, NextFunction } from 'express';
import customerHoldingService from '@services/CustomerHoldingService';
import { success, paginated } from '@utils/response';

export async function getHoldingList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const productType = req.query.productType as string | undefined;
    const status = req.query.status as string | undefined;
    const keyword = req.query.keyword as string | undefined;

    const result = await customerHoldingService.getHoldingList({ page, pageSize, customerId, productType, status, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getHoldingsByCustomerId(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = Number(req.params.customerId);
    const result = await customerHoldingService.getHoldingsByCustomerId(customerId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
