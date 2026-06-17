import { Request, Response, NextFunction } from 'express';
import stockQuoteService from '@services/StockQuoteService';
import { success, paginated } from '@utils/response';

export async function validateStockCode(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string;
    const market = req.query.market as string | undefined;
    const result = stockQuoteService.validateStockCode(code, market);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkTradingSession(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = stockQuoteService.checkTradingSession();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkDataSourceStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = stockQuoteService.checkDataSourceStatus();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStockHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const days = Number(req.query.days) || 30;
    const result = await stockQuoteService.getStockHistory(id, days);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function refreshAllPrices(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await stockQuoteService.refreshAllPrices();
    res.json(success({ refreshedCount: result }));
  } catch (err) {
    next(err);
  }
}

export async function validateQuoteData(req: Request, res: Response, next: NextFunction) {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const result = await stockQuoteService.validateQuoteData(data);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStockList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const market = req.query.market as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const tradeDate = req.query.tradeDate as string | undefined;
    const sector = req.query.sector as string | undefined;
    const status = req.query.status as string | undefined;
    const changeRateMin = req.query.changeRateMin !== undefined ? Number(req.query.changeRateMin) : undefined;
    const changeRateMax = req.query.changeRateMax !== undefined ? Number(req.query.changeRateMax) : undefined;
    const volumeMin = req.query.volumeMin !== undefined ? Number(req.query.volumeMin) : undefined;
    const volumeMax = req.query.volumeMax !== undefined ? Number(req.query.volumeMax) : undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;

    let _highPrecision = false;
    if (req.user && req.user.roles) {
      const adminRoles = ['super_admin', 'admin'];
      _highPrecision = req.user.roles.some((r) => adminRoles.includes(r));
    }

    const result = await stockQuoteService.getStockList({
      page,
      pageSize,
      market,
      keyword,
      tradeDate,
      sector,
      status,
      changeRateMin,
      changeRateMax,
      volumeMin,
      volumeMax,
      sortBy,
      sortOrder,
      _highPrecision,
    });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getStockById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await stockQuoteService.getStockById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStockByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const stockCode = req.params.stockCode;
    const result = await stockQuoteService.getStockByCode(stockCode);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createStock(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await stockQuoteService.createStock(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await stockQuoteService.updateStock(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await stockQuoteService.deleteStock(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function batchDeleteStock(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = req.body.ids as number[];
    const result = await stockQuoteService.batchDelete(ids);
    res.json(success({ deletedCount: result }));
  } catch (err) {
    next(err);
  }
}
