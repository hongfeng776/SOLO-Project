import { Request, Response, NextFunction } from 'express';
import replayService from '@services/ReplayService';
import { success, paginated } from '@utils/response';
import { AppError } from '@middlewares/errorHandler';

export async function validateTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      throw new AppError(400, '请提供开始和结束日期');
    }
    const result = await replayService.validateTimeRange(startDate, endDate);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { stockCode } = req.body;
    if (!stockCode) {
      throw new AppError(400, '请提供股票代码');
    }
    const result = await replayService.validateStockCode(stockCode);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const sector = req.query.sector as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await replayService.getReplaySessions({ page, pageSize, sector, status });
    res.json(paginated(result.list, result.total, page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getSessionDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = Number(req.params.id);
    const result = await replayService.getReplayDetail(sessionId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }
    const result = await replayService.createReplaySession(req.body, req.user.userId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function generateConclusion(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = Number(req.params.id);
    const result = await replayService.generateConclusion(sessionId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function queryHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const stockCode = req.query.stockCode as string | undefined;
    const sector = req.query.sector as string | undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const changeRateMin = req.query.changeRateMin !== undefined ? Number(req.query.changeRateMin) : undefined;
    const changeRateMax = req.query.changeRateMax !== undefined ? Number(req.query.changeRateMax) : undefined;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;

    if (!startDate || !endDate) {
      throw new AppError(400, '请提供开始和结束日期');
    }

    const result = await replayService.queryHistoryData({
      stockCode,
      sector,
      startDate,
      endDate,
      changeRateMin,
      changeRateMax,
      page,
      pageSize,
    });
    res.json(paginated(result.list, result.total, page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function matchVolatility(req: Request, res: Response, next: NextFunction) {
  try {
    const stockCode = req.params.stockCode;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      throw new AppError(400, '请提供开始和结束日期');
    }

    const result = await replayService.matchVolatilityPattern(stockCode, startDate, endDate);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkCompleteness(req: Request, res: Response, next: NextFunction) {
  try {
    const stockCode = req.params.stockCode;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      throw new AppError(400, '请提供开始和结束日期');
    }

    const result = await replayService.checkDataCompleteness(stockCode, startDate, endDate);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getSectorComparison(req: Request, res: Response, next: NextFunction) {
  try {
    const sector = req.query.sector as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!sector || !startDate || !endDate) {
      throw new AppError(400, '请提供板块、开始和结束日期');
    }

    const result = await replayService.getSectorComparison(sector, startDate, endDate);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const { stockCodes, startDate, endDate, fields, orderBy, isFullExport, format } = req.body;

    if (!stockCodes || !Array.isArray(stockCodes) || stockCodes.length === 0) {
      throw new AppError(400, '请提供股票代码列表');
    }
    if (!startDate || !endDate) {
      throw new AppError(400, '请提供开始和结束日期');
    }

    const buffer = await replayService.exportReplayData({
      stockCodes,
      startDate,
      endDate,
      fields,
      orderBy,
      isFullExport: isFullExport === true,
      format: format === 'xlsx' ? 'xlsx' : 'csv',
    });

    const ext = format === 'xlsx' ? 'xlsx' : 'csv';
    const mimeType = format === 'xlsx'
      ? 'application/vnd.ms-excel'
      : 'text/csv; charset=utf-8';
    const fileName = `replay_data_${startDate}_${endDate}.${ext}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
