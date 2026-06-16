import { Op } from 'sequelize';
import stockQuoteDAO from '@dao/StockQuoteDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';

const LIST_CACHE_TTL = 300;
const DETAIL_CACHE_TTL = 600;
const LIST_CACHE_PREFIX = 'stock:quote:list:';
const DETAIL_CACHE_PREFIX = 'stock:quote:id:';

type StockListResult = { list: any[]; total: number; page: number; pageSize: number };

class StockQuoteService {
  async getStockList(params: { page: number; pageSize: number; market?: string; keyword?: string; tradeDate?: string }): Promise<StockListResult> {
    const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(params)}`;
    const cached = await CacheUtil.get<StockListResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, pageSize, market, keyword, tradeDate } = params;
    const where: any = {};

    if (market) {
      where.market = market;
    }

    if (keyword) {
      where[Op.or] = [
        { stock_code: { [Op.like]: `%${keyword}%` } },
        { stock_name: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (tradeDate) {
      where.trade_date = tradeDate;
    }

    const { rows, count } = await db.StockQuote.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const result = { list: rows, total: count, page, pageSize };
    await CacheUtil.set(cacheKey, result, LIST_CACHE_TTL);
    return result;
  }

  async getStockById(id: number) {
    const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;
    const cached = await CacheUtil.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stock = await db.StockQuote.findByPk(id);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }

    await CacheUtil.set(cacheKey, stock, DETAIL_CACHE_TTL);
    return stock;
  }

  async getStockByCode(stockCode: string) {
    const stock = await stockQuoteDAO.findByStockCode(stockCode);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }
    return stock;
  }

  async createStock(data: any) {
    const existing = await stockQuoteDAO.findByStockCode(data.stock_code);
    if (existing) {
      throw new AppError(409, 'Stock code already exists');
    }
    const stock = await db.StockQuote.create(data);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
    return stock;
  }

  async updateStock(id: number, data: any) {
    const stock = await db.StockQuote.findByPk(id);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }
    await db.StockQuote.update(data, { where: { id } });
    const updatedStock = await db.StockQuote.findByPk(id);
    await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
    return updatedStock;
  }

  async deleteStock(id: number) {
    const stock = await db.StockQuote.findByPk(id);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }
    await db.StockQuote.destroy({ where: { id } });
    await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
  }
}

export default new StockQuoteService();
