import { Op, InferCreationAttributes } from 'sequelize';
import replaySessionDAO from '@dao/ReplaySessionDAO';
import replayConclusionDAO from '@dao/ReplayConclusionDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import StockQuoteService from './StockQuoteService';
import StockQuoteHistory from '../models/StockQuoteHistory';
import StockQuote from '../models/StockQuote';
import ReplaySession from '../models/ReplaySession';
import ReplayConclusion from '../models/ReplayConclusion';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface PeriodSegment {
  label: string;
  start: string;
  end: string;
  count: number;
  avgChangeRate: number;
}

interface HistoryRecordWithStatus {
  id: number;
  stock_id: number;
  stock_code: string;
  stock_name: string;
  trade_date: string;
  open_price: number | null;
  close_price: number | null;
  high_price: number | null;
  low_price: number | null;
  current_price: number | null;
  change_amount: number | null;
  change_rate: number | null;
  volume: number | null;
  turnover: number | null;
  status: 'normal' | 'abnormal' | 'suspended';
}

interface VolatilityStats {
  avgChangeRate: number;
  volatilityIndex: number;
  maxDrawdown: number;
}

interface CompletenessResult {
  score: number;
  missingDates: string[];
  isComplete: boolean;
}

interface VolatilityPatternResult {
  pattern: string;
  similarity: number;
  referencePeriod: string;
}

interface SectorComparisonItem {
  stockCode: string;
  stockName: string;
  avgChangeRate: number;
  volatilityIndex: number;
  rank: number;
}

function computeStddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getQuarterRange(year: number, quarter: number): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

function countWeekdays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toPlain<T extends { toJSON(): unknown }>(model: T): Record<string, unknown> {
  return model.toJSON() as Record<string, unknown>;
}

class ReplayService {
  async validateReplayPermission(userId: number): Promise<boolean> {
    const userRoles = await db.UserRole.findAll({
      where: { user_id: userId },
      attributes: ['role_id'],
    });

    if (userRoles.length === 0) return false;

    const permission = await db.Permission.findOne({
      where: { perm_code: 'stock:replay:view' },
      attributes: ['id'],
    });

    if (!permission) return false;

    const roleIds = userRoles.map((ur) => ur.role_id);

    const rolePerm = await db.RolePermission.findOne({
      where: {
        role_id: { [Op.in]: roleIds },
        perm_id: permission.id,
      },
    });

    return rolePerm !== null;
  }

  async validateTimeRange(startDate: string, endDate: string): Promise<ValidationResult> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minDate = new Date('2020-01-01');

    if (start >= end) {
      return { valid: false, message: '开始日期必须早于结束日期' };
    }

    if (start < minDate) {
      return { valid: false, message: '开始日期不能早于2020-01-01' };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      return { valid: false, message: '查询区间不能超过365天' };
    }

    return { valid: true };
  }

  async validateStockCode(stockCode: string): Promise<ValidationResult> {
    try {
      StockQuoteService.validateStockCode(stockCode);
      return { valid: true };
    } catch (err: unknown) {
      const message = err instanceof AppError ? err.message : '股票代码格式错误';
      return { valid: false, message };
    }
  }

  async queryHistoryData(params: {
    stockCode?: string;
    sector?: string;
    startDate: string;
    endDate: string;
    changeRateMin?: number;
    changeRateMax?: number;
    page: number;
    pageSize: number;
  }): Promise<{ list: HistoryRecordWithStatus[]; total: number; periodSegments: PeriodSegment[] }> {
    const { stockCode, sector, startDate, endDate, changeRateMin, changeRateMax, page, pageSize } = params;

    const where: Record<string, unknown> = {
      trade_date: { [Op.between]: [startDate, endDate] },
    };

    if (stockCode) {
      where.stock_code = stockCode;
    }

    if (sector) {
      const stocksInSector = await db.StockQuote.findAll({
        where: { sector },
        attributes: ['stock_code'],
      });
      const codes = stocksInSector.map((s) => s.stock_code);
      where.stock_code = { [Op.in]: codes };
    }

    if (changeRateMin !== undefined || changeRateMax !== undefined) {
      where.change_rate = { [Op.gte]: changeRateMin, [Op.lte]: changeRateMax };
    }

    const { rows, count } = await db.StockQuoteHistory.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['trade_date', 'DESC']],
    });

    const list: HistoryRecordWithStatus[] = rows.map((row: StockQuoteHistory) => {
      const data = toPlain(row);
      const rate = data.change_rate != null ? Number(data.change_rate) : 0;
      const volume = data.volume != null ? Number(data.volume) : 0;
      const closePrice = data.close_price;

      let computedStatus: 'normal' | 'abnormal' | 'suspended';
      if (volume === 0 || closePrice === null) {
        computedStatus = 'suspended';
      } else if (Math.abs(rate) >= 5) {
        computedStatus = 'abnormal';
      } else {
        computedStatus = 'normal';
      }

      return {
        id: data.id as number,
        stock_id: data.stock_id as number,
        stock_code: data.stock_code as string,
        stock_name: data.stock_name as string,
        trade_date: data.trade_date as string,
        open_price: data.open_price != null ? Number(data.open_price) : null,
        close_price: data.close_price != null ? Number(data.close_price) : null,
        high_price: data.high_price != null ? Number(data.high_price) : null,
        low_price: data.low_price != null ? Number(data.low_price) : null,
        current_price: data.current_price != null ? Number(data.current_price) : null,
        change_amount: data.change_amount != null ? Number(data.change_amount) : null,
        change_rate: data.change_rate != null ? Number(data.change_rate) : null,
        volume: data.volume != null ? Number(data.volume) : null,
        turnover: data.turnover != null ? Number(data.turnover) : null,
        status: computedStatus,
      };
    });

    const periodSegments: PeriodSegment[] = [];
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const diffDays = (endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      let curYear = startD.getFullYear();
      let curQuarter = Math.floor(startD.getMonth() / 3) + 1;
      const endYear = endD.getFullYear();
      const endQuarter = Math.floor(endD.getMonth() / 3) + 1;

      while (curYear < endYear || (curYear === endYear && curQuarter <= endQuarter)) {
        const { start: qStart, end: qEnd } = getQuarterRange(curYear, curQuarter);
        const effectiveStart = qStart > startDate ? qStart : startDate;
        const effectiveEnd = qEnd < endDate ? qEnd : endDate;

        const segmentWhere: Record<string, unknown> = {
          trade_date: { [Op.between]: [effectiveStart, effectiveEnd] },
        };
        if (stockCode) segmentWhere.stock_code = stockCode;

        const segmentRecords = await db.StockQuoteHistory.findAll({
          where: segmentWhere,
          attributes: ['change_rate'],
        });

        const validRates = segmentRecords
          .filter((r) => r.change_rate != null)
          .map((r) => Number(r.change_rate));

        const avgRate = validRates.length > 0
          ? Number((validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(4))
          : 0;

        periodSegments.push({
          label: `${curYear}Q${curQuarter}`,
          start: effectiveStart,
          end: effectiveEnd,
          count: segmentRecords.length,
          avgChangeRate: avgRate,
        });

        curQuarter++;
        if (curQuarter > 4) {
          curQuarter = 1;
          curYear++;
        }
      }
    }

    return { list, total: count, periodSegments };
  }

  async getReplayDetail(sessionId: number): Promise<{
    session: ReplaySession;
    conclusions: ReplayConclusion[];
    volatilityStats: VolatilityStats;
  }> {
    const sessionWithConclusions = await replaySessionDAO.findWithConclusions(sessionId);
    if (!sessionWithConclusions) {
      throw new AppError(404, '复盘会话不存在');
    }

    const sessionData = toPlain(sessionWithConclusions);
    const conclusions = (sessionData.conclusions as ReplayConclusion[]) || [];

    const historyRecords = await db.StockQuoteHistory.findAll({
      where: {
        trade_date: { [Op.between]: [sessionWithConclusions.start_date, sessionWithConclusions.end_date] },
      },
      attributes: ['change_rate', 'high_price', 'low_price', 'close_price'],
    });

    const validRates: number[] = [];
    const prices: number[] = [];
    let peakPrice = Number.NEGATIVE_INFINITY;
    let valleyPrice = Number.POSITIVE_INFINITY;

    for (const r of historyRecords) {
      const raw = toPlain(r);
      if (raw.change_rate != null) validRates.push(Number(raw.change_rate));
      if (raw.close_price != null) {
        prices.push(Number(raw.close_price));
      }
      if (raw.high_price != null) peakPrice = Math.max(peakPrice, Number(raw.high_price));
      if (raw.low_price != null) valleyPrice = Math.min(valleyPrice, Number(raw.low_price));
    }

    let maxDrawdown = 0;
    if (prices.length > 0) {
      let runningMax = prices[0];
      for (const price of prices) {
        if (price > runningMax) runningMax = price;
        const drawdown = (price - runningMax) / runningMax;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;
      }
    }

    const volatilityStats: VolatilityStats = {
      avgChangeRate: validRates.length > 0
        ? Number((validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(4))
        : 0,
      volatilityIndex: Number(computeStddev(validRates).toFixed(4)),
      maxDrawdown: Number((maxDrawdown * 100).toFixed(4)),
    };

    return { session: sessionWithConclusions, conclusions, volatilityStats };
  }

  async createReplaySession(
    data: {
      session_name: string;
      start_date: string;
      end_date: string;
      sector?: string;
      change_rate_min?: number;
      change_rate_max?: number;
      conclusion?: string;
    },
    operatorId: number,
  ): Promise<ReplaySession> {
    const expectedDays = countWeekdays(data.start_date, data.end_date);

    const historyCount = await db.StockQuoteHistory.count({
      where: {
        trade_date: { [Op.between]: [data.start_date, data.end_date] },
      },
    });

    const completenessScore = expectedDays > 0
      ? Math.min(Math.round((historyCount / expectedDays) * 100), 100)
      : 0;

    let status = 'normal';
    if (completenessScore < 50) {
      status = 'abnormal';
    } else if (completenessScore < 80) {
      status = 'suspended';
    }

    const session = await replaySessionDAO.create({
      session_name: data.session_name,
      start_date: data.start_date,
      end_date: data.end_date,
      sector: data.sector ?? null,
      change_rate_min: data.change_rate_min ?? null,
      change_rate_max: data.change_rate_max ?? null,
      status,
      completeness_score: completenessScore,
      conclusion: data.conclusion ?? null,
      created_by: operatorId,
    } as InferCreationAttributesFromReplaySession);

    return session;
  }

  async generateConclusion(sessionId: number): Promise<ReplayConclusion[]> {
    const session = await replaySessionDAO.findById(sessionId);
    if (!session) {
      throw new AppError(404, '复盘会话不存在');
    }

    const historyRecords = await db.StockQuoteHistory.findAll({
      where: {
        trade_date: { [Op.between]: [session.start_date, session.end_date] },
      },
    });

    const stockGroupMap = new Map<string, {
      stockCode: string;
      stockName: string;
      sector: string;
      rates: number[];
      normalDays: number;
      abnormalDays: number;
      suspendedDays: number;
      peakPrice: number;
      valleyPrice: number;
    }>();

    for (const r of historyRecords) {
      const raw = toPlain(r);
      const code = raw.stock_code as string;

      if (!stockGroupMap.has(code)) {
        const stock = await db.StockQuote.findOne({
          where: { stock_code: code },
          attributes: ['sector'],
        });
        stockGroupMap.set(code, {
          stockCode: code,
          stockName: raw.stock_name as string,
          sector: stock ? stock.sector || '' : '',
          rates: [],
          normalDays: 0,
          abnormalDays: 0,
          suspendedDays: 0,
          peakPrice: Number.NEGATIVE_INFINITY,
          valleyPrice: Number.POSITIVE_INFINITY,
        });
      }

      const group = stockGroupMap.get(code)!;
      const rate = raw.change_rate != null ? Number(raw.change_rate) : 0;
      const volume = raw.volume != null ? Number(raw.volume) : 0;
      const closePrice = raw.close_price;

      if (volume === 0 || closePrice === null) {
        group.suspendedDays++;
      } else if (Math.abs(rate) >= 5) {
        group.abnormalDays++;
        group.rates.push(rate);
      } else {
        group.normalDays++;
        group.rates.push(rate);
      }

      if (raw.high_price != null) {
        group.peakPrice = Math.max(group.peakPrice, Number(raw.high_price));
      }
      if (raw.low_price != null) {
        group.valleyPrice = Math.min(group.valleyPrice, Number(raw.low_price));
      }
    }

    const sectorStockMap = new Map<string, { totalRate: number; count: number }>();
    for (const [, group] of stockGroupMap) {
      if (group.sector && group.rates.length > 0) {
        const existing = sectorStockMap.get(group.sector);
        const avg = group.rates.reduce((a, b) => a + b, 0) / group.rates.length;
        if (existing) {
          existing.totalRate += avg;
          existing.count++;
        } else {
          sectorStockMap.set(group.sector, { totalRate: avg, count: 1 });
        }
      }
    }

    const conclusions: ReplayConclusion[] = [];

    for (const [, group] of stockGroupMap) {
      const volIndex = computeStddev(group.rates);
      const avgRate = group.rates.length > 0
        ? group.rates.reduce((a, b) => a + b, 0) / group.rates.length
        : 0;

      let comparisonScore = 50;
      const sectorAvg = group.sector ? sectorStockMap.get(group.sector) : null;
      if (sectorAvg && sectorAvg.count > 1) {
        const sectorAvgRate = sectorAvg.totalRate / sectorAvg.count;
        const diff = Math.abs(avgRate - sectorAvgRate);
        comparisonScore = Math.max(0, Math.min(100, Math.round(100 - diff * 10)));
      }

      const totalDays = group.normalDays + group.abnormalDays + group.suspendedDays;
      const normalRatio = totalDays > 0 ? group.normalDays / totalDays : 0;
      const abnormalRatio = totalDays > 0 ? group.abnormalDays / totalDays : 0;

      let trend: string;
      if (avgRate > 1) trend = '上涨趋势';
      else if (avgRate < -1) trend = '下跌趋势';
      else trend = '震荡整理';

      let conclusionText = `${group.stockName}(${group.stockCode})在复盘期间呈${trend}，`;
      conclusionText += `正常交易日${group.normalDays}天，异常波动${group.abnormalDays}天，停牌${group.suspendedDays}天，`;
      conclusionText += `波动率指数${volIndex.toFixed(2)}，与板块对比得分${comparisonScore}分。`;

      let suggestion: string;
      if (abnormalRatio > 0.3) {
        suggestion = '异常波动天数占比较高，建议密切关注该股票风险，谨慎操作';
      } else if (normalRatio > 0.8 && avgRate > 0) {
        suggestion = '走势稳健且偏强，可考虑适量持有';
      } else if (normalRatio > 0.8 && avgRate <= 0) {
        suggestion = '走势平稳但偏弱，建议观望';
      } else {
        suggestion = '波动适中，建议结合基本面综合判断';
      }

      const startD = new Date(session.start_date);
      const endD = new Date(session.end_date);
      const periodLabel = `${startD.getFullYear()}Q${Math.floor(startD.getMonth() / 3) + 1}-${endD.getFullYear()}Q${Math.floor(endD.getMonth() / 3) + 1}`;

      const conclusion = await replayConclusionDAO.create({
        session_id: sessionId,
        stock_code: group.stockCode,
        stock_name: group.stockName,
        sector: group.sector,
        period_label: periodLabel,
        normal_days: group.normalDays,
        abnormal_days: group.abnormalDays,
        suspended_days: group.suspendedDays,
        peak_price: group.peakPrice === Number.NEGATIVE_INFINITY ? null : group.peakPrice,
        valley_price: group.valleyPrice === Number.POSITIVE_INFINITY ? null : group.valleyPrice,
        avg_change_rate: Number(avgRate.toFixed(4)),
        volatility_index: Number(volIndex.toFixed(4)),
        comparison_score: comparisonScore,
        conclusion_text: conclusionText,
        suggestion,
      } as InferCreationAttributesFromReplayConclusion);

      conclusions.push(conclusion);
    }

    return conclusions;
  }

  async matchVolatilityPattern(
    stockCode: string,
    startDate: string,
    endDate: string,
  ): Promise<VolatilityPatternResult> {
    const records = await db.StockQuoteHistory.findAll({
      where: {
        stock_code: stockCode,
        trade_date: { [Op.between]: [startDate, endDate] },
      },
      order: [['trade_date', 'ASC']],
    });

    if (records.length === 0) {
      throw new AppError(404, '未找到该股票的历史数据');
    }

    const rates: number[] = [];
    const prices: number[] = [];
    for (const r of records) {
      const raw = toPlain(r);
      if (raw.change_rate != null) rates.push(Number(raw.change_rate));
      if (raw.close_price != null) prices.push(Number(raw.close_price));
    }

    const avgChangeRate = rates.length > 0
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0;
    const volatilityIndex = computeStddev(rates);

    let maxDrawdown = 0;
    if (prices.length > 0) {
      let runningMax = prices[0];
      for (const price of prices) {
        if (price > runningMax) runningMax = price;
        const dd = (price - runningMax) / runningMax;
        if (dd < maxDrawdown) maxDrawdown = dd;
      }
    }

    const periodDays = records.length;
    const allHistory = await db.StockQuoteHistory.findAll({
      where: { stock_code: stockCode },
      order: [['trade_date', 'ASC']],
      attributes: ['trade_date', 'change_rate', 'close_price'],
    });

    let bestSimilarity = 0;
    let bestPeriod = '';
    let bestPattern = '未知';

    for (let i = 0; i <= allHistory.length - periodDays; i++) {
      if (allHistory[i].trade_date >= startDate) continue;

      const windowRates: number[] = [];
      const windowPrices: number[] = [];
      for (let j = i; j < i + periodDays; j++) {
        const raw = toPlain(allHistory[j]);
        if (raw.change_rate != null) windowRates.push(Number(raw.change_rate));
        if (raw.close_price != null) windowPrices.push(Number(raw.close_price));
      }

      const wAvgRate = windowRates.length > 0
        ? windowRates.reduce((a, b) => a + b, 0) / windowRates.length
        : 0;
      const wVolIndex = computeStddev(windowRates);

      let wMaxDd = 0;
      if (windowPrices.length > 0) {
        let wRunningMax = windowPrices[0];
        for (const price of windowPrices) {
          if (price > wRunningMax) wRunningMax = price;
          const dd = (price - wRunningMax) / wRunningMax;
          if (dd < wMaxDd) wMaxDd = dd;
        }
      }

      const norm1 = Math.sqrt(avgChangeRate ** 2 + volatilityIndex ** 2 + (maxDrawdown * 100) ** 2);
      const norm2 = Math.sqrt(wAvgRate ** 2 + wVolIndex ** 2 + (wMaxDd * 100) ** 2);
      const dotProduct = avgChangeRate * wAvgRate + volatilityIndex * wVolIndex + (maxDrawdown * 100) * (wMaxDd * 100);
      const similarity = norm1 > 0 && norm2 > 0 ? dotProduct / (norm1 * norm2) : 0;

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestPeriod = `${allHistory[i].trade_date} ~ ${allHistory[i + periodDays - 1].trade_date}`;

        if (wAvgRate > 1 && wVolIndex < 2) bestPattern = '稳步上涨';
        else if (wAvgRate > 1 && wVolIndex >= 2) bestPattern = '大幅震荡上行';
        else if (wAvgRate < -1 && wVolIndex < 2) bestPattern = '持续下跌';
        else if (wAvgRate < -1 && wVolIndex >= 2) bestPattern = '大幅震荡下行';
        else if (wVolIndex >= 3) bestPattern = '剧烈震荡';
        else bestPattern = '窄幅整理';
      }
    }

    return {
      pattern: bestPattern,
      similarity: Number(bestSimilarity.toFixed(4)),
      referencePeriod: bestPeriod,
    };
  }

  async checkDataCompleteness(
    stockCode: string,
    startDate: string,
    endDate: string,
  ): Promise<CompletenessResult> {
    const expectedDays = countWeekdays(startDate, endDate);

    const actualRecords = await db.StockQuoteHistory.findAll({
      where: {
        stock_code: stockCode,
        trade_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['trade_date'],
    });

    const existingDates = new Set(actualRecords.map((r) => r.trade_date));

    const missingDates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        const dateStr = current.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          missingDates.push(dateStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    const score = expectedDays > 0
      ? Math.round(((expectedDays - missingDates.length) / expectedDays) * 100)
      : 0;

    return {
      score,
      missingDates,
      isComplete: missingDates.length === 0,
    };
  }

  async exportReplayData(params: {
    stockCodes: string[];
    startDate: string;
    endDate: string;
    fields?: string[];
    orderBy?: string;
    isFullExport: boolean;
    format: 'csv' | 'xlsx';
  }): Promise<Buffer> {
    const { stockCodes, startDate, endDate, fields, orderBy, isFullExport, format } = params;

    const where: Record<string, unknown> = {
      stock_code: { [Op.in]: stockCodes },
      trade_date: { [Op.between]: [startDate, endDate] },
    };

    let order: Array<[string, string]> = [['trade_date', 'DESC']];
    if (orderBy) {
      const parts = orderBy.split(':');
      const field = parts[0] || 'trade_date';
      const direction = (parts[1] || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      order = [[field, direction]];
    }

    const records = await db.StockQuoteHistory.findAll({ where, order });

    const allFields = [
      'stock_code', 'stock_name', 'trade_date',
      'open_price', 'close_price', 'high_price', 'low_price',
      'current_price', 'change_amount', 'change_rate',
      'volume', 'turnover',
    ];

    const exportFields = fields && fields.length > 0 ? fields : allFields;

    const fieldLabels: Record<string, string> = {
      stock_code: '股票代码',
      stock_name: '股票名称',
      trade_date: '交易日期',
      open_price: '开盘价',
      close_price: '收盘价',
      high_price: '最高价',
      low_price: '最低价',
      current_price: '现价',
      change_amount: '涨跌额',
      change_rate: '涨跌幅(%)',
      volume: '成交量',
      turnover: '成交额',
    };

    const rows: string[][] = [];
    for (const r of records) {
      const raw = toPlain(r);
      const row: string[] = [];
      for (const f of exportFields) {
        const val = raw[f];
        row.push(val != null ? String(val) : '');
      }
      rows.push(row);
    }

    if (isFullExport) {
      const opLogs = await db.OperationLog.findAll({
        where: {
          created_at: { [Op.between]: [startDate, endDate] },
        },
        order: [['created_at', 'DESC']],
        limit: 1000,
      });

      if (opLogs.length > 0) {
        rows.push([]);
        rows.push(['--- 操作日志 ---']);
        rows.push(['操作类型', '操作人', '操作时间', '详情']);
        for (const log of opLogs) {
          const raw = toPlain(log);
          rows.push([
            String(raw.operation_type || ''),
            String(raw.username || ''),
            String(raw.created_at || ''),
            String(raw.operation || ''),
          ]);
        }
      }
    }

    if (format === 'xlsx') {
      return this.generateXlsxBuffer(exportFields, fieldLabels, rows);
    }

    return this.generateCsvBuffer(exportFields, fieldLabels, rows);
  }

  private generateCsvBuffer(
    fields: string[],
    labels: Record<string, string>,
    rows: string[][],
  ): Buffer {
    const header = fields.map((f) => escapeCsvField(labels[f] || f)).join(',');
    const lines = [header];
    for (const row of rows) {
      lines.push(row.map((cell) => escapeCsvField(cell)).join(','));
    }
    const bom = '\uFEFF';
    return Buffer.from(bom + lines.join('\n'), 'utf-8');
  }

  private generateXlsxBuffer(
    fields: string[],
    labels: Record<string, string>,
    rows: string[][],
  ): Buffer {
    const headerCells = fields.map((f) =>
      `<Cell><Data ss:Type="String">${this.escapeXml(labels[f] || f)}</Data></Cell>`,
    ).join('');

    const dataRows = rows.map((row) => {
      const cells = row.map((cell) =>
        `<Cell><Data ss:Type="String">${this.escapeXml(cell)}</Data></Cell>`,
      ).join('');
      return `<Row>${cells}</Row>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="复盘数据">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    return Buffer.from(xml, 'utf-8');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async getSectorComparison(
    sector: string,
    startDate: string,
    endDate: string,
  ): Promise<SectorComparisonItem[]> {
    const stocksInSector = await db.StockQuote.findAll({
      where: { sector },
      attributes: ['stock_code', 'stock_name'],
    });

    if (stocksInSector.length === 0) {
      return [];
    }

    const stockCodes = stocksInSector.map((s: StockQuote) => s.stock_code);
    const stockNameMap = new Map<string, string>();
    for (const s of stocksInSector) {
      stockNameMap.set(s.stock_code, s.stock_name);
    }

    const historyRecords = await db.StockQuoteHistory.findAll({
      where: {
        stock_code: { [Op.in]: stockCodes },
        trade_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['stock_code', 'change_rate'],
    });

    const stockStatsMap = new Map<string, number[]>();
    for (const r of historyRecords) {
      const raw = toPlain(r);
      const code = raw.stock_code as string;
      if (!stockStatsMap.has(code)) {
        stockStatsMap.set(code, []);
      }
      if (raw.change_rate != null) {
        stockStatsMap.get(code)!.push(Number(raw.change_rate));
      }
    }

    const items: SectorComparisonItem[] = [];
    for (const [code, rates] of stockStatsMap) {
      const avgRate = rates.length > 0
        ? Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(4))
        : 0;
      const volIndex = Number(computeStddev(rates).toFixed(4));
      items.push({
        stockCode: code,
        stockName: stockNameMap.get(code) || code,
        avgChangeRate: avgRate,
        volatilityIndex: volIndex,
        rank: 0,
      });
    }

    items.sort((a, b) => b.avgChangeRate - a.avgChangeRate);
    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    return items;
  }

  async getReplaySessions(params: {
    page: number;
    pageSize: number;
    sector?: string;
    status?: string;
  }): Promise<{ list: ReplaySession[]; total: number }> {
    const { page, pageSize, sector, status } = params;

    const where: Record<string, unknown> = {};
    if (sector) where.sector = sector;
    if (status) where.status = status;

    const { rows, count } = await replaySessionDAO.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count };
  }
}

type InferCreationAttributesFromReplaySession = InferCreationAttributes<ReplaySession>;
type InferCreationAttributesFromReplayConclusion = InferCreationAttributes<ReplayConclusion>;

export default new ReplayService();
