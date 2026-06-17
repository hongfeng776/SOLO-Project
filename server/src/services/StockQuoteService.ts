import { Op } from 'sequelize';
import stockQuoteDAO from '@dao/StockQuoteDAO';
import stockQuoteHistoryDAO from '@dao/StockQuoteHistoryDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';
import { StockStatus } from '@enums/index';

const LIST_CACHE_TTL = 10;
const DETAIL_CACHE_TTL = 5;
const LIST_CACHE_PREFIX = 'stock:quote:list:';
const DETAIL_CACHE_PREFIX = 'stock:quote:id:';

type StockListResult = { list: any[]; total: number; page: number; pageSize: number };

class StockQuoteService {
  validateStockCode(stockCode: string, market?: string) {
    if (!stockCode) {
      throw new AppError(400, '股票代码格式错误');
    }

    const trimmedCode = stockCode.trim().toUpperCase();

    const shA = /^(600|601|603|605)\d{3}$/;
    const szA = /^(000|001|002|003)\d{3}$/;
    const cyb = /^(300|301)\d{3}$/;
    const kcb = /^688\d{3}$/;
    const hk = /^\d{5}$/;
    const us = /^[A-Z]{1,5}$/;

    if (shA.test(trimmedCode)) {
      return { valid: true, format: '沪市A股', market: market || 'SH' };
    }
    if (szA.test(trimmedCode)) {
      return { valid: true, format: '深市A股', market: market || 'SZ' };
    }
    if (cyb.test(trimmedCode)) {
      return { valid: true, format: '创业板', market: market || 'SZ' };
    }
    if (kcb.test(trimmedCode)) {
      return { valid: true, format: '科创板', market: market || 'SH' };
    }
    if (hk.test(trimmedCode)) {
      return { valid: true, format: '港股', market: market || 'HK' };
    }
    if (us.test(trimmedCode)) {
      return { valid: true, format: '美股', market: market || 'US' };
    }

    throw new AppError(400, '股票代码格式错误');
  }

  checkTradingSession() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const morningStart = 9 * 60 + 30;
    const morningEnd = 11 * 60 + 30;
    const afternoonStart = 13 * 60;
    const afternoonEnd = 15 * 60;

    let currentPeriod = '非交易时段';
    let inSession = false;

    if (!isWeekend) {
      if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
        currentPeriod = '上午盘';
        inSession = true;
      } else if (currentMinutes >= afternoonStart && currentMinutes < afternoonEnd) {
        currentPeriod = '下午盘';
        inSession = true;
      } else if (currentMinutes < morningStart) {
        currentPeriod = '盘前';
      } else if (currentMinutes >= morningEnd && currentMinutes < afternoonStart) {
        currentPeriod = '午间休市';
      } else {
        currentPeriod = '盘后';
      }
    }

    let nextSessionAt: string;
    if (isWeekend) {
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 2;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 30, 0, 0);
      nextSessionAt = nextMonday.toISOString();
    } else if (currentMinutes < morningStart) {
      const todayMorning = new Date(now);
      todayMorning.setHours(9, 30, 0, 0);
      nextSessionAt = todayMorning.toISOString();
    } else if (currentMinutes >= morningEnd && currentMinutes < afternoonStart) {
      const todayAfternoon = new Date(now);
      todayAfternoon.setHours(13, 0, 0, 0);
      nextSessionAt = todayAfternoon.toISOString();
    } else {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowDay = tomorrow.getDay();
      if (tomorrowDay === 0 || tomorrowDay === 6) {
        const daysUntilMonday = tomorrowDay === 0 ? 1 : 2;
        tomorrow.setDate(tomorrow.getDate() + daysUntilMonday);
      }
      tomorrow.setHours(9, 30, 0, 0);
      nextSessionAt = tomorrow.toISOString();
    }

    const isHoliday = false;

    return {
      inSession,
      currentPeriod,
      nextSessionAt,
      isWeekend,
      isHoliday,
    };
  }

  checkDataSourceStatus() {
    const sourceNames = ['sina', 'tencent', 'eastmoney'];
    const sources: Array<{ name: string; status: string; latencyMs: number }> = [];
    let healthyCount = 0;

    for (let i = 0; i < sourceNames.length; i++) {
      const name = sourceNames[i];
      const rand = Math.random();
      let status: 'online' | 'offline' | 'degraded';
      let latencyMs: number;

      if (i === 0) {
        status = 'online';
        latencyMs = Math.floor(Math.random() * 100) + 10;
        healthyCount++;
      } else {
        if (rand < 0.6) {
          status = 'online';
          healthyCount++;
          latencyMs = Math.floor(Math.random() * 100) + 10;
        } else if (rand < 0.9) {
          status = 'degraded';
          latencyMs = Math.floor(Math.random() * 300) + 150;
        } else {
          status = 'offline';
          latencyMs = 0;
        }
      }

      sources.push({ name, status, latencyMs });
    }

    let overallStatus: string;
    if (healthyCount === sourceNames.length) {
      overallStatus = 'healthy';
    } else if (healthyCount >= 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'down';
    }

    return {
      sources,
      overallStatus,
      healthyCount,
      totalCount: sourceNames.length,
    };
  }

  async getStockList(params: {
    page: number;
    pageSize: number;
    market?: string;
    keyword?: string;
    tradeDate?: string;
    sector?: string;
    status?: string;
    changeRateMin?: number;
    changeRateMax?: number;
    volumeMin?: number;
    volumeMax?: number;
    sortBy?: string;
    sortOrder?: string;
    _highPrecision?: boolean;
  }): Promise<StockListResult> {
    const {
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
      _highPrecision = false,
    } = params;

    const filters = {
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
    };
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

      if (sector) {
        where.sector = sector;
      }

      if (status) {
        where.status = status;
      }

      if (changeRateMin !== undefined || changeRateMax !== undefined) {
        where.change_rate = {} as any;
        if (changeRateMin !== undefined) {
          where.change_rate[Op.gte] = changeRateMin;
        }
        if (changeRateMax !== undefined) {
          where.change_rate[Op.lte] = changeRateMax;
        }
      }

      if (volumeMin !== undefined || volumeMax !== undefined) {
        where.volume = {} as any;
        if (volumeMin !== undefined) {
          where.volume[Op.gte] = volumeMin;
        }
        if (volumeMax !== undefined) {
          where.volume[Op.lte] = volumeMax;
        }
      }

      let order: Array<[string, string]> = [['created_at', 'DESC']];
      if (sortBy) {
        const validSortFields = ['currentPrice', 'changeRate', 'volume', 'turnover'];
        const sortField = validSortFields.includes(sortBy)
          ? sortBy.replace(/([A-Z])/g, '_$1').toLowerCase()
          : null;
        if (sortField) {
          const validOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
          order = [[sortField, validOrder]];
        }
      }

      const { rows, count } = await db.StockQuote.findAndCountAll({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order,
      });

      const precision = _highPrecision ? 4 : 2;
      const listWithRank = rows.map((row, index) => {
        const data = row.toJSON() as any;
        data.rank = (page - 1) * pageSize + index + 1;
        if (data.current_price != null) {
          data.current_price = Number(Number(data.current_price).toFixed(precision));
        }
        if (data.change_amount != null) {
          data.change_amount = Number(Number(data.change_amount).toFixed(precision));
        }
        if (data.change_rate != null) {
          data.change_rate = Number(Number(data.change_rate).toFixed(precision));
        }
        if (data.open_price != null) {
          data.open_price = Number(Number(data.open_price).toFixed(precision));
        }
        if (data.close_price != null) {
          data.close_price = Number(Number(data.close_price).toFixed(precision));
        }
        if (data.high_price != null) {
          data.high_price = Number(Number(data.high_price).toFixed(precision));
        }
        if (data.low_price != null) {
          data.low_price = Number(Number(data.low_price).toFixed(precision));
        }
        return data;
      });

      return { list: listWithRank, total: count, page, pageSize };
    });
  }

  async getStockHistory(stockId: number, days: number = 30) {
    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }

    let historyList = await stockQuoteHistoryDAO.findByStockId(stockId, days);

    if (historyList.length === 0) {
      const mockData = this.generateMockHistory(stock, days);
      await db.StockQuoteHistory.bulkCreate(mockData as any);
      historyList = await stockQuoteHistoryDAO.findByStockId(stockId, days);
    }

    const stats = await stockQuoteHistoryDAO.findHistoryStats(stockId, days);

    return {
      list: historyList,
      stats: {
        peakPrice: stats.peakPrice,
        valleyPrice: stats.valleyPrice,
        avgPrice: stats.avgPrice,
        avgVolume: stats.avgVolume,
        maxChangeRate: stats.maxChangeRate,
      },
    };
  }

  private generateMockHistory(stock: any, days: number): any[] {
    const result: any[] = [];
    let basePrice = Number(stock.close_price || stock.current_price || 100);
    const baseVolume = Number(stock.volume || 10000000);

    for (let i = days; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      const dateStr = date.toISOString().split('T')[0];

      const changePercent = (Math.random() * 6 - 3) / 100;
      const open = basePrice * (1 + (Math.random() * 1 - 0.5) / 100);
      const close = basePrice * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * 1.5 / 100);
      const low = Math.min(open, close) * (1 - Math.random() * 1.5 / 100);
      const volume = Math.floor(baseVolume * (0.7 + Math.random() * 0.6));
      const turnover = volume * ((open + close) / 2);

      result.push({
        stock_id: stock.id,
        stock_code: stock.stock_code,
        stock_name: stock.stock_name,
        trade_date: dateStr,
        open_price: Number(open.toFixed(2)),
        close_price: Number(close.toFixed(2)),
        high_price: Number(high.toFixed(2)),
        low_price: Number(low.toFixed(2)),
        current_price: Number(close.toFixed(2)),
        change_amount: Number((close - basePrice).toFixed(2)),
        change_rate: Number(((close - basePrice) / basePrice * 100).toFixed(4)),
        volume,
        turnover: Number(turnover.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
      });

      basePrice = close;
    }

    return result;
  }

  async validateQuoteData(quoteData: any[]) {
    const issues: string[] = [];
    let deduped = true;
    let timestampValid = true;

    const seen = new Set<string>();
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    for (let i = 0; i < quoteData.length; i++) {
      const item = quoteData[i];
      const index = i + 1;

      const dedupKey = `${item.stock_id}_${item.trade_date}`;
      if (seen.has(dedupKey)) {
        issues.push(`第${index}条数据重复: stock_id=${item.stock_id}, trade_date=${item.trade_date}`);
        deduped = false;
      }
      seen.add(dedupKey);

      if (item.last_sync_at) {
        const syncAt = new Date(item.last_sync_at);
        if (syncAt < thirtyMinutesAgo) {
          issues.push(`第${index}条数据同步时间过早: last_sync_at=${item.last_sync_at}`);
          timestampValid = false;
        }
      }

      if (item.change_rate != null) {
        const rate = Number(item.change_rate);
        if (rate < -20 || rate > 20) {
          issues.push(`第${index}条数据涨跌幅超出范围: change_rate=${item.change_rate}`);
        }
      }

      const priceFields = ['current_price', 'open_price', 'close_price', 'high_price', 'low_price'];
      for (const field of priceFields) {
        if (item[field] != null && Number(item[field]) <= 0) {
          issues.push(`第${index}条数据${field}必须大于0: ${item[field]}`);
        }
      }

      if (item.volume != null && Number(item.volume) < 0) {
        issues.push(`第${index}条数据成交量不能为负: volume=${item.volume}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      deduped,
      timestampValid,
    };
  }

  async refreshAllPrices() {
    const allStocks = await db.StockQuote.findAll({
      where: { status: StockStatus.TRADING },
    });

    let refreshedCount = 0;
    const updatePromises = allStocks.map(async (stock) => {
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
          last_sync_at: new Date(),
          updated_at: new Date(),
        },
        { where: { id: stock.id } }
      );
      refreshedCount++;
    });

    await Promise.all(updatePromises);

    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    await CacheUtil.delByPattern(`${DETAIL_CACHE_PREFIX}*`);

    return refreshedCount;
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
        last_sync_at: new Date(),
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

  async batchDelete(ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new AppError(400, '请提供要删除的ID列表');
    }
    const result = await db.StockQuote.destroy({ where: { id: { [Op.in]: ids } } });
    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);
    for (const id of ids) {
      await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${id}`);
    }
    return result;
  }
}

export default new StockQuoteService();
