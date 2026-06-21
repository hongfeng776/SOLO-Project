import { Request, Response, NextFunction } from 'express';
import customerHoldingService from '@services/CustomerHoldingService';
import { success, paginated } from '@utils/response';

export async function getHoldingList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const stockCode = req.query.stockCode as string | undefined;
    const lockStatus = req.query.lockStatus as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;
    const keyword = req.query.keyword as string | undefined;

    const result = await customerHoldingService.getHoldingList({
      page,
      pageSize,
      customerId,
      stockCode,
      lockStatus,
      riskLevel,
      keyword,
    });
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

export async function lockHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const user = (req as any).user;
    const result = await customerHoldingService.lockHolding(id, reason, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function unlockHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const result = await customerHoldingService.unlockHolding(id, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function adjustHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const result = await customerHoldingService.adjustHolding(req.body, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchLockHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const { holdingIds, reason } = req.body;
    const user = (req as any).user;
    const result = await customerHoldingService.batchLockHolding(holdingIds, reason, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchUnlockHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const { holdingIds } = req.body;
    const user = (req as any).user;
    const result = await customerHoldingService.batchUnlockHolding(holdingIds, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchLockByFilter(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const result = await customerHoldingService.batchLockByFilter(req.body, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getHoldingAuditTrail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerHoldingService.getHoldingAuditTrail(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateHoldingOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const { holdingId, operationType } = req.body;
    const result = await customerHoldingService.validateHoldingOperation(holdingId, operationType);
    res.json(success({ valid: true, holding: result.holding, customer: result.customer }));
  } catch (err: any) {
    if (err instanceof Error && 'statusCode' in err) {
      res.json(success({ valid: false, message: err.message }));
    } else {
      next(err);
    }
  }
}

export async function syncHoldingsMarketValue(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customerHoldingService.syncHoldingsMarketValue();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
