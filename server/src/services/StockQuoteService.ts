import { Op } from 'sequelize';
import stockQuoteDAO from '@dao/StockQuoteDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';

const LIST_CACHE_TTL = 10;
const DETAIL_CACHE_TTL = 5;
const LIST_CACHE_PREFIX = 'stock:quote:list:';
const DETAIL_CACHE_PREFIX = 'stock:quote:id:';

type StockListResult = { list: any[]; total: number; page: number; pageSize: number };

class StockQuoteService {
  async getStockList(params: { page: number; pageSize: number; market?: string; keyword?: string; tradeDate?: string }): Promise<StockListResult> {
    const { page, pageSize, market, keyword, tradeDate } = params;
    const filters = { market, keyword, tradeDate };
    const cacheKey = `${LIST_CACHE_PREFIX}${page}:${pageSize}:${JSON.stringify(filters)}`;

    return CacheUtil.getOrSet<StockListResult>(cacheKey, LIST_CACHE_TTL, async () => {
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

      return { list: rows, total: count, page, pageSize };
    });
  }

  async getStockById(id: number) {
    const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;
    return CacheUtil.getOrSet<any>(cacheKey, DETAIL_CACHE_TTL, async () => {
      const stock = await db.StockQuote.findByPk(id);
      if (!stock) {
        throw new AppError(404, 'Stock not found');
      }
      return stock;
    });
  }

  async refreshStockPrice(id: number) {
    const stock = await db.StockQuote.findByPk(id);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }

    const currentPrice = Number(stock.current_price || stock.close_price || 100);
    const changePercent = (Math.random() * 4 - 2) / 100;
    const newPrice = Number((currentPrice * (1 + changePercent)).toFixed(4));
    const changeAmount = Number((newPrice - currentPrice).toFixed(4));
    const changeRate = Number(((newPrice - currentPrice) / currentPrice * 100).toFixed(4));

    await db.StockQuote.update(
      {
        current_price: newPrice,
        change_amount: changeAmount,
        change_rate: changeRate,
        updated_at: new Date(),
      },
      { where: { id } }
    );

    await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);

    return db.StockQuote.findByPk(id);
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
