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
const BATCH_AUDIT_THRESHOLD = 50000;
const PRICE_DEVIATION_THRESHOLD = 0.1;
const SINGLE_ORDER_MAX_QUANTITY = 1000000;
const DAILY_ORDER_MAX_AMOUNT = 5000000;
const MATCHING_PRICE_DEVIATION_LIMIT = 0.15;

interface IMatchingValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  orderValid: boolean;
  marketLiquidity: 'high' | 'medium' | 'low' | 'none';
  ruleActive: boolean;
  stockTradable: boolean;
}

interface IMatchingResult {
  success: boolean;
  matchStatus: 'full' | 'partial' | 'failed';
  matchPrice: number;
  matchQuantity: number;
  matchAmount: number;
  remainQuantity: number;
  trade: any;
}

interface IMatchingTrace {
  orderId: number;
  tradeNo: string;
  matchRule: string;
  matchPrice: number;
  matchQuantity: number;
  matchAmount: number;
  marketPrice: number;
  priceDeviation: number;
  matchedAt: string;
  counterParty: string;
  priceConsistent: boolean;
  traceNodes: Array<{
    name: string;
    passed: boolean;
    message: string;
    time: string;
  }>;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['success', 'auditing', 'cancelled', 'failed'],
  success: ['dealed', 'cancelled', 'failed', 'partial_dealed'],
  approved: ['dealed', 'cancelled', 'failed', 'partial_dealed'],
  auditing: ['success', 'rejected', 'cancelled'],
  dealed: [],
  partial_dealed: ['dealed', 'failed'],
  cancelled: [],
  failed: [],
  rejected: [],
  paused: ['pending', 'cancelled'],
};

interface IStatusValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  allowedActions: string[];
  currentStatus: string;
  targetStatus: string;
}

interface IStatusChangeResult {
  success: boolean;
  tradeId: number;
  previousStatus: string;
  newStatus: string;
  changeType: 'manual' | 'system';
  dataConsistent: boolean;
  fundDiff: number;
  holdingDiff: number;
  message: string;
}

interface IStatusTraceRecord {
  id: number;
  tradeId: number;
  tradeNo: string;
  fromStatus: string;
  toStatus: string;
  changeType: 'manual' | 'system';
  operatorId: number | null;
  operatorName: string;
  reason: string;
  fundBefore: number;
  fundAfter: number;
  fundDiff: number;
  holdingBefore: number;
  holdingAfter: number;
  holdingDiff: number;
  dataConsistent: boolean;
  createdAt: string;
}

const TRADING_SESSIONS = [
  { start: '09:30', end: '11:30' },
  { start: '13:00', end: '15:00' },
];

interface IValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface IOrderTraceInfo {
  orderId: number;
  tradeNo: string;
  customerName: string;
  stockName: string;
  tradeType: string;
  price: number;
  quantity: number;
  amount: number;
  status: string;
  operator: string;
  ip: string;
  userAgent: string;
  submitAt: string;
  checkPoints: Array<{
    name: string;
    passed: boolean;
    message: string;
    time: string;
  }>;
}

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

function isInTradingSession(): { inSession: boolean; currentPeriod: string; nextSessionAt: string } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const day = now.getDay();
  if (day === 0 || day === 6) {
    return { inSession: false, currentPeriod: '休市', nextSessionAt: '下周一 09:30' };
  }

  const morning = TRADING_SESSIONS[0];
  const afternoon = TRADING_SESSIONS[1];

  if (currentTime < morning.start) {
    return { inSession: false, currentPeriod: '开盘前', nextSessionAt: `今日 ${morning.start}` };
  } else if (currentTime >= morning.start && currentTime <= morning.end) {
    return { inSession: true, currentPeriod: '早盘', nextSessionAt: `今日 ${afternoon.start}` };
  } else if (currentTime > morning.end && currentTime < afternoon.start) {
    return { inSession: false, currentPeriod: '午间休市', nextSessionAt: `今日 ${afternoon.start}` };
  } else if (currentTime >= afternoon.start && currentTime <= afternoon.end) {
    return { inSession: true, currentPeriod: '午盘', nextSessionAt: '明日 09:30' };
  } else {
    return { inSession: false, currentPeriod: '收盘后', nextSessionAt: '明日 09:30' };
  }
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

  getTradingSession() {
    return isInTradingSession();
  }

  async validateOrder(data: {
    customerId: number;
    stockId: number;
    direction: string;
    price: number;
    quantity: number;
    checkSession?: boolean;
  }): Promise<IValidationResult & {
    customer?: any;
    stock?: any;
    holding?: any;
    tradeAmount?: number;
    totalCost?: number;
  }> {
    const { customerId, stockId, direction, price, quantity, checkSession = true } = data;
    const errors: string[] = [];
    const warnings: string[] = [];

    const checkPoints: Array<{ name: string; passed: boolean; message: string }> = [];

    if (checkSession) {
      const session = isInTradingSession();
      if (!session.inSession) {
        errors.push(`当前处于${session.currentPeriod}，无法提交委托。下一交易时段：${session.nextSessionAt}`);
      }
      checkPoints.push({
        name: '交易时段校验',
        passed: session.inSession,
        message: session.inSession ? '交易时段正常' : `非交易时段：${session.currentPeriod}`,
      });
    }

    if (!quantity || quantity <= 0) {
      errors.push('委托数量必须大于0');
    } else if (quantity % 100 !== 0) {
      errors.push('委托数量必须为100股的整数倍');
    }
    checkPoints.push({
      name: '委托数量校验',
      passed: quantity > 0 && quantity % 100 === 0,
      message: quantity > 0 && quantity % 100 === 0 ? '数量格式正确' : '数量必须为100股整数倍',
    });

    if (quantity > SINGLE_ORDER_MAX_QUANTITY) {
      errors.push(`单笔委托数量不能超过${SINGLE_ORDER_MAX_QUANTITY}股`);
    }

    if (!price || price <= 0) {
      errors.push('委托价格必须大于0');
    }

    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      errors.push('股票不存在');
    } else {
      if (stock.status !== 'trading') {
        errors.push(`股票当前状态为${stock.status}，无法交易`);
      }
      checkPoints.push({
        name: '股票状态校验',
        passed: stock.status === 'trading',
        message: stock.status === 'trading' ? '股票正常交易中' : `股票状态：${stock.status}`,
      });

      const currentPrice = Number(stock.current_price || 0);
      if (currentPrice > 0 && price > 0) {
        const deviation = Math.abs(price - currentPrice) / currentPrice;
        if (deviation > PRICE_DEVIATION_THRESHOLD) {
          warnings.push(`委托价格与市价偏差${(deviation * 100).toFixed(2)}%，请注意价格风险`);
        }
        checkPoints.push({
          name: '价格偏差校验',
          passed: deviation <= PRICE_DEVIATION_THRESHOLD,
          message: `价格偏差${(deviation * 100).toFixed(2)}%，${deviation <= PRICE_DEVIATION_THRESHOLD ? '在合理范围内' : '超出合理范围'}`,
        });
      }
    }

    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      errors.push('客户不存在');
    } else {
      if (customer.status !== 'normal') {
        errors.push(`客户账户状态为${customer.status}，无法交易`);
      }
      checkPoints.push({
        name: '客户账户校验',
        passed: customer.status === 'normal',
        message: customer.status === 'normal' ? '账户状态正常' : `账户状态：${customer.status}`,
      });

      const tradeAmount = Number((price * quantity).toFixed(2));
      const { totalFee } = calculateFees(direction, tradeAmount);
      const totalCost = direction === 'buy' ? Number((tradeAmount + totalFee).toFixed(2)) : tradeAmount;

      if (direction === 'buy') {
        const availableAmount = Number(customer.available_amount || 0);
        if (availableAmount < totalCost) {
          errors.push(`可用资金不足。需要${totalCost.toFixed(2)}元，当前可用${availableAmount.toFixed(2)}元`);
        }
        checkPoints.push({
          name: '资金余额校验',
          passed: availableAmount >= totalCost,
          message: `可用资金${availableAmount.toFixed(2)}元，需${totalCost.toFixed(2)}元`,
        });
      } else if (direction === 'sell') {
        const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
        const availableQty = holding ? Number(holding.available_quantity || 0) : 0;
        if (availableQty < quantity) {
          errors.push(`可用持仓不足。需要${quantity}股，当前可用${availableQty}股`);
        }
        checkPoints.push({
          name: '持仓数量校验',
          passed: availableQty >= quantity,
          message: `可用持仓${availableQty}股，需${quantity}股`,
        });
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayTrades = await db.Trade.findAndCountAll({
        where: {
          customer_id: customerId,
          created_at: { [Op.between]: [todayStart, todayEnd] },
          trade_status: { [Op.ne]: 'cancelled' },
        },
      });

      const todayAmount = todayTrades.rows.reduce((sum, t) => sum + Number(t.trade_amount || 0), 0);
      if (todayAmount + tradeAmount > DAILY_ORDER_MAX_AMOUNT) {
        warnings.push(`今日委托金额已达${todayAmount.toFixed(2)}元，接近每日限额${DAILY_ORDER_MAX_AMOUNT}元`);
      }
    }

    const isDuplicate = await this.checkDuplicateOrder(customerId, stockId, direction, price, quantity);
    if (isDuplicate) {
      warnings.push('检测到相似委托，请确认是否重复提交');
    }
    checkPoints.push({
      name: '重复委托校验',
      passed: !isDuplicate,
      message: isDuplicate ? '存在相似委托' : '无重复委托',
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      customer,
      stock,
      tradeAmount: price * quantity,
      totalCost: direction === 'buy' ? price * quantity + calculateFees(direction, price * quantity).totalFee : price * quantity,
    };
  }

  async checkDuplicateOrder(customerId: number, stockId: number, direction: string, price: number, quantity: number): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const duplicate = await db.Trade.findOne({
      where: {
        customer_id: customerId,
        stock_id: stockId,
        direction,
        price,
        quantity,
        created_at: { [Op.gte]: fiveMinutesAgo },
        trade_status: { [Op.in]: ['pending', 'auditing', 'success'] },
      },
    });

    return !!duplicate;
  }

  async submitOrder(data: {
    customerId: number;
    stockId: number;
    tradeType: string;
    direction: string;
    price: number;
    quantity: number;
    remark?: string;
    operatorId?: number;
    auditThreshold?: number;
  }) {
    const validation = await this.validateOrder({
      customerId: data.customerId,
      stockId: data.stockId,
      direction: data.direction,
      price: data.price,
      quantity: data.quantity,
    });

    if (!validation.valid) {
      throw new AppError(400, validation.errors.join('; '));
    }

    const customer = validation.customer;
    const riskLevel = customer?.risk_level || 'R1';
    const riskLevelOrder = getRiskLevelOrder(riskLevel);

    const tradeAmount = Number((data.price * data.quantity).toFixed(2));
    const isHighRisk = riskLevelOrder >= 4;
    const threshold = data.auditThreshold !== undefined ? data.auditThreshold : AUDIT_THRESHOLD;
    const needAudit = tradeAmount > threshold || isHighRisk;

    const result = await this.createTrade({
      ...data,
      tradeType: data.tradeType,
    });

    if (needAudit && result) {
      await db.Trade.update(
        { need_audit: true, trade_status: 'auditing' },
        { where: { id: result.id } },
      );
      result.need_audit = true;
      result.trade_status = 'auditing';
    }

    return {
      trade: result,
      validation,
      needAudit,
      isHighRisk,
    };
  }

  async batchSubmitOrders(orders: Array<{
    customerId: number;
    stockId: number;
    tradeType: string;
    direction: string;
    price: number;
    quantity: number;
    remark?: string;
  }>, operatorId?: number) {
    const results: Array<{
      success: boolean;
      order?: any;
      error?: string;
      needAudit?: boolean;
    }> = [];

    const customerIds = [...new Set(orders.map(o => o.customerId))];
    const customers = await db.CustomerAsset.findAll({
      where: { id: { [Op.in]: customerIds } },
      attributes: ['id', 'risk_level'],
    });
    const customerRiskMap = new Map<number, number>();
    const riskLevelOrder: Record<string, number> = { R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
    for (const c of customers) {
      customerRiskMap.set(c.id, riskLevelOrder[c.risk_level || 'R3'] || 3);
    }

    const sortedOrders = [...orders].sort((a, b) => {
      const riskA = customerRiskMap.get(a.customerId) || 3;
      const riskB = customerRiskMap.get(b.customerId) || 3;
      return riskB - riskA;
    });

    for (const order of sortedOrders) {
      try {
        const result = await this.submitOrder({
          ...order,
          operatorId,
          auditThreshold: BATCH_AUDIT_THRESHOLD,
        });
        results.push({
          success: true,
          order: result.trade,
          needAudit: result.needAudit,
        });
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const auditCount = results.filter(r => r.needAudit).length;

    return {
      total: orders.length,
      successCount,
      failedCount,
      auditCount,
      results,
    };
  }

  async cancelOrder(id: number, _operatorId?: number) {
    return this.cancelTrade(id);
  }

  async getOrderTrace(id: number): Promise<IOrderTraceInfo> {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }

    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    const stock = await db.StockQuote.findByPk(trade.stock_id);

    const checkPoints: Array<{ name: string; passed: boolean; message: string; time: string }> = [];

    checkPoints.push({
      name: '委托提交',
      passed: true,
      message: '委托已提交',
      time: trade.created_at?.toISOString() || new Date().toISOString(),
    });

    if (trade.trade_status === 'cancelled') {
      checkPoints.push({
        name: '委托撤销',
        passed: true,
        message: '委托已撤销，资金/持仓已解冻',
        time: trade.updated_at?.toISOString() || new Date().toISOString(),
      });
    } else if (trade.trade_status === 'failed' || trade.trade_status === 'rejected') {
      checkPoints.push({
        name: '审核拒绝',
        passed: false,
        message: trade.audit_opinion || '委托被驳回',
        time: trade.audit_at?.toISOString() || new Date().toISOString(),
      });
    } else if (trade.trade_status === 'auditing') {
      checkPoints.push({
        name: '合规检查',
        passed: true,
        message: '待人工复核',
        time: trade.created_at?.toISOString() || new Date().toISOString(),
      });
    } else if (trade.trade_status === 'success' || trade.trade_status === 'dealed') {
      checkPoints.push({
        name: '合规检查',
        passed: true,
        message: '合规检查通过',
        time: trade.created_at?.toISOString() || new Date().toISOString(),
      });
      checkPoints.push({
        name: '待撮合',
        passed: true,
        message: '进入待撮合队列',
        time: trade.created_at?.toISOString() || new Date().toISOString(),
      });
    } else {
      checkPoints.push({
        name: '待处理',
        passed: true,
        message: '委托处理中',
        time: trade.created_at?.toISOString() || new Date().toISOString(),
      });
    }

    return {
      orderId: trade.id,
      tradeNo: trade.trade_no,
      customerName: customer?.customer_name || '',
      stockName: stock ? `${stock.stock_code} ${stock.stock_name}` : '',
      tradeType: trade.direction,
      price: Number(trade.price),
      quantity: Number(trade.quantity),
      amount: Number(trade.trade_amount),
      status: trade.trade_status,
      operator: '',
      ip: '',
      userAgent: '',
      submitAt: trade.created_at?.toISOString() || '',
      checkPoints,
    };
  }

  async getPendingOrders(params: {
    page: number;
    pageSize: number;
    riskLevel?: string;
    customerId?: number;
  }) {
    const { page, pageSize, riskLevel, customerId } = params;
    const where: any = {
      trade_status: { [Op.in]: ['pending', 'auditing'] },
    };

    if (customerId) {
      where.customer_id = customerId;
    }

    const include: any[] = [];
    if (riskLevel) {
      include.push({
        model: db.CustomerAsset,
        as: 'customer',
        where: { risk_level: riskLevel },
        attributes: [],
      });
    }

    const { rows, count } = await db.Trade.findAndCountAll({
      where,
      include,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['need_audit', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async processBatchOrders(ids: number[], action: 'approve' | 'reject', operatorId: number, opinion?: string) {
    const results: Array<{ id: number; success: boolean; error?: string }> = [];

    for (const id of ids) {
      try {
        if (action === 'approve') {
          await this.auditTrade(id, operatorId, true, opinion || '批量审核通过');
        } else {
          await this.auditTrade(id, operatorId, false, opinion || '批量审核拒绝');
        }
        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      total: ids.length,
      successCount,
      failedCount,
      results,
    };
  }

  async validateMatchingOrder(id: number): Promise<IMatchingValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let orderValid = true;
    let marketLiquidity: 'high' | 'medium' | 'low' | 'none' = 'none';
    let ruleActive = true;
    let stockTradable = true;

    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      errors.push('委托订单不存在');
      return { valid: false, errors, warnings, orderValid: false, marketLiquidity: 'none', ruleActive: false, stockTradable: false };
    }

    if (trade.trade_status !== 'pending' && trade.trade_status !== 'success' && trade.trade_status !== 'approved') {
      errors.push(`委托状态为${trade.trade_status}，无法撮合`);
      orderValid = false;
    }

    const stock = await db.StockQuote.findByPk(trade.stock_id);
    if (!stock) {
      errors.push('股票不存在');
      stockTradable = false;
    } else {
      if (stock.status === 'suspended') {
        errors.push(`股票${stock.stock_name}已停牌，自动暂停撮合`);
        stockTradable = false;
      } else if (stock.status === 'delisted') {
        errors.push(`股票${stock.stock_name}已退市，自动暂停撮合`);
        stockTradable = false;
      } else if (stock.status !== 'trading') {
        warnings.push(`股票状态为${stock.status}，请关注`);
      }

      const volume = Number(stock.volume || 0);
      if (volume > 10000000) {
        marketLiquidity = 'high';
      } else if (volume > 1000000) {
        marketLiquidity = 'medium';
      } else if (volume > 100000) {
        marketLiquidity = 'low';
      } else {
        marketLiquidity = 'none';
        warnings.push('市场流动性不足，撮合可能延迟');
      }
    }

    const session = isInTradingSession();
    if (!session.inSession) {
      warnings.push(`当前为${session.currentPeriod}，撮合规则未生效`);
      ruleActive = false;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      orderValid,
      marketLiquidity,
      ruleActive,
      stockTradable,
    };
  }

  async executeMatching(id: number): Promise<IMatchingResult> {
    const validation = await this.validateMatchingOrder(id);
    if (!validation.valid) {
      return {
        success: false,
        matchStatus: 'failed',
        matchPrice: 0,
        matchQuantity: 0,
        matchAmount: 0,
        remainQuantity: 0,
        trade: null,
      };
    }

    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      return {
        success: false,
        matchStatus: 'failed',
        matchPrice: 0,
        matchQuantity: 0,
        matchAmount: 0,
        remainQuantity: 0,
        trade: null,
      };
    }

    const stock = await db.StockQuote.findByPk(trade.stock_id);
    const marketPrice = Number(stock?.current_price || 0);
    const orderPrice = Number(trade.price);
    const orderQuantity = Number(trade.quantity);

    const priceDeviation = marketPrice > 0 ? Math.abs(orderPrice - marketPrice) / marketPrice : 0;
    if (priceDeviation > MATCHING_PRICE_DEVIATION_LIMIT) {
      return {
        success: false,
        matchStatus: 'failed',
        matchPrice: 0,
        matchQuantity: 0,
        matchAmount: 0,
        remainQuantity: orderQuantity,
        trade,
      };
    }

    const matchPrice = orderPrice;
    const liquidity = Number(stock?.volume || 0);
    let matchQuantity = orderQuantity;
    let matchStatus: 'full' | 'partial' | 'failed' = 'full';

    if (liquidity < orderQuantity * 0.3) {
      matchQuantity = Math.floor(liquidity / 100) * 100;
      if (matchQuantity <= 0) {
        matchStatus = 'failed';
        matchQuantity = 0;
      } else {
        matchStatus = 'partial';
      }
    }

    if (matchStatus === 'failed') {
      return {
        success: false,
        matchStatus: 'failed',
        matchPrice: 0,
        matchQuantity: 0,
        matchAmount: 0,
        remainQuantity: orderQuantity,
        trade,
      };
    }

    const matchAmount = Number((matchPrice * matchQuantity).toFixed(2));
    const remainQuantity = orderQuantity - matchQuantity;

    const t = await db.sequelize.transaction();
    try {
      const updateData: any = {
        trade_status: matchStatus === 'full' ? 'dealed' : 'partial_dealed',
        trade_amount: matchAmount,
      };
      if (matchStatus === 'full') {
        updateData.quantity = matchQuantity;
      }

      await db.Trade.update(updateData, { where: { id }, transaction: t });

      if (matchStatus === 'full') {
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
            matchQuantity,
            matchPrice,
            matchAmount,
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
            matchQuantity,
            matchPrice,
            matchAmount,
            t,
          );
        }

        await customerAssetService.updateAfterTrade(trade, t);
        await fundFlowService.createFlowFromTrade(trade, t);
      } else {
        if (trade.direction === 'buy') {
          const totalCost = matchAmount + Number(trade.total_fee || 0) * (matchQuantity / orderQuantity);
          await customerAssetService.deductFrozenAmount(
            trade.customer_id,
            Number(totalCost.toFixed(2)),
            t,
          );
          await customerHoldingService.updateHoldingAfterTrade(
            trade.customer_id,
            trade.stock_id,
            'buy',
            matchQuantity,
            matchPrice,
            matchAmount,
            t,
          );
        } else {
          await customerHoldingService.deductFrozenQuantity(
            trade.customer_id,
            trade.stock_id,
            matchQuantity,
            t,
          );
          await customerHoldingService.updateHoldingAfterTrade(
            trade.customer_id,
            trade.stock_id,
            'sell',
            matchQuantity,
            matchPrice,
            matchAmount,
            t,
          );
        }

        await fundFlowService.createFlowFromTrade(trade, t);
      }

      await t.commit();
      const updatedTrade = await db.Trade.findByPk(id);

      return {
        success: true,
        matchStatus,
        matchPrice,
        matchQuantity,
        matchAmount,
        remainQuantity,
        trade: updatedTrade,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getMatchingOrders(params: {
    page: number;
    pageSize: number;
    matchStatus?: string;
    stockCode?: string;
    direction?: string;
  }) {
    const { page, pageSize, matchStatus, stockCode, direction } = params;
    const where: any = {
      trade_status: { [Op.in]: ['pending', 'success', 'approved', 'partial_dealed', 'dealed'] },
    };

    if (matchStatus === 'pending') {
      where.trade_status = { [Op.in]: ['pending', 'success', 'approved'] };
    } else if (matchStatus === 'partial') {
      where.trade_status = 'partial_dealed';
    } else if (matchStatus === 'full') {
      where.trade_status = 'dealed';
    }

    if (stockCode) {
      where.stock_code = { [Op.like]: `%${stockCode}%` };
    }
    if (direction) {
      where.direction = direction;
    }

    const { rows, count } = await db.Trade.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [
        ['price', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getMatchingProgress() {
    const total = await db.Trade.count({
      where: { trade_status: { [Op.in]: ['pending', 'success', 'approved'] } },
    });
    const partialDealed = await db.Trade.count({
      where: { trade_status: 'partial_dealed' },
    });
    const fullDealed = await db.Trade.count({
      where: { trade_status: 'dealed' },
    });
    const failed = await db.Trade.count({
      where: { trade_status: 'failed' },
    });
    const paused = await db.Trade.count({
      where: { trade_status: 'cancelled' },
    });

    const dealedAmount = await db.Trade.sum('trade_amount', {
      where: { trade_status: { [Op.in]: ['dealed', 'partial_dealed'] } },
    });

    return {
      total,
      partialDealed,
      fullDealed,
      failed,
      paused,
      dealedAmount: Number(dealedAmount || 0).toFixed(2),
      progressRate: total + partialDealed + fullDealed > 0
        ? ((fullDealed / (total + partialDealed + fullDealed)) * 100).toFixed(1)
        : '0.0',
    };
  }

  async batchControlOrders(ids: number[], action: 'pause' | 'resume' | 'clear', operatorId: number) {
    const results: Array<{ id: number; success: boolean; error?: string }> = [];

    for (const id of ids) {
      try {
        const trade = await db.Trade.findByPk(id);
        if (!trade) {
          results.push({ id, success: false, error: '订单不存在' });
          continue;
        }

        if (action === 'pause') {
          if (trade.trade_status !== 'pending' && trade.trade_status !== 'success' && trade.trade_status !== 'approved') {
            results.push({ id, success: false, error: '当前状态不可暂停' });
            continue;
          }
          await db.Trade.update(
            { trade_status: 'paused', remark: `管理员${operatorId}暂停撮合` },
            { where: { id } },
          );
        } else if (action === 'resume') {
          if (trade.trade_status !== 'paused') {
            results.push({ id, success: false, error: '当前状态不可恢复' });
            continue;
          }
          await db.Trade.update(
            { trade_status: 'pending', remark: `管理员${operatorId}恢复撮合` },
            { where: { id } },
          );
        } else if (action === 'clear') {
          if (trade.trade_status !== 'pending' && trade.trade_status !== 'paused' && trade.trade_status !== 'success' && trade.trade_status !== 'approved') {
            results.push({ id, success: false, error: '当前状态不可清空' });
            continue;
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
          } catch (err) {
            await t.rollback();
            throw err;
          }
        }

        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      total: ids.length,
      successCount,
      failedCount,
      results,
    };
  }

  async batchExecuteMatching(ids: number[]) {
    const results: Array<{
      id: number;
      success: boolean;
      matchStatus?: string;
      matchQuantity?: number;
      matchAmount?: number;
      error?: string;
    }> = [];

    const sortedTrades = await db.Trade.findAll({
      where: {
        id: { [Op.in]: ids },
        trade_status: { [Op.in]: ['pending', 'success', 'approved'] },
      },
      order: [
        ['price', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });

    for (const trade of sortedTrades) {
      try {
        const result = await this.executeMatching(trade.id);
        results.push({
          id: trade.id,
          success: result.success,
          matchStatus: result.matchStatus,
          matchQuantity: result.matchQuantity,
          matchAmount: result.matchAmount,
        });
      } catch (error: any) {
        results.push({
          id: trade.id,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const partialCount = results.filter(r => r.matchStatus === 'partial').length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      total: ids.length,
      successCount,
      partialCount,
      failedCount,
      results,
    };
  }

  async getMatchingTrace(id: number): Promise<IMatchingTrace> {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }

    const stock = await db.StockQuote.findByPk(trade.stock_id);
    const marketPrice = Number(stock?.current_price || 0);
    const orderPrice = Number(trade.price);
    const priceDeviation = marketPrice > 0 ? Math.abs(orderPrice - marketPrice) / marketPrice : 0;

    const traceNodes: Array<{ name: string; passed: boolean; message: string; time: string }> = [];

    traceNodes.push({
      name: '委托提交',
      passed: true,
      message: `委托价格${orderPrice}，数量${Number(trade.quantity)}`,
      time: trade.created_at?.toISOString() || new Date().toISOString(),
    });

    const stockTradable = stock?.status === 'trading';
    traceNodes.push({
      name: '股票状态校验',
      passed: stockTradable,
      message: stockTradable ? '股票正常交易中' : `股票状态：${stock?.status || '未知'}`,
      time: trade.created_at?.toISOString() || new Date().toISOString(),
    });

    traceNodes.push({
      name: '撮合规则校验',
      passed: true,
      message: '价格优先、时间优先',
      time: trade.created_at?.toISOString() || new Date().toISOString(),
    });

    const priceConsistent = priceDeviation <= MATCHING_PRICE_DEVIATION_LIMIT;
    traceNodes.push({
      name: '价格一致性校验',
      passed: priceConsistent,
      message: `委托价${orderPrice}，市场价${marketPrice}，偏差${(priceDeviation * 100).toFixed(2)}%`,
      time: new Date().toISOString(),
    });

    if (trade.trade_status === 'dealed' || trade.trade_status === 'partial_dealed') {
      traceNodes.push({
        name: '撮合成交',
        passed: true,
        message: trade.trade_status === 'dealed' ? '全部成交' : '部分成交',
        time: trade.updated_at?.toISOString() || new Date().toISOString(),
      });

      if (trade.trade_status === 'dealed') {
        traceNodes.push({
          name: '持仓资金更新',
          passed: true,
          message: '持仓与资金已同步更新',
          time: trade.updated_at?.toISOString() || new Date().toISOString(),
        });
      }
    } else if (trade.trade_status === 'failed') {
      traceNodes.push({
        name: '撮合失败',
        passed: false,
        message: '撮合失败，订单已驳回',
        time: trade.updated_at?.toISOString() || new Date().toISOString(),
      });
    }

    return {
      orderId: trade.id,
      tradeNo: trade.trade_no,
      matchRule: '价格优先、时间优先',
      matchPrice: orderPrice,
      matchQuantity: Number(trade.quantity),
      matchAmount: Number(trade.trade_amount),
      marketPrice,
      priceDeviation,
      matchedAt: trade.updated_at?.toISOString() || '',
      counterParty: trade.direction === 'buy' ? '卖方对手' : '买方对手',
      priceConsistent,
      traceNodes,
    };
  }

  async validateStatusOperation(id: number, targetStatus: string): Promise<IStatusValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let allowedActions: string[] = [];

    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      return {
        valid: false,
        errors: ['委托订单不存在'],
        warnings: [],
        allowedActions: [],
        currentStatus: '',
        targetStatus,
      };
    }

    const currentStatus = trade.trade_status;
    allowedActions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedActions.includes(targetStatus)) {
      errors.push(`状态${currentStatus}不允许变更为${targetStatus}，允许的操作：${allowedActions.join(', ') || '无'}`);
    }

    if (currentStatus === 'dealed') {
      errors.push('已成交订单禁止撤销');
    }
    if (currentStatus === 'cancelled') {
      errors.push('已撤单订单禁止重新撮合');
    }
    if (currentStatus === 'failed') {
      errors.push('撮合失败订单禁止状态变更');
    }
    if (currentStatus === 'rejected') {
      errors.push('已驳回订单禁止状态变更');
    }

    const session = isInTradingSession();
    if (!session.inSession && targetStatus !== 'cancelled' && targetStatus !== 'failed') {
      warnings.push(`当前为${session.currentPeriod}，非交易时段操作需谨慎`);
    }

    if (targetStatus === 'cancelled') {
      if (trade.frozen_amount > 0 || trade.frozen_quantity > 0) {
        warnings.push('撤销后冻结资金/持仓将自动解冻');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      allowedActions,
      currentStatus,
      targetStatus,
    };
  }

  async manualChangeStatus(
    id: number,
    targetStatus: string,
    _operatorId: number,
    reason: string,
  ): Promise<IStatusChangeResult> {
    const validation = await this.validateStatusOperation(id, targetStatus);
    if (!validation.valid) {
      return {
        success: false,
        tradeId: id,
        previousStatus: validation.currentStatus,
        newStatus: targetStatus,
        changeType: 'manual',
        dataConsistent: false,
        fundDiff: 0,
        holdingDiff: 0,
        message: validation.errors.join('; '),
      };
    }

    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      return {
        success: false,
        tradeId: id,
        previousStatus: '',
        newStatus: targetStatus,
        changeType: 'manual',
        dataConsistent: false,
        fundDiff: 0,
        holdingDiff: 0,
        message: '委托订单不存在',
      };
    }

    const previousStatus = trade.trade_status;

    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    const fundBefore = Number(customer?.available_amount || 0);
    let holdingBefore = 0;
    if (trade.direction === 'sell') {
      const holding = await db.CustomerHolding.findOne({
        where: { customer_id: trade.customer_id, stock_id: trade.stock_id },
      });
      holdingBefore = Number(holding?.available_quantity || 0);
    }

    const t = await db.sequelize.transaction();
    try {
      await db.Trade.update(
        {
          trade_status: targetStatus,
          remark: reason || `手动变更为${targetStatus}`,
        },
        { where: { id }, transaction: t },
      );

      if (targetStatus === 'cancelled') {
        if (trade.direction === 'buy' && Number(trade.frozen_amount || 0) > 0) {
          await customerAssetService.unfreezeAmount(
            trade.customer_id,
            Number(trade.frozen_amount),
            t,
          );
        } else if (trade.direction === 'sell' && Number(trade.frozen_quantity || 0) > 0) {
          await customerHoldingService.unfreezeQuantity(
            trade.customer_id,
            trade.stock_id,
            Number(trade.frozen_quantity),
            t,
          );
        }
      }

      if (targetStatus === 'dealed' || targetStatus === 'partial_dealed') {
        if (trade.direction === 'buy' && Number(trade.frozen_amount || 0) > 0) {
          await customerAssetService.deductFrozenAmount(
            trade.customer_id,
            Number(trade.frozen_amount),
            t,
          );
          await customerHoldingService.updateHoldingAfterTrade(
            trade.customer_id,
            trade.stock_id,
            'buy',
            Number(trade.quantity),
            Number(trade.price),
            Number(trade.trade_amount || 0),
            t,
          );
        } else if (trade.direction === 'sell' && Number(trade.frozen_quantity || 0) > 0) {
          await customerHoldingService.deductFrozenQuantity(
            trade.customer_id,
            trade.stock_id,
            Number(trade.frozen_quantity),
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
        await fundFlowService.createFlowFromTrade(trade, t);
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    const updatedCustomer = await db.CustomerAsset.findByPk(trade.customer_id);
    const fundAfter = Number(updatedCustomer?.available_amount || 0);
    let holdingAfter = 0;
    if (trade.direction === 'sell') {
      const updatedHolding = await db.CustomerHolding.findOne({
        where: { customer_id: trade.customer_id, stock_id: trade.stock_id },
      });
      holdingAfter = Number(updatedHolding?.available_quantity || 0);
    }

    const fundDiff = Number((fundAfter - fundBefore).toFixed(2));
    const holdingDiff = holdingAfter - holdingBefore;
    const dataConsistent = this.validateDataConsistency(trade, targetStatus, fundDiff, holdingDiff);

    return {
      success: true,
      tradeId: id,
      previousStatus,
      newStatus: targetStatus,
      changeType: 'manual',
      dataConsistent,
      fundDiff,
      holdingDiff,
      message: `状态已从${previousStatus}变更为${targetStatus}`,
    };
  }

  private validateDataConsistency(
    trade: any,
    targetStatus: string,
    fundDiff: number,
    holdingDiff: number,
  ): boolean {
    if (targetStatus === 'cancelled') {
      if (trade.direction === 'buy' && fundDiff <= 0 && Number(trade.frozen_amount || 0) > 0) {
        return false;
      }
      if (trade.direction === 'sell' && holdingDiff <= 0 && Number(trade.frozen_quantity || 0) > 0) {
        return false;
      }
    }
    if (targetStatus === 'dealed') {
      if (trade.direction === 'buy' && fundDiff >= 0) {
        return false;
      }
      if (trade.direction === 'sell' && holdingDiff >= 0) {
        return false;
      }
    }
    return true;
  }

  async batchChangeStatus(
    ids: number[],
    targetStatus: string,
    operatorId: number,
    reason: string,
    filters?: {
      riskLevel?: string;
      minAmount?: number;
      maxAmount?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    total: number;
    successCount: number;
    failedCount: number;
    results: IStatusChangeResult[];
  }> {
    let filteredIds = ids;

    if (filters) {
      const where: any = { id: { [Op.in]: ids } };
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.trade_amount = {};
        if (filters.minAmount !== undefined) where.trade_amount[Op.gte] = filters.minAmount;
        if (filters.maxAmount !== undefined) where.trade_amount[Op.lte] = filters.maxAmount;
      }
      if (filters.startDate || filters.endDate) {
        where.created_at = {};
        if (filters.startDate) where.created_at[Op.gte] = filters.startDate;
        if (filters.endDate) where.created_at[Op.lte] = filters.endDate;
      }

      const include: any[] = [];
      if (filters.riskLevel) {
        include.push({
          model: db.CustomerAsset,
          as: 'customer',
          where: { risk_level: filters.riskLevel },
          attributes: [],
        });
      }

      const trades = await db.Trade.findAll({ where, include, attributes: ['id'] });
      filteredIds = trades.map(t => t.id);
    }

    const results: IStatusChangeResult[] = [];
    for (const id of filteredIds) {
      try {
        const result = await this.manualChangeStatus(id, targetStatus, operatorId, reason);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          tradeId: id,
          previousStatus: '',
          newStatus: targetStatus,
          changeType: 'manual',
          dataConsistent: false,
          fundDiff: 0,
          holdingDiff: 0,
          message: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return { total: filteredIds.length, successCount, failedCount, results };
  }

  async getStatusTrace(id: number): Promise<{
    orderId: number;
    tradeNo: string;
    currentStatus: string;
    records: IStatusTraceRecord[];
    sequenceValid: boolean;
    sequenceErrors: string[];
    dataSummary: {
      totalFundChange: number;
      totalHoldingChange: number;
      allConsistent: boolean;
    };
  }> {
    const trade = await db.Trade.findByPk(id);
    if (!trade) {
      throw new AppError(404, 'Trade not found');
    }

    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    let currentFund = Number(customer?.available_amount || 0);
    let currentHolding = 0;
    if (trade.direction === 'sell') {
      const holding = await db.CustomerHolding.findOne({
        where: { customer_id: trade.customer_id, stock_id: trade.stock_id },
      });
      currentHolding = Number(holding?.available_quantity || 0);
    }

    const statusHistory: Array<{ status: string; time: string }> = [
      { status: 'pending', time: trade.created_at?.toISOString() || '' },
    ];

    if (trade.trade_status === 'dealed' || trade.trade_status === 'partial_dealed') {
      statusHistory.push({
        status: trade.trade_status,
        time: trade.updated_at?.toISOString() || '',
      });
    } else if (trade.trade_status !== 'pending') {
      statusHistory.push({
        status: trade.trade_status,
        time: trade.updated_at?.toISOString() || '',
      });
    }

    const records: IStatusTraceRecord[] = [];
    const sequenceErrors: string[] = [];
    let prevStatus = '';

    for (let i = 0; i < statusHistory.length; i++) {
      const entry = statusHistory[i];
      const fromStatus = i === 0 ? '' : statusHistory[i - 1].status;

      if (prevStatus && STATUS_TRANSITIONS[prevStatus] && !STATUS_TRANSITIONS[prevStatus].includes(entry.status) && entry.status !== 'pending') {
        sequenceErrors.push(`状态从${prevStatus}到${entry.status}的变更不合法`);
      }

      const fundAfter = i === statusHistory.length - 1 ? currentFund : 0;
      const holdingAfter = i === statusHistory.length - 1 ? currentHolding : 0;
      const fundDiff = i === statusHistory.length - 1 ? fundAfter : 0;

      records.push({
        id: i + 1,
        tradeId: trade.id,
        tradeNo: trade.trade_no,
        fromStatus,
        toStatus: entry.status,
        changeType: i === 0 ? 'system' : 'manual',
        operatorId: trade.auditor_id,
        operatorName: trade.auditor_id ? `操作员${trade.auditor_id}` : '系统',
        reason: trade.remark || '',
        fundBefore: 0,
        fundAfter: fundAfter,
        fundDiff,
        holdingBefore: 0,
        holdingAfter,
        holdingDiff: 0,
        dataConsistent: true,
        createdAt: entry.time,
      });

      prevStatus = entry.status;
    }

    const totalFundChange = records.reduce((sum, r) => sum + r.fundDiff, 0);
    const totalHoldingChange = records.reduce((sum, r) => sum + r.holdingDiff, 0);
    const allConsistent = records.every(r => r.dataConsistent);

    return {
      orderId: trade.id,
      tradeNo: trade.trade_no,
      currentStatus: trade.trade_status,
      records,
      sequenceValid: sequenceErrors.length === 0,
      sequenceErrors,
      dataSummary: {
        totalFundChange: Number(totalFundChange.toFixed(2)),
        totalHoldingChange,
        allConsistent,
      },
    };
  }
}

export default new TradeService();
