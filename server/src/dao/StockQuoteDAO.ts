import BaseDAO from './BaseDAO';
import { db } from '../models';
import StockQuote from '../models/StockQuote';

class StockQuoteDAO extends BaseDAO<StockQuote> {
  constructor() {
    super(db.StockQuote);
  }

  async findByStockCode(stockCode: string): Promise<StockQuote | null> {
    return this.model.findOne({ where: { stock_code: stockCode } });
  }

  async findByMarket(market: string): Promise<StockQuote[]> {
    return this.model.findAll({ where: { market } });
  }

  async findByTradeDate(tradeDate: string): Promise<StockQuote[]> {
    return this.model.findAll({ where: { trade_date: tradeDate } });
  }
}

export default new StockQuoteDAO();
