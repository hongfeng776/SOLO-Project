import { Request, Response, NextFunction } from 'express';
import tradeService from '@services/TradeService';
import { success, paginated } from '@utils/response';

export async function getTradeList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const tradeType = req.query.tradeType as string | undefined;
    const tradeStatus = req.query.tradeStatus as string | undefined;
    const auditStatus = req.query.auditStatus as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const keyword = req.query.keyword as string | undefined;

    const result = await tradeService.getTradeList({ page, pageSize, customerId, tradeType, tradeStatus, auditStatus, startDate, endDate, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getTradeById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.getTradeById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getTradeByNo(req: Request, res: Response, next: NextFunction) {
  try {
    const tradeNo = req.params.tradeNo;
    const result = await tradeService.getTradeByNo(tradeNo);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeService.createTrade(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function auditTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { auditorId, approved, opinion } = req.body;
    const result = await tradeService.auditTrade(id, auditorId || (req as any).user?.id, !!approved, opinion || '');
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function cancelTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.cancelTrade(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
