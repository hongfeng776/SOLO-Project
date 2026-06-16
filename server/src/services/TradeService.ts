import { Op } from 'sequelize';
import tradeDAO from '@dao/TradeDAO';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import customerAssetService from './CustomerAssetService';
import customerHoldingService from './CustomerHoldingService';
import fundFlowService from './FundFlowService';
import riskAlertService from './RiskAlertService';

const COMMISSION_RATE = 0.0003;
const MIN_COMMISSION = 5;
const STAMP_TAX_RATE = 0.001;
const AUDIT_THRESHOLD = 100000;

function generateTradeNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `T${dateStr}${random}`;
}

function calculateFees(direction: string, tradeAmount: number) {
  let commission = tradeAmount * COMMISSION_RATE;
  if (commission < MIN_COMMISSION) {
    commission = MIN_COMMISSION;
  }
  commission = Number(commission.toFixed(2));

  let stampTax = 0;
  if (direction === 'sell') {
    stampTax = Number((tradeAmount * STAMP_TAX_RATE).toFixed(2));
  }

  const totalFee = Number((commission + stampTax).toFixed(2));

  return { commission, stampTax, totalFee };
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

class TradeService {
  async createTrade(data: {
    customerId: number;
    stockId: number;
    tradeType: string;
    direction: string;
    price: number;
    quantity: number;
    remark?: string;
  }) {
    const { customerId, stockId, tradeType, direction, price, quantity, remark } = data;

    if (!price || price <= 0) {
      throw new AppError(400, 'Invalid price');
    }
    if (!quantity || quantity <= 0) {
      throw new AppError(400, 'Quantity must be positive');
    }

    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      throw new AppError(404, 'Stock not found');
    }

    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    if (customer.status !== 'normal') {
      throw new AppError(400, 'Customer status is abnormal, cannot trade');
    }

    const riskLevelOrder = getRiskLevelOrder(customer.risk_level || 'R1');
    const stockRiskLevel = 'R3';
    if (riskLevelOrder < getRiskLevelOrder(stockRiskLevel)) {
      throw new AppError(400, 'Customer risk level does not match product risk level');
    }

    const tradeAmount = Number((price * quantity).toFixed(2));
    const { commission, stampTax, totalFee } = calculateFees(direction, tradeAmount);

    const t = await db.sequelize.transaction();

    try {
      if (direction === 'buy') {
        const totalCost = Number((tradeAmount + totalFee).toFixed(2));
        const availableAmount = Number(customer.available_amount || 0);
        if (availableAmount < totalCost) {
          throw new AppError(400, 'Insufficient available amount');
        }
        await customerAssetService.freezeAmount(customerId, totalCost, t);
      } else if (direction === 'sell') {
        const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
        if (!holding || Number(holding.available_quantity || 0) < quantity) {
          throw new AppError(400, 'Insufficient available holding quantity');
        }
        await customerHoldingService.freezeQuantity(customerId, stockId, quantity, t);
      }

      const needAudit = tradeAmount > AUDIT_THRESHOLD;
      const tradeStatus = needAudit ? 'auditing' : 'pending';
      const tradeNo = generateTradeNo();

      const trade = await db.Trade.create(
        {
          trade_no: tradeNo,
          customer_id: customerId,
          stock_id: stockId,
          stock_code: stock.stock_code,
          stock_name: stock.stock_name,
          trade_type: tradeType,
          direction,
          price,
          quantity,
          trade_amount: tradeAmount,
          commission,
          stamp_tax: stampTax,
          total_fee: totalFee,
          trade_status: tradeStatus,
          need_audit: needAudit,
          frozen_amount: direction === 'buy' ? Number((tradeAmount + totalFee).toFixed(2)) : 0,
          frozen_quantity: direction === 'sell' ? quantity : 0,
          remark,
        },
        { transaction: t },
      );

      const abnormalResult = await riskAlertService.checkAbnormalTrade({
        customerId,
        stockId,
        tradeAmount,
        price,
        direction,
        customerRiskLevel: customer.risk_level,
      });

      if (abnormalResult.hasAbnormal) {
        await riskAlertService.createAlert({
          alertType: 'abnormal_trade',
          alertLevel: abnormalResult.alertLevel,
          customerId,
          stockId,
          tradeId: trade.id,
          title: abnormalResult.title,
          content: abnormalResult.content,
          riskScore: abnormalResult.riskScore,
        }, t);
      }

      await t.commit();
      return db.Trade.findByPk(trade.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async auditTrade(id: number, auditorId: number, approved: boolean, opinion: string) {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }
    if (trade.trade_status !== 'auditing') {
      throw new AppError(400, 'Trade is not in auditing status');
    }

    const t = await db.sequelize.transaction();

    try {
      if (approved) {
        await db.Trade.update(
          {
            trade_status: 'success',
            auditor_id: auditorId,
            audit_opinion: opinion,
            audit_at: new Date(),
          },
          { where: { id }, transaction: t },
        );

        if (trade.direction === 'buy') {
          await customerAssetService.deductFrozenAmount(
            trade.customer_id,
            Number(trade.frozen_amount || 0),
            t,
          );
          await customerHoldingService.updateHoldingAfterTrade(
            trade.customer_id,
            trade.stock_id,
            'buy',
            Number(trade.quantity),
            Number(trade.price),
            Number(trade.trade_amount || 0) + Number(trade.total_fee || 0),
            t,
          );
        } else {
          await customerHoldingService.deductFrozenQuantity(
            trade.customer_id,
            trade.stock_id,
            Number(trade.frozen_quantity || 0),
            t,
          );
          await customerHoldingService.updateHoldingAfterTrade(
            trade.customer_id,
            trade.stock_id,
            'sell',
            Number(trade.quantity),
            Number(trade.price),
            Number(trade.trade_amount || 0),
            t,
          );
        }

        await customerAssetService.updateAfterTrade(trade, t);

        await fundFlowService.createFlowFromTrade(trade, t);
      } else {
        await db.Trade.update(
          {
            trade_status: 'failed',
            auditor_id: auditorId,
            audit_opinion: opinion,
            audit_at: new Date(),
          },
          { where: { id }, transaction: t },
        );

        if (trade.direction === 'buy') {
          await customerAssetService.unfreezeAmount(
            trade.customer_id,
            Number(trade.frozen_amount || 0),
            t,
          );
        } else {
          await customerHoldingService.unfreezeQuantity(
            trade.customer_id,
            trade.stock_id,
            Number(trade.frozen_quantity || 0),
            t,
          );
        }

        await riskAlertService.createAlert({
          alertType: 'trade_rejected',
          alertLevel: 'medium',
          customerId: trade.customer_id,
          stockId: trade.stock_id,
          tradeId: trade.id,
          title: '交易审核拒绝',
          content: `交易单号: ${trade.trade_no}, 审核意见: ${opinion}`,
          riskScore: 40,
        }, t);
      }

      await t.commit();
      return db.Trade.findByPk(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async cancelTrade(id: number) {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }
    if (trade.trade_status !== 'pending' && trade.trade_status !== 'auditing') {
      throw new AppError(400, 'Only pending or auditing trades can be cancelled');
    }

    const t = await db.sequelize.transaction();

    try {
      await db.Trade.update(
        { trade_status: 'cancelled' },
        { where: { id }, transaction: t },
      );

      if (trade.direction === 'buy') {
        await customerAssetService.unfreezeAmount(
          trade.customer_id,
          Number(trade.frozen_amount || 0),
          t,
        );
      } else {
        await customerHoldingService.unfreezeQuantity(
          trade.customer_id,
          trade.stock_id,
          Number(trade.frozen_quantity || 0),
          t,
        );
      }

      await t.commit();
      return db.Trade.findByPk(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getTradeById(id: number) {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }
    return trade;
  }

  async getTradeByNo(tradeNo: string) {
    const trade = await tradeDAO.findByTradeNo(tradeNo);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }
    return trade;
  }

  async getTradeList(params: {
    page: number;
    pageSize: number;
    customerId?: number;
    stockId?: number;
    direction?: string;
    tradeStatus?: string;
    auditStatus?: string;
    tradeType?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) {
    const { page, pageSize, customerId, stockId, direction, tradeStatus, auditStatus, tradeType, startDate, endDate, keyword } = params;
    const where: any = {};

    if (customerId) {
      where.customer_id = customerId;
    }
    if (stockId) {
      where.stock_id = stockId;
    }
    if (direction) {
      where.direction = direction;
    }
    if (tradeStatus) {
      where.trade_status = tradeStatus;
    } else if (auditStatus) {
      where.trade_status = auditStatus;
    }
    if (tradeType) {
      where.trade_type = tradeType;
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
        { trade_no: { [Op.like]: `%${keyword}%` } },
        { stock_code: { [Op.like]: `%${keyword}%` } },
        { stock_name: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.Trade.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }
}

export default new TradeService();
