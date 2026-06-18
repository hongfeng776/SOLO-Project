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

export async function getTradingSession(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = tradeService.getTradingSession();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, stockId, direction, price, quantity, checkSession } = req.body;
    const result = await tradeService.validateOrder({
      customerId: Number(customerId),
      stockId: Number(stockId),
      direction,
      price: Number(price),
      quantity: Number(quantity),
      checkSession: checkSession !== false,
    });
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function submitOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeService.submitOrder({
      ...req.body,
      customerId: Number(req.body.customerId),
      stockId: Number(req.body.stockId),
      price: Number(req.body.price),
      quantity: Number(req.body.quantity),
      operatorId: (req as any).user?.id,
    });
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchSubmitOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { orders } = req.body;
    const result = await tradeService.batchSubmitOrders(orders, (req as any).user?.id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getOrderTrace(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.getOrderTrace(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getPendingOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const riskLevel = req.query.riskLevel as string | undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;

    const result = await tradeService.getPendingOrders({ page, pageSize, riskLevel, customerId });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function processBatchOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, action, opinion } = req.body;
    const result = await tradeService.processBatchOrders(
      ids.map(Number),
      action,
      (req as any).user?.id,
      opinion,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateMatchingOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.validateMatchingOrder(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function executeMatching(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.executeMatching(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchExecuteMatching(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const result = await tradeService.batchExecuteMatching(ids.map(Number));
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getMatchingOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const matchStatus = req.query.matchStatus as string | undefined;
    const stockCode = req.query.stockCode as string | undefined;
    const direction = req.query.direction as string | undefined;

    const result = await tradeService.getMatchingOrders({ page, pageSize, matchStatus, stockCode, direction });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getMatchingProgress(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeService.getMatchingProgress();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchControlOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, action } = req.body;
    const result = await tradeService.batchControlOrders(
      ids.map(Number),
      action,
      (req as any).user?.id,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getMatchingTrace(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.getMatchingTrace(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateStatusOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const targetStatus = req.query.targetStatus as string;
    const result = await tradeService.validateStatusOperation(id, targetStatus);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function manualChangeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { targetStatus, reason } = req.body;
    const operatorId = (req as any).user?.id;
    const result = await tradeService.manualChangeStatus(id, targetStatus, operatorId, reason);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchChangeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, targetStatus, reason, filters } = req.body;
    const operatorId = (req as any).user?.id;
    const result = await tradeService.batchChangeStatus(ids.map(Number), targetStatus, operatorId, reason, filters);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStatusTrace(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeService.getStatusTrace(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
