import { Op } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import StockQuoteHistory from '../models/StockQuoteHistory';

class StockQuoteHistoryDAO extends BaseDAO<StockQuoteHistory> {
  constructor() {
    super(db.StockQuoteHistory);
  }

  async findByStockId(stockId: number, days: number = 30): Promise<StockQuoteHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    return this.model.findAll({
      where: {
        stock_id: stockId,
        trade_date: {
          [Op.gte]: startDateStr,
        },
      },
      order: [['trade_date', 'DESC']],
    });
  }

  async findByStockIdAndDate(stockId: number, date: string): Promise<StockQuoteHistory | null> {
    return this.model.findOne({
      where: {
        stock_id: stockId,
        trade_date: date,
      },
    });
  }

  async findHistoryStats(stockId: number, days: number = 30): Promise<{
    peakPrice: number | null;
    valleyPrice: number | null;
    avgPrice: number | null;
    avgVolume: number | null;
    maxChangeRate: number | null;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const records = await this.model.findAll({
      where: {
        stock_id: stockId,
        trade_date: {
          [Op.gte]: startDateStr,
        },
      },
    });

    if (records.length === 0) {
      return {
        peakPrice: null,
        valleyPrice: null,
        avgPrice: null,
        avgVolume: null,
        maxChangeRate: null,
      };
    }

    let peakPrice = Number.NEGATIVE_INFINITY;
    let valleyPrice = Number.POSITIVE_INFINITY;
    let priceSum = 0;
    let volumeSum = 0;
    let maxChangeRate = Number.NEGATIVE_INFINITY;
    let validPriceCount = 0;
    let validVolumeCount = 0;
    let validRateCount = 0;

    for (const record of records) {
      if (record.high_price != null) {
        peakPrice = Math.max(peakPrice, Number(record.high_price));
      }
      if (record.low_price != null) {
        valleyPrice = Math.min(valleyPrice, Number(record.low_price));
      }
      if (record.close_price != null) {
        priceSum += Number(record.close_price);
        validPriceCount++;
      }
      if (record.volume != null) {
        volumeSum += Number(record.volume);
        validVolumeCount++;
      }
      if (record.change_rate != null) {
        maxChangeRate = Math.max(maxChangeRate, Number(record.change_rate));
        validRateCount++;
      }
    }

    return {
      peakPrice: peakPrice === Number.NEGATIVE_INFINITY ? null : peakPrice,
      valleyPrice: valleyPrice === Number.POSITIVE_INFINITY ? null : valleyPrice,
      avgPrice: validPriceCount > 0 ? priceSum / validPriceCount : null,
      avgVolume: validVolumeCount > 0 ? volumeSum / validVolumeCount : null,
      maxChangeRate: validRateCount > 0 ? maxChangeRate : null,
    };
  }
}

export default new StockQuoteHistoryDAO();
