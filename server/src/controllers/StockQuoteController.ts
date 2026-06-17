import { Request, Response, NextFunction } from 'express';
import stockQuoteService from '@services/StockQuoteService';
import { success, paginated } from '@utils/response';
import { AppError } from '@middlewares/errorHandler';

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

export async function exportTemplate(_req: Request, res: Response, next: NextFunction) {
  try {
    const headers = [
      '股票代码',
      '股票名称',
      '市场',
      '交易日期',
      '现价',
      '涨跌额',
      '涨跌幅(%)',
      '开盘价',
      '收盘价',
      '最高价',
      '最低价',
      '成交量',
      '成交额',
      '市盈率',
      '市净率',
      '总市值',
      '流通市值',
      '板块',
      '数据源',
    ];

    const csvContent = headers.join(',') + '\n';
    const exampleRow = [
      '600519',
      '贵州茅台',
      'SH',
      '2026-06-16',
      '1689.00',
      '25.50',
      '1.53',
      '1665.00',
      '1663.50',
      '1695.00',
      '1660.00',
      '2580000',
      '4350000000.00',
      '33.56',
      '10.28',
      '2122500000000',
      '2122500000000',
      '消费',
      'sina',
    ];
    const fullContent = csvContent + exampleRow.join(',') + '\n';

    const fileName = `stock_quote_template_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    const bom = '\uFEFF';
    res.send(bom + fullContent);
  } catch (err) {
    next(err);
  }
}

export async function batchImportQuotes(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }
    const dataList = req.body.dataList as any[];
    const operator = {
      id: req.user.userId,
      name: (req.user as any).username || req.user.userId.toString(),
    };
    const result = await stockQuoteService.batchImportQuotes(dataList, operator);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getImportProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const result = await stockQuoteService.getImportProgress(taskId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkRegistered(req: Request, res: Response, next: NextFunction) {
  try {
    const stockCode = req.query.stockCode as string;
    if (!stockCode) {
      throw new AppError(400, '请提供股票代码');
    }
    const result = await stockQuoteService.checkStockRegistered(stockCode);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkFluctuation(req: Request, res: Response, next: NextFunction) {
  try {
    const stockId = Number(req.params.id);
    const newPrice = Number(req.query.newPrice);
    const baseDate = req.query.baseDate as string | undefined;
    if (isNaN(newPrice)) {
      throw new AppError(400, '请提供有效的新价格 newPrice');
    }
    const result = await stockQuoteService.checkPriceFluctuation(stockId, newPrice, baseDate);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const result = stockQuoteService.validateQuoteRecord(data);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getAuditTrail(req: Request, res: Response, next: NextFunction) {
  try {
    const stockId = Number(req.params.id);
    const days = Number(req.query.days) || 30;
    const result = await stockQuoteService.getQuoteAuditTrail(stockId, days);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkConsistency(req: Request, res: Response, next: NextFunction) {
  try {
    const stockId = Number(req.params.id);
    const result = await stockQuoteService.checkConsistencyWithExchange(stockId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createWithAudit(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError(401, '请先登录');
    }
    const data = req.body.data;
    const confirmed = req.body.confirmed === true;
    const operator = {
      id: req.user.userId,
      name: (req.user as any).username || req.user.userId.toString(),
    };
    const result = await stockQuoteService.createQuoteWithAudit(data, operator, confirmed);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
