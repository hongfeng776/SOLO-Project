import { Op } from 'sequelize';
import riskAlertDAO from '@dao/RiskAlertDAO';
import tradeDAO from '@dao/TradeDAO';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';

function generateAlertNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RA${dateStr}${random}`;
}

function getAlertLevelByScore(riskScore: number): string {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
}

function getRiskLevelOrder(level: string): number {
  const orders: Record<string, number> = {
    R1: 1,
    R2: 2,
    R3: 3,
    R4: 4,
    R5: 5,
  };
  return orders[level] || 0;
}

class RiskAlertService {
  async createAlert(
    data: {
      alertType: string;
      alertLevel?: string;
      customerId?: number;
      stockId?: number;
      tradeId?: number;
      title: string;
      content?: string;
      riskScore?: number;
    },
    t?: Transaction,
  ) {
    const { alertType, alertLevel, customerId, stockId, tradeId, title, content, riskScore } = data;
    const alertNo = generateAlertNo();
    const level = alertLevel || (riskScore !== undefined ? getAlertLevelByScore(riskScore) : 'low');
    const score = riskScore !== undefined ? riskScore : this.getDefaultScoreByLevel(level);

    return db.RiskAlert.create(
      {
        alert_no: alertNo,
        alert_type: alertType,
        alert_level: level,
        customer_id: customerId,
        stock_id: stockId,
        trade_id: tradeId,
        title,
        content,
        risk_score: score,
        alert_status: 'pending',
      },
      { transaction: t },
    );
  }

  getDefaultScoreByLevel(level: string): number {
    const scores: Record<string, number> = {
      low: 20,
      medium: 50,
      high: 70,
      critical: 90,
    };
    return scores[level] || 20;
  }

  async checkAbnormalTrade(data: {
    customerId: number;
    stockId: number;
    tradeAmount: number;
    price: number;
    direction: string;
    customerRiskLevel?: string;
  }) {
    const { customerId, stockId, tradeAmount, price, customerRiskLevel } = data;
    let hasAbnormal = false;
    let alertLevel = 'low';
    let maxScore = 0;
    const reasons: string[] = [];

    const customer = await db.CustomerAsset.findByPk(customerId);
    const totalAsset = Number(customer?.total_asset || 0);
    if (totalAsset > 0 && tradeAmount > totalAsset * 0.3) {
      hasAbnormal = true;
      alertLevel = 'high';
      maxScore = Math.max(maxScore, 75);
      reasons.push(`单笔交易金额(${tradeAmount})超过客户总资产(${totalAsset})的30%`);
    }

    const todayTradeCount = await tradeDAO.countTodayTradesByCustomerAndStock(customerId, stockId);
    if (todayTradeCount > 5) {
      hasAbnormal = true;
      if (maxScore < 50) {
        alertLevel = 'medium';
      }
      maxScore = Math.max(maxScore, 50);
      reasons.push(`同一股票单日交易次数(${todayTradeCount})超过5次`);
    }

    const stock = await db.StockQuote.findByPk(stockId);
    if (stock) {
      const marketPrice = Number(stock.current_price || stock.close_price || 0);
      if (marketPrice > 0) {
        const deviation = Math.abs(price - marketPrice) / marketPrice;
        if (deviation > 0.1) {
          hasAbnormal = true;
          alertLevel = 'high';
          maxScore = Math.max(maxScore, 80);
          reasons.push(`交易价格(${price})偏离行情价格(${marketPrice})超过10%`);
        }
      }
    }

    const stockRiskLevel = 'R3';
    if (customerRiskLevel && getRiskLevelOrder(customerRiskLevel) < getRiskLevelOrder(stockRiskLevel)) {
      hasAbnormal = true;
      if (maxScore < 50) {
        alertLevel = 'medium';
      }
      maxScore = Math.max(maxScore, 45);
      reasons.push(`客户风险等级(${customerRiskLevel})低于产品风险等级(${stockRiskLevel})`);
    }

    return {
      hasAbnormal,
      alertLevel,
      riskScore: maxScore,
      title: hasAbnormal ? '异常交易检测告警' : '',
      content: reasons.join('; '),
    };
  }

  async checkPriceAbnormal(stockId: number) {
    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      return { hasAbnormal: false, alertLevel: 'low', riskScore: 0, title: '', content: '' };
    }

    let hasAbnormal = false;
    let alertLevel = 'low';
    let maxScore = 0;
    const reasons: string[] = [];

    const changeRate = Math.abs(Number(stock.change_rate || 0));
    if (changeRate > 10) {
      hasAbnormal = true;
      alertLevel = 'medium';
      maxScore = Math.max(maxScore, 55);
      reasons.push(`涨跌幅(${changeRate}%)超过10%`);
    }

    const amplitude = Number(stock.amplitude || 0);
    if (amplitude > 15) {
      hasAbnormal = true;
      alertLevel = 'medium';
      maxScore = Math.max(maxScore, 55);
      reasons.push(`振幅(${amplitude}%)超过15%`);
    }

    const threeDayResult = await this.checkThreeDayTrend(stockId);
    if (threeDayResult.hasAbnormal) {
      hasAbnormal = true;
      alertLevel = 'high';
      maxScore = Math.max(maxScore, 75);
      reasons.push(threeDayResult.content);
    }

    return {
      hasAbnormal,
      alertLevel,
      riskScore: maxScore,
      title: hasAbnormal ? '价格异常检测告警' : '',
      content: reasons.join('; '),
    };
  }

  async checkThreeDayTrend(stockId: number) {
    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock || !stock.stock_code) {
      return { hasAbnormal: false, content: '' };
    }

    const recentQuotes = await db.StockQuote.findAll({
      where: { stock_code: stock.stock_code },
      order: [['trade_date', 'DESC']],
      limit: 3,
    });

    if (recentQuotes.length < 3) {
      return { hasAbnormal: false, content: '' };
    }

    const rates = recentQuotes.map((q) => Number(q.change_rate || 0));
    const allSameDirection = rates.every((r) => r > 5) || rates.every((r) => r < -5);

    if (allSameDirection) {
      return {
        hasAbnormal: true,
        content: `连续3日涨跌幅同向超过5%: ${rates.join(', ')}%`,
      };
    }

    return { hasAbnormal: false, content: '' };
  }

  async checkPositionConcentration(customerId: number) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      return { hasAbnormal: false, alertLevel: 'low', riskScore: 0, title: '', content: '' };
    }

    const totalAsset = Number(customer.total_asset || 0);
    if (totalAsset <= 0) {
      return { hasAbnormal: false, alertLevel: 'low', riskScore: 0, title: '', content: '' };
    }

    let hasAbnormal = false;
    let alertLevel = 'low';
    let maxScore = 0;
    const reasons: string[] = [];

    const holdings = await customerHoldingDAO.findByCustomerId(customerId);

    for (const holding of holdings) {
      const marketValue = Number(holding.market_value || 0);
      const ratio = marketValue / totalAsset;
      if (ratio > 0.5) {
        hasAbnormal = true;
        alertLevel = 'high';
        maxScore = Math.max(maxScore, 80);
        reasons.push(`单只股票(${holding.stock_name || holding.stock_code})持仓占比(${(ratio * 100).toFixed(2)}%)超过总资产50%`);
      }
    }

    const top3 = holdings.slice(0, 3);
    const top3MarketValue = top3.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
    const top3Ratio = top3MarketValue / totalAsset;
    if (top3Ratio > 0.7) {
      hasAbnormal = true;
      if (maxScore < 55) {
        alertLevel = 'medium';
      }
      maxScore = Math.max(maxScore, 55);
      reasons.push(`前3只股票持仓占比(${(top3Ratio * 100).toFixed(2)}%)超过总资产70%`);
    }

    return {
      hasAbnormal,
      alertLevel,
      riskScore: maxScore,
      title: hasAbnormal ? '持仓集中度检测告警' : '',
      content: reasons.join('; '),
    };
  }

  async confirmAlert(id: number, handlerId?: number, opinion?: string) {
    const alert = await db.RiskAlert.findByPk(id);
    if (!alert) {
      throw new AppError(404, 'Risk alert not found');
    }
    await db.RiskAlert.update(
      {
        alert_status: 'confirmed',
        handler_id: handlerId,
        handle_opinion: opinion,
        handle_at: new Date(),
      },
      { where: { id } },
    );
    return db.RiskAlert.findByPk(id);
  }

  async resolveAlert(id: number, handlerId?: number, opinion?: string) {
    const alert = await db.RiskAlert.findByPk(id);
    if (!alert) {
      throw new AppError(404, 'Risk alert not found');
    }
    await db.RiskAlert.update(
      {
        alert_status: 'resolved',
        handler_id: handlerId,
        handle_opinion: opinion,
        handle_at: new Date(),
      },
      { where: { id } },
    );
    return db.RiskAlert.findByPk(id);
  }

  async ignoreAlert(id: number, handlerId?: number, opinion?: string) {
    const alert = await db.RiskAlert.findByPk(id);
    if (!alert) {
      throw new AppError(404, 'Risk alert not found');
    }
    await db.RiskAlert.update(
      {
        alert_status: 'ignored',
        handler_id: handlerId,
        handle_opinion: opinion,
        handle_at: new Date(),
      },
      { where: { id } },
    );
    return db.RiskAlert.findByPk(id);
  }

  async getAlertById(id: number) {
    const alert = await db.RiskAlert.findByPk(id);
    if (!alert) {
      throw new AppError(404, 'Risk alert not found');
    }
    return alert;
  }

  async getAlertByNo(alertNo: string) {
    const alert = await riskAlertDAO.findByAlertNo(alertNo);
    if (!alert) {
      throw new AppError(404, 'Risk alert not found');
    }
    return alert;
  }

  async getAlertList(params: {
    page: number;
    pageSize: number;
    alertType?: string;
    alertLevel?: string;
    alertStatus?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) {
    const { page, pageSize, alertType, alertLevel, alertStatus, customerId, startDate, endDate, keyword } = params;
    const where: any = {};

    if (alertType) {
      where.alert_type = alertType;
    }
    if (alertLevel) {
      where.alert_level = alertLevel;
    }
    if (alertStatus) {
      where.alert_status = alertStatus;
    }
    if (customerId) {
      where.customer_id = customerId;
    }
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.created_at = { [Op.gte]: startDate };
    } else if (endDate) {
      where.created_at = { [Op.lte]: endDate };
    }
    if (keyword) {
      where[Op.or] = [
        { alert_no: { [Op.like]: `%${keyword}%` } },
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.RiskAlert.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }
}

export default new RiskAlertService();
