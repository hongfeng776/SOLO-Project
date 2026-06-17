import { Request, Response, NextFunction } from 'express';
import quoteThresholdService from '@services/QuoteThresholdService';
import { ThresholdType, ScopeType, ConfigStatus } from '@models/QuoteThreshold';
import { success, paginated } from '@utils/response';
import { AppError } from '@middlewares/errorHandler';

export async function getThresholdList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const scopeType = req.query.scopeType as ScopeType | undefined;
    const sector = req.query.sector as string | undefined;
    const thresholdType = req.query.thresholdType as ThresholdType | undefined;
    const status = req.query.status as ConfigStatus | undefined;

    const result = await quoteThresholdService.getThresholdList({
      scopeType,
      sector,
      thresholdType,
      status,
      page,
      pageSize,
    });

    res.json(paginated(result.list, result.total, page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getActiveThresholds(req: Request, res: Response, next: NextFunction) {
  try {
    const sectorsQuery = req.query.sectors as string | undefined;
    const sectors = sectorsQuery ? sectorsQuery.split(',') : undefined;

    const result = await quoteThresholdService.getActiveThresholds(sectors);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getThresholdById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError(400, '无效的ID');
    }

    const quoteThresholdDAO = await import('@dao/QuoteThresholdDAO');
    const result = await quoteThresholdDAO.default.findByThresholdIdWithHistory(id);

    if (!result) {
      throw new AppError(404, '阈值配置不存在');
    }

    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getThresholdHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const days = Number(req.query.days) || 90;

    if (isNaN(id)) {
      throw new AppError(400, '无效的ID');
    }

    const result = await quoteThresholdService.getThresholdHistory(id, days);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkRange(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, min, max, warn, trigger } = req.body as {
      type: ThresholdType;
      min: number;
      max: number;
      warn: number;
      trigger: number;
    };

    if (!type || min === undefined || max === undefined || warn === undefined || trigger === undefined) {
      throw new AppError(400, '缺少必填参数: type, min, max, warn, trigger');
    }

    const result = await quoteThresholdService.validateRange(
      type,
      Number(min),
      Number(max),
      Number(warn),
      Number(trigger),
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkConflict(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, sector, min, max, warn, trigger, excludeId } = req.body as {
      type: ThresholdType;
      sector: string;
      min: number;
      max: number;
      warn: number;
      trigger: number;
      excludeId?: number;
    };

    if (!type || !sector || min === undefined || max === undefined || warn === undefined || trigger === undefined) {
      throw new AppError(400, '缺少必填参数: type, sector, min, max, warn, trigger');
    }

    const result = await quoteThresholdService.checkConflictWithHistory(
      type,
      sector,
      Number(min),
      Number(max),
      Number(warn),
      Number(trigger),
      excludeId,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end, isPermanent } = req.body as {
      start: Date;
      end: Date | null;
      isPermanent: boolean;
    };

    if (start === undefined || isPermanent === undefined) {
      throw new AppError(400, '缺少必填参数: start, isPermanent');
    }

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : null;

    const result = await quoteThresholdService.validateEffectivePeriod(
      startDate,
      endDate,
      isPermanent,
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createThreshold(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }

    const operator = {
      id: req.user.userId,
      name: req.user.username || req.user.userId.toString(),
    };

    const result = await quoteThresholdService.createThreshold(req.body, operator);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateThreshold(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }

    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError(400, '无效的ID');
    }

    const operator = {
      id: req.user.userId,
      name: req.user.username || req.user.userId.toString(),
    };

    const result = await quoteThresholdService.updateThreshold(id, req.body, operator);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchUpdateThresholds(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }

    const { ids, patch } = req.body as {
      ids: number[];
      patch: Record<string, unknown>;
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError(400, '请提供要更新的ID列表');
    }

    const operator = {
      id: req.user.userId,
      name: req.user.username || req.user.userId.toString(),
    };

    const result = await quoteThresholdService.batchUpdateThresholds(ids, patch, operator);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteThreshold(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }

    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError(400, '无效的ID');
    }

    const operator = {
      id: req.user.userId,
      name: req.user.username || req.user.userId.toString(),
    };

    const result = await quoteThresholdService.deleteThreshold(id, operator);
    res.json(success({ deleted: result }));
  } catch (err) {
    next(err);
  }
}

export async function expireTemporaryThresholds(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await quoteThresholdService.expireTemporaryThresholds();
    res.json(success({ expiredCount: result }));
  } catch (err) {
    next(err);
  }
}

export async function matchScenarios(req: Request, res: Response, next: NextFunction) {
  try {
    const { stockSector, stockVolatility } = req.body as {
      stockSector: string;
      stockVolatility: number;
    };

    if (!stockSector || stockVolatility === undefined) {
      throw new AppError(400, '缺少必填参数: stockSector, stockVolatility');
    }

    const result = await quoteThresholdService.getMatchingScenarios(
      stockSector,
      Number(stockVolatility),
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
