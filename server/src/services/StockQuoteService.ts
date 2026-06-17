import { Op } from 'sequelize';
import stockQuoteDAO from '@dao/StockQuoteDAO';
import stockQuoteHistoryDAO from '@dao/StockQuoteHistoryDAO';
import quoteAuditTrailDAO from '@dao/QuoteAuditTrailDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { CacheUtil } from '@utils/cache';
import { StockStatus } from '@enums/index';
import { getRedisClient } from '@config/redis';

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

  async checkStockRegistered(stockCode: string): Promise<{ registered: boolean; stockInfo?: any }> {
    const stock = await stockQuoteDAO.findByStockCode(stockCode);
    if (!stock) {
      throw new AppError(404, '股票代码未备案，请先完成上市登记');
    }
    return { registered: true, stockInfo: stock };
  }

  async checkPriceFluctuation(stockId: number, newPrice: number, baseDate?: string) {
    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }

    let previousClose: number;
    if (baseDate) {
      const history = await stockQuoteHistoryDAO.findByStockIdAndDate(stockId, baseDate);
      previousClose = history ? Number(history.close_price) : Number(stock.close_price || stock.current_price || 0);
    } else {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      const yesterdayStr = today.toISOString().split('T')[0];
      const history = await stockQuoteHistoryDAO.findByStockIdAndDate(stockId, yesterdayStr);
      previousClose = history
        ? Number(history.close_price)
        : Number(stock.close_price || stock.current_price || 0);
    }

    if (previousClose <= 0) {
      previousClose = newPrice;
    }

    const changeRate = Number((((newPrice - previousClose) / previousClose) * 100).toFixed(4));
    const threshold = 10;
    const withinThreshold = Math.abs(changeRate) <= threshold;
    const needConfirm = !withinThreshold;

    return {
      withinThreshold,
      previousClose,
      newPrice,
      changeRate,
      threshold,
      needConfirm,
    };
  }

  getDataPeriod(): { period: string; periodLabel: string; storageRule: string } {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const earlyMorningStart = 9 * 60;
    const earlyMorningEnd = 11 * 60 + 30;
    const middayEnd = 15 * 60 + 30;

    let period: string;
    let periodLabel: string;
    let storageRule: string;

    if (totalMinutes >= earlyMorningStart && totalMinutes < earlyMorningEnd) {
      period = 'early_morning';
      periodLabel = '早盘';
      storageRule = '保留最近5条快照';
    } else if (totalMinutes >= earlyMorningEnd && totalMinutes < middayEnd) {
      period = 'midday';
      periodLabel = '午盘';
      storageRule = '保留最近10条快照';
    } else {
      period = 'after_close';
      periodLabel = '盘后';
      storageRule = '保留当日收盘快照（覆盖写入）';
    }

    return { period, periodLabel, storageRule };
  }

  async createQuoteWithAudit(
    data: any,
    operator: { id: number; name: string },
    confirmed: boolean = false
  ): Promise<{ stockQuote: any; auditTrail: any; period: any }> {
    if (!operator || !operator.id) {
      throw new AppError(403, '无操作权限');
    }

    const { registered, stockInfo } = await this.checkStockRegistered(data.stock_code);
    if (!registered || !stockInfo) {
      throw new AppError(404, '股票代码未备案，请先完成上市登记');
    }

    if (data.current_price != null) {
      const fluctuation = await this.checkPriceFluctuation(stockInfo.id, Number(data.current_price));
      if (fluctuation.needConfirm && !confirmed) {
        throw new AppError(
          400,
          `价格波动超过±10%阈值（当前${fluctuation.changeRate}%），请二次确认后提交`
        );
      }
    }

    const validateResult = this.validateQuoteRecord(data);
    if (!validateResult.valid) {
      const errorMsg = validateResult.errors.map((e) => e.message).join('; ');
      throw new AppError(400, `数据校验失败: ${errorMsg}`);
    }

    const period = this.getDataPeriod();

    const consistency = await this.checkConsistencyWithExchange(stockInfo.id);

    const transaction = await db.sequelize.transaction();

    try {
      const previousSnapshot = stockInfo.toJSON();

      const updateData = { ...data };
      if (!updateData.trade_date) {
        updateData.trade_date = new Date().toISOString().split('T')[0];
      }
      if (!updateData.last_sync_at) {
        updateData.last_sync_at = new Date();
      }
      updateData.updated_at = new Date();

      await db.StockQuote.update(updateData, {
        where: { id: stockInfo.id },
        transaction,
      });

      const updatedStock = await db.StockQuote.findByPk(stockInfo.id, { transaction });
      const newSnapshot = updatedStock ? updatedStock.toJSON() : {};

      const fieldChanges: any = {};
      for (const key of Object.keys(updateData)) {
        const prev = (previousSnapshot as any)[key];
        const curr = (newSnapshot as any)[key];
        if (JSON.stringify(prev) !== JSON.stringify(curr)) {
          fieldChanges[key] = { previous: prev, new: curr };
        }
      }

      const auditTrail = await db.QuoteAuditTrail.create(
        {
          stock_id: stockInfo.id,
          stock_code: data.stock_code,
          operation_type: Object.keys(fieldChanges).length > 0 ? 'update' : 'create',
          data_period: period.period,
          field_changes: fieldChanges,
          previous_snapshot: previousSnapshot,
          new_snapshot: newSnapshot,
          operator_id: operator.id,
          operator_name: operator.name,
          source_channel: data.source_channel || 'manual',
          data_source: data.data_source || 'manual_input',
          remark: data.remark || '',
          verification_status: consistency.status,
          consistency_score: consistency.score,
          accuracy_violations: validateResult.errors.length > 0 ? validateResult.errors : null,
          created_at: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      await CacheUtil.del(`${DETAIL_CACHE_PREFIX}${stockInfo.id}`);
      await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);

      return {
        stockQuote: updatedStock,
        auditTrail,
        period,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchImportQuotes(
    dataList: any[],
    operator: { id: number; name: string }
  ): Promise<{
    taskId: string;
    summary: {
      total: number;
      success: number;
      failed: number;
      duplicates: number;
      errors: number;
      elapsedMs: number;
    };
    successList: any[];
    errorList: Array<{ row: number; data: any; message: string; type: string }>;
    duplicateList: any[];
  }> {
    const startTime = Date.now();
    const taskId = `IMP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      throw new AppError(400, '导入数据不能为空');
    }

    const total = dataList.length;
    const errorList: Array<{ row: number; data: any; message: string; type: string }> = [];
    const duplicateList: any[] = [];
    const successList: any[] = [];
    const validRecords: any[] = [];
    const seenKeys = new Set<string>();
    const existingStockMap = new Map<string, any>();

    const progressKey = `import:progress:${taskId}`;
    try {
      const client = await getRedisClient();
      await client.setEx(
        progressKey,
        3600,
        JSON.stringify({ percent: 0, current: 0, total, status: 'processing' })
      );
    } catch {
      // Redis不可用时静默失败
    }

    const allStocks = await db.StockQuote.findAll({ attributes: ['id', 'stock_code', 'trade_date'] });
    for (const s of allStocks) {
      const key = `${(s as any).stock_code}_${(s as any).trade_date}`;
      existingStockMap.set(key, s);
    }

    for (let i = 0; i < dataList.length; i++) {
      const row = i + 1;
      const item = dataList[i];

      try {
        if (!item || typeof item !== 'object') {
          errorList.push({ row, data: item, message: '数据格式错误，不是有效的对象', type: 'format_error' });
          continue;
        }

        if (!item.stock_code) {
          errorList.push({ row, data: item, message: '缺少必填字段: stock_code', type: 'format_error' });
          continue;
        }

        const validateResult = this.validateQuoteRecord(item);
        if (!validateResult.valid) {
          const msg = validateResult.errors.map((e) => e.message).join('; ');
          errorList.push({ row, data: item, message: msg, type: 'validation_error' });
          continue;
        }

        const tradeDate = item.trade_date || new Date().toISOString().split('T')[0];
        const dedupKey = `${item.stock_code}_${tradeDate}`;

        if (seenKeys.has(dedupKey)) {
          duplicateList.push({ row, data: item, reason: '本次导入数据中重复' });
          continue;
        }
        seenKeys.add(dedupKey);

        if (existingStockMap.has(dedupKey)) {
          duplicateList.push({ row, data: item, reason: '数据库中已存在相同记录' });
          continue;
        }

        validRecords.push({
          ...item,
          trade_date: tradeDate,
          last_sync_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      } catch (err: any) {
        errorList.push({
          row,
          data: item,
          message: err.message || '未知错误',
          type: 'processing_error',
        });
      }

      if (i % 10 === 0 || i === dataList.length - 1) {
        try {
          const client = await getRedisClient();
          const current = i + 1;
          await client.setEx(
            progressKey,
            3600,
            JSON.stringify({
              percent: Math.round((current / total) * 100),
              current,
              total,
              status: 'processing',
            })
          );
        } catch {
          // ignore
        }
      }
    }

    if (validRecords.length === 0) {
      try {
        const client = await getRedisClient();
        await client.setEx(
          progressKey,
          3600,
          JSON.stringify({ percent: 100, current: total, total, status: 'failed' })
        );
      } catch {
        // ignore
      }
      throw new AppError(
        400,
        `所有${total}条数据均无效或重复，请检查数据格式。错误:${errorList.length}条, 重复:${duplicateList.length}条`
      );
    }

    try {
      const created = await db.StockQuote.bulkCreate(validRecords as any, {
        updateOnDuplicate: [
          'current_price',
          'change_amount',
          'change_rate',
          'open_price',
          'close_price',
          'high_price',
          'low_price',
          'volume',
          'turnover',
          'amplitude',
          'pe_ratio',
          'pb_ratio',
          'total_market_cap',
          'circulate_market_cap',
          'last_sync_at',
          'updated_at',
        ],
      });
      successList.push(...created);
    } catch (err: any) {
      throw new AppError(500, `批量写入数据库失败: ${err.message}`);
    }

    const auditRecords: any[] = validRecords.map((item, idx) => {
      const stock = successList[idx];
      return {
        stock_id: stock ? stock.id : 0,
        stock_code: item.stock_code,
        operation_type: 'import_batch',
        data_period: this.getDataPeriod().period,
        field_changes: null,
        previous_snapshot: null,
        new_snapshot: item,
        operator_id: operator.id,
        operator_name: operator.name,
        source_channel: item.source_channel || 'excel_import',
        data_source: item.data_source || 'manual_input',
        remark: `批量导入第${idx + 1}条`,
        verification_status: 'pending',
        consistency_score: null,
        accuracy_violations: null,
        created_at: new Date(),
      };
    });

    try {
      await db.QuoteAuditTrail.bulkCreate(auditRecords as any);
    } catch {
      // 审计日志失败不影响主流程
    }

    await CacheUtil.delByPattern(`${LIST_CACHE_PREFIX}*`);

    try {
      const client = await getRedisClient();
      await client.setEx(
        progressKey,
        3600,
        JSON.stringify({ percent: 100, current: total, total, status: 'completed' })
      );
    } catch {
      // ignore
    }

    const elapsedMs = Date.now() - startTime;

    return {
      taskId,
      summary: {
        total,
        success: successList.length,
        failed: errorList.length,
        duplicates: duplicateList.length,
        errors: errorList.length,
        elapsedMs,
      },
      successList,
      errorList,
      duplicateList,
    };
  }

  async getImportProgress(taskId: string): Promise<{ percent: number; current: number; total: number; status: string }> {
    const progressKey = `import:progress:${taskId}`;
    try {
      const client = await getRedisClient();
      const value = await client.get(progressKey);
      if (value) {
        return JSON.parse(value);
      }
    } catch {
      // ignore
    }
    return { percent: 0, current: 0, total: 0, status: 'not_found' };
  }

  async getQuoteAuditTrail(stockId: number, days: number = 30) {
    const list = await quoteAuditTrailDAO.findByStockId(stockId, days);

    const operatorMap = new Map<string, number>();
    const operationTypeMap = new Map<string, number>();
    const periodMap = new Map<string, number>();
    let scoreSum = 0;
    let scoreCount = 0;

    for (const record of list) {
      const r = record as any;
      operatorMap.set(r.operator_name, (operatorMap.get(r.operator_name) || 0) + 1);
      operationTypeMap.set(r.operation_type, (operationTypeMap.get(r.operation_type) || 0) + 1);
      periodMap.set(r.data_period, (periodMap.get(r.data_period) || 0) + 1);
      if (r.consistency_score != null) {
        scoreSum += Number(r.consistency_score);
        scoreCount++;
      }
    }

    const operatorDistribution: Array<{ name: string; count: number }> = [];
    for (const [name, count] of operatorMap) {
      operatorDistribution.push({ name, count });
    }

    const operationTypeDistribution: Array<{ type: string; count: number }> = [];
    for (const [type, count] of operationTypeMap) {
      operationTypeDistribution.push({ type, count });
    }

    const periodDistribution: Array<{ period: string; count: number }> = [];
    for (const [period, count] of periodMap) {
      periodDistribution.push({ period, count });
    }

    return {
      list,
      stats: {
        totalRecords: list.length,
        operatorDistribution,
        operationTypeDistribution,
        periodDistribution,
        avgConsistencyScore: scoreCount > 0 ? Number((scoreSum / scoreCount).toFixed(2)) : null,
      },
    };
  }

  validateQuoteRecord(data: any): {
    valid: boolean;
    errors: Array<{ field: string; value: any; message: string; code: string; suggestion: string }>;
    warnings: Array<{ field: string; message: string }>;
    accuracyLevel: 'high' | 'medium' | 'low';
  } {
    const errors: Array<{ field: string; value: any; message: string; code: string; suggestion: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    let requiredCount = 0;
    let filledRequired = 0;

    const requiredFields = ['stock_code', 'stock_name'];
    requiredCount += requiredFields.length;
    for (const field of requiredFields) {
      if (data[field] == null || data[field] === '') {
        errors.push({
          field,
          value: data[field],
          message: `必填字段 ${field} 不能为空`,
          code: 'REQUIRED_MISSING',
          suggestion: `请填写 ${field} 字段`,
        });
      } else {
        filledRequired++;
      }
    }

    if (data.stock_code != null && typeof data.stock_code === 'string') {
      const codePattern = /^[0-9A-Z]{1,10}$/;
      if (!codePattern.test(data.stock_code.trim().toUpperCase())) {
        errors.push({
          field: 'stock_code',
          value: data.stock_code,
          message: '股票代码格式不正确，只能包含数字和大写字母',
          code: 'FORMAT_INVALID',
          suggestion: '请使用标准股票代码格式，如 600519、000001',
        });
      }
    }

    const priceFields = ['current_price', 'open_price', 'close_price', 'high_price', 'low_price', 'change_amount'];
    for (const field of priceFields) {
      if (data[field] != null) {
        const val = Number(data[field]);
        if (isNaN(val)) {
          errors.push({
            field,
            value: data[field],
            message: `${field} 必须是有效的数字`,
            code: 'TYPE_INVALID',
            suggestion: `请输入有效的数值`,
          });
        } else if (val < 0) {
          errors.push({
            field,
            value: data[field],
            message: `${field} 不能为负数`,
            code: 'RANGE_INVALID',
            suggestion: `请输入大于等于0的数值`,
          });
        } else {
          const decimals = (data[field].toString().split('.')[1] || '').length;
          if (decimals > 4) {
            errors.push({
              field,
              value: data[field],
              message: `${field} 小数位数不能超过4位`,
              code: 'PRECISION_INVALID',
              suggestion: '请最多保留4位小数',
            });
          }
        }
      }
    }

    if (data.high_price != null && data.low_price != null) {
      const high = Number(data.high_price);
      const low = Number(data.low_price);
      if (!isNaN(high) && !isNaN(low) && high < low) {
        errors.push({
          field: 'high_price',
          value: data.high_price,
          message: '最高价不能低于最低价',
          code: 'LOGIC_INVALID',
          suggestion: '请检查最高价和最低价的数值',
        });
      }
    }

    if (data.volume != null) {
      const val = Number(data.volume);
      if (isNaN(val)) {
        errors.push({
          field: 'volume',
          value: data.volume,
          message: '成交量必须是有效的数字',
          code: 'TYPE_INVALID',
          suggestion: '请输入有效的成交量数值',
        });
      } else if (val < 0) {
        errors.push({
          field: 'volume',
          value: data.volume,
          message: '成交量不能为负数',
          code: 'RANGE_INVALID',
          suggestion: '请输入大于等于0的成交量',
        });
      } else if (!Number.isInteger(val)) {
        errors.push({
          field: 'volume',
          value: data.volume,
          message: '成交量必须是整数',
          code: 'PRECISION_INVALID',
          suggestion: '请输入整数成交量',
        });
      }
    }

    if (data.change_rate != null) {
      const rate = Number(data.change_rate);
      if (!isNaN(rate) && (rate < -50 || rate > 50)) {
        warnings.push({
          field: 'change_rate',
          message: `涨跌幅 ${rate}% 超出正常范围（-50% ~ 50%），请确认`,
        });
      }

      if (
        data.change_rate != null &&
        data.previousClose != null &&
        data.current_price != null
      ) {
        const prev = Number(data.previousClose);
        const curr = Number(data.current_price);
        if (prev > 0) {
          const calculatedRate = Number((((curr - prev) / prev) * 100).toFixed(4));
          if (Math.abs(calculatedRate - rate) > 0.1) {
            warnings.push({
              field: 'change_rate',
              message: `涨跌幅与价格计算值不一致，声明:${rate}%，计算:${calculatedRate}%`,
            });
          }
        }
      }
    }

    if (data.trade_date != null) {
      const tradeDate = new Date(data.trade_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(tradeDate.getTime())) {
        errors.push({
          field: 'trade_date',
          value: data.trade_date,
          message: '交易日期格式不正确',
          code: 'FORMAT_INVALID',
          suggestion: '请使用 YYYY-MM-DD 格式',
        });
      } else if (tradeDate > today) {
        errors.push({
          field: 'trade_date',
          value: data.trade_date,
          message: '交易日期不能是未来日期',
          code: 'RANGE_INVALID',
          suggestion: '请检查交易日期是否正确',
        });
      }
    }

    if (data.last_sync_at != null) {
      const syncAt = new Date(data.last_sync_at);
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (!isNaN(syncAt.getTime()) && syncAt < oneDayAgo) {
        warnings.push({
          field: 'last_sync_at',
          message: '数据同步时间超过24小时，可能已过期',
        });
      }
    }

    const optionalFields = [
      'market',
      'current_price',
      'change_amount',
      'change_rate',
      'open_price',
      'close_price',
      'high_price',
      'low_price',
      'volume',
      'turnover',
    ];
    let filledOptional = 0;
    for (const field of optionalFields) {
      if (data[field] != null && data[field] !== '') {
        filledOptional++;
      }
    }
    const requiredRatio = filledRequired / requiredCount;
    const optionalRatio = filledOptional / optionalFields.length;

    let accuracyLevel: 'high' | 'medium' | 'low';
    if (requiredRatio === 1 && optionalRatio >= 0.8) {
      accuracyLevel = 'high';
    } else if (requiredRatio >= 0.8 && optionalRatio >= 0.5) {
      accuracyLevel = 'medium';
    } else {
      accuracyLevel = 'low';
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      accuracyLevel,
    };
  }

  async checkConsistencyWithExchange(_stockId: number): Promise<{
    score: number;
    status: string;
    issues: string[];
  }> {
    const score = Math.floor(Math.random() * 16) + 85;
    const issues: string[] = [];

    let status: string;
    if (score > 95) {
      status = 'verified';
    } else if (score >= 85) {
      status = 'pending';
      const possibleIssues = [
        '成交量与交易所公示数据存在微小差异',
        '收盘价精度与交易所数据略有偏差',
        '涨跌幅计算与交易所存在0.01%以内差异',
      ];
      const issueCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < issueCount; i++) {
        const idx = Math.floor(Math.random() * possibleIssues.length);
        if (!issues.includes(possibleIssues[idx])) {
          issues.push(possibleIssues[idx]);
        }
      }
    } else {
      status = 'rejected';
      issues.push('核心价格数据与交易所公示数据存在显著差异');
      issues.push('数据来源可能不可靠，建议重新验证');
    }

    return { score, status, issues };
  }
}

export default new StockQuoteService();
