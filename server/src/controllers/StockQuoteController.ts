import { Request, Response, NextFunction } from 'express';
import stockQuoteService from '@services/StockQuoteService';
import { success, paginated } from '@utils/response';

export async function getStockList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const market = req.query.market as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const tradeDate = req.query.tradeDate as string | undefined;
    const result = await stockQuoteService.getStockList({ page, pageSize, market, keyword, tradeDate });
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
