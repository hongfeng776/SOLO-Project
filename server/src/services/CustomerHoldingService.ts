import { Op } from 'sequelize';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';
import { CacheUtil } from '@utils/cache';
import { HoldingLockStatus, CustomerStatus } from '@enums/index';
import operationLogService from '@services/OperationLogService';
import customerAssetService from '@services/CustomerAssetService';

const LIST_CACHE_TTL = 60;
const DETAIL_CACHE_TTL = 60;
const LIST_CACHE_PREFIX = 'holding:list:';
const CUSTOMER_CACHE_PREFIX = 'holding:customer:';

interface IHoldingAdjustParams {
  holdingId: number;
  adjustType: 'quantity' | 'cost_price' | 'remark';
  newQuantity?: number;
  newCostPrice?: number;
  reason: string;
}

interface IBatchLockResult {
  total: number;
  success: number;
  failed: number;
  failedList: Array<{ holdingId: number; reason: string }>;
}

class CustomerHoldingService {
  async validateHoldingOperation(holdingId: number, operationType: 'lock' | 'unlock' | 'adjust' | 'query') {
    const holding = await db.CustomerHolding.findByPk(holdingId);
    if (!holding) {
      throw new AppError(404, '持仓记录不存在');
    }

    const customer = await db.CustomerAsset.findByPk(holding.customer_id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }

    if (customer.status === CustomerStatus.FROZEN && operationType === 'adjust') {
      throw new AppError(400, '客户账户已冻结，禁止持仓调整');
    }

    if (operationType === 'lock' && holding.lock_status === HoldingLockStatus.LOCKED) {
      throw new AppError(400, '该持仓已处于锁定状态');
    }

    if (operationType === 'unlock' && holding.lock_status === HoldingLockStatus.NORMAL) {
      throw new AppError(400, '该持仓未锁定，无需解锁');
    }

    if (operationType === 'adjust' && holding.lock_status === HoldingLockStatus.LOCKED) {
      throw new AppError(400, '持仓已锁定，禁止调整');
    }

    const stock = await db.StockQuote.findByPk(holding.stock_id);
    if (stock && stock.trade_status === 'delisted' && operationType === 'adjust') {
      throw new AppError(400, '股票已退市，禁止持仓调整');
    }

    return { holding, customer, stock };
  }

  validateAdjustmentData(data: IHoldingAdjustParams) {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.adjustType === 'quantity') {
      if (data.newQuantity === undefined || data.newQuantity === null) {
        errors.push({ field: 'newQuantity', message: '调整数量不能为空' });
      } else if (data.newQuantity < 0) {
        errors.push({ field: 'newQuantity', message: '持仓数量不能为负数' });
      }
    }

    if (data.adjustType === 'cost_price') {
      if (data.newCostPrice === undefined || data.newCostPrice === null) {
        errors.push({ field: 'newCostPrice', message: '成本价不能为空' });
      } else if (data.newCostPrice <= 0) {
        errors.push({ field: 'newCostPrice', message: '成本价必须大于0' });
      }
    }

    if (!data.reason || data.reason.trim() === '') {
      errors.push({ field: 'reason', message: '调整原因不能为空' });
    }

    return { valid: errors.length === 0, errors };
  }

  async getHoldingList(params: {
    page: number;
    pageSize: number;
    customerId?: number;
    stockCode?: string;
    lockStatus?: string;
    riskLevel?: string;
    keyword?: string;
  }) {
    const { page, pageSize, customerId, stockCode, lockStatus, riskLevel, keyword } = params;
    const where: any = {};

    if (customerId) {
      where.customer_id = customerId;
    }
    if (stockCode) {
      where.stock_code = { [Op.like]: `%${stockCode}%` };
    }
    if (lockStatus) {
      where.lock_status = lockStatus;
    }
    if (keyword) {
      where[Op.or] = [
        { stock_code: { [Op.like]: `%${keyword}%` } },
        { stock_name: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (riskLevel) {
      const customers = await db.CustomerAsset.findAll({
        where: { risk_level: riskLevel },
        attributes: ['id'],
      });
      const customerIds = customers.map((c) => c.id);
      where.customer_id = customerIds.length > 0
        ? { [Op.in]: customerIds }
        : customerId ? { [Op.and]: [{ [Op.in]: customerIds }, customerId] } : { [Op.in]: customerIds };
    }

    const { rows, count } = await db.CustomerHolding.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['market_value', 'DESC']],
    });

    const listWithCustomer = await Promise.all(
      rows.map(async (holding) => {
        const customer = await db.CustomerAsset.findByPk(holding.customer_id, {
          attributes: ['id', 'customer_name', 'risk_level', 'status'],
        });
        return {
          ...holding.toJSON(),
          customer_name: customer?.customer_name || '',
          customer_risk_level: customer?.risk_level || '',
          customer_status: customer?.status || '',
        };
      }),
    );

    return { list: listWithCustomer, total: count, page, pageSize };
  }

  async getHoldingByCustomer(customerId: number) {
    return customerHoldingDAO.findByCustomerId(customerId);
  }

  async getHoldingsByCustomerId(customerId: number) {
    const cacheKey = `${CUSTOMER_CACHE_PREFIX}${customerId}`;
    return CacheUtil.getOrSet(cacheKey, DETAIL_CACHE_TTL, async () => {
      return customerHoldingDAO.findByCustomerId(customerId);
    });
  }

  async getHoldingByCustomerAndStock(customerId: number, stockId: number) {
    return customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
  }

  async lockHolding(holdingId: number, reason: string, user?: { userId: number; username: string }) {
    const { holding, customer } = await this.validateHoldingOperation(holdingId, 'lock');

    if (!reason || reason.trim() === '') {
      throw new AppError(400, '锁定原因不能为空');
    }

    const now = new Date();
    await db.CustomerHolding.update(
      {
        lock_status: HoldingLockStatus.LOCKED,
        lock_reason: reason,
        locked_by: user?.userId,
        locked_by_name: user?.username,
        locked_at: now,
      },
      { where: { id: holdingId } },
    );

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '持仓资产管控',
      operation: `锁定持仓: ${customer.customer_name} - ${holding.stock_code} ${holding.stock_name}`,
      operation_type: 'update',
      target_type: 'holding',
      target_id: holdingId,
      request_params: { holdingId, reason },
      operation_status: 'success',
      remark: `锁定原因: ${reason}`,
    });

    await this.clearHoldingCache(holding.customer_id);
    return db.CustomerHolding.findByPk(holdingId);
  }

  async unlockHolding(holdingId: number, user?: { userId: number; username: string }) {
    const { holding, customer } = await this.validateHoldingOperation(holdingId, 'unlock');

    const now = new Date();
    await db.CustomerHolding.update(
      {
        lock_status: HoldingLockStatus.NORMAL,
        unlocked_by: user?.userId,
        unlocked_by_name: user?.username,
        unlocked_at: now,
      },
      { where: { id: holdingId } },
    );

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '持仓资产管控',
      operation: `解锁持仓: ${customer.customer_name} - ${holding.stock_code} ${holding.stock_name}`,
      operation_type: 'update',
      target_type: 'holding',
      target_id: holdingId,
      request_params: { holdingId },
      operation_status: 'success',
    });

    await this.clearHoldingCache(holding.customer_id);
    return db.CustomerHolding.findByPk(holdingId);
  }

  async adjustHolding(data: IHoldingAdjustParams, user?: { userId: number; username: string }) {
    const validation = this.validateAdjustmentData(data);
    if (!validation.valid) {
      throw new AppError(400, JSON.stringify(validation.errors));
    }

    const { holding, customer } = await this.validateHoldingOperation(data.holdingId, 'adjust');
    const beforeData = { ...holding.toJSON() };
    const now = new Date();
    const updateData: any = {
      last_adjust_by: user?.userId,
      last_adjust_by_name: user?.username,
      last_adjust_at: now,
    };

    if (data.adjustType === 'quantity' && data.newQuantity !== undefined) {
      if (data.newQuantity < 0) {
        throw new AppError(400, '持仓数量不能为负数');
      }

      const stock = await db.StockQuote.findByPk(holding.stock_id);
      const totalVolume = Number(stock?.volume || 0);
      if (totalVolume > 0 && data.newQuantity > totalVolume) {
        throw new AppError(400, '持仓数量不能超过市场总量');
      }

      const diff = data.newQuantity - Number(holding.total_quantity || 0);
      updateData.total_quantity = data.newQuantity;
      updateData.available_quantity = Number(holding.available_quantity || 0) + diff;
      updateData.holding_quantity = data.newQuantity;

      if (data.newQuantity === 0) {
        updateData.available_quantity = 0;
        updateData.frozen_quantity = 0;
        updateData.total_cost = 0;
      }
    }

    if (data.adjustType === 'cost_price' && data.newCostPrice !== undefined) {
      if (data.newCostPrice <= 0) {
        throw new AppError(400, '成本价必须大于0');
      }
      updateData.cost_price = data.newCostPrice;
      updateData.total_cost = Number((data.newCostPrice * Number(holding.total_quantity || 0)).toFixed(2));
    }

    await db.CustomerHolding.update(updateData, { where: { id: data.holdingId } });

    await this.calculateFloatingProfit(holding.customer_id, holding.stock_id);

    await this.syncCustomerAsset(holding.customer_id);

    const afterData = await db.CustomerHolding.findByPk(data.holdingId);

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '持仓资产管控',
      operation: `调整持仓: ${customer.customer_name} - ${holding.stock_code} ${holding.stock_name} (${data.adjustType})`,
      operation_type: 'update',
      target_type: 'holding',
      target_id: data.holdingId,
      request_params: { before: beforeData, after: updateData, reason: data.reason },
      operation_status: 'success',
      remark: `调整原因: ${data.reason}`,
    });

    await this.clearHoldingCache(holding.customer_id);
    return {
      holding: afterData,
      changeDetail: {
        before: beforeData,
        after: afterData,
        fields: Object.keys(updateData),
      },
    };
  }

  async batchLockHolding(holdingIds: number[], reason: string, user?: { userId: number; username: string }) {
    if (!reason || reason.trim() === '') {
      throw new AppError(400, '锁定原因不能为空');
    }

    const result: IBatchLockResult = {
      total: holdingIds.length,
      success: 0,
      failed: 0,
      failedList: [],
    };

    for (const id of holdingIds) {
      try {
        await this.lockHolding(id, reason, user);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.failedList.push({ holdingId: id, reason: err.message || '操作失败' });
      }
    }

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '持仓资产管控',
      operation: `批量锁定持仓: 共${result.total}条，成功${result.success}条，失败${result.failed}条`,
      operation_type: 'update',
      target_type: 'holding',
      request_params: { holdingIds, reason, result },
      operation_status: 'success',
    });

    return result;
  }

  async batchUnlockHolding(holdingIds: number[], user?: { userId: number; username: string }) {
    const result: IBatchLockResult = {
      total: holdingIds.length,
      success: 0,
      failed: 0,
      failedList: [],
    };

    for (const id of holdingIds) {
      try {
        await this.unlockHolding(id, user);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.failedList.push({ holdingId: id, reason: err.message || '操作失败' });
      }
    }

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '持仓资产管控',
      operation: `批量解锁持仓: 共${result.total}条，成功${result.success}条，失败${result.failed}条`,
      operation_type: 'update',
      target_type: 'holding',
      request_params: { holdingIds, result },
      operation_status: 'success',
    });

    return result;
  }

  async batchLockByFilter(params: {
    stockCode?: string;
    minMarketValue?: number;
    maxMarketValue?: number;
    riskLevel?: string;
    reason: string;
  }, user?: { userId: number; username: string }) {
    const where: any = { lock_status: HoldingLockStatus.NORMAL };

    if (params.stockCode) {
      where.stock_code = { [Op.like]: `%${params.stockCode}%` };
    }
    if (params.minMarketValue !== undefined) {
      where.market_value = { ...where.market_value, [Op.gte]: params.minMarketValue };
    }
    if (params.maxMarketValue !== undefined) {
      where.market_value = { ...where.market_value, [Op.lte]: params.maxMarketValue };
    }
    if (params.riskLevel) {
      const customers = await db.CustomerAsset.findAll({
        where: { risk_level: params.riskLevel },
        attributes: ['id'],
      });
      const customerIds = customers.map((c) => c.id);
      if (customerIds.length === 0) {
        return { total: 0, success: 0, failed: 0, failedList: [] };
      }
      where.customer_id = { [Op.in]: customerIds };
    }

    const holdings = await db.CustomerHolding.findAll({ where, attributes: ['id'] });
    const holdingIds = holdings.map((h) => h.id);

    if (holdingIds.length === 0) {
      return { total: 0, success: 0, failed: 0, failedList: [] };
    }

    return this.batchLockHolding(holdingIds, params.reason, user);
  }

  async getHoldingAuditTrail(holdingId: number) {
    const holding = await db.CustomerHolding.findByPk(holdingId);
    if (!holding) {
      throw new AppError(404, '持仓记录不存在');
    }

    const customer = await db.CustomerAsset.findByPk(holding.customer_id, {
      attributes: ['id', 'customer_name', 'risk_level', 'status'],
    });

    const tradeLogs = await db.Trade.findAll({
      where: {
        customer_id: holding.customer_id,
        stock_id: holding.stock_id,
        trade_status: 'success',
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    const operationLogs = await db.OperationLog.findAll({
      where: {
        target_type: 'holding',
        target_id: holdingId,
      },
      order: [['created_at', 'DESC']],
    });

    const tradeConsistency = this.checkTradeConsistency(holding, tradeLogs);
    const precisionCheck = this.checkMarketValuePrecision(holding);

    return {
      holding,
      customer,
      tradeLogs,
      operationLogs,
      consistencyCheck: tradeConsistency,
      precisionCheck,
    };
  }

  checkTradeConsistency(holding: any, tradeLogs: any[]) {
    const issues: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }> = [];

    if (Number(holding.total_quantity || 0) > 0 && tradeLogs.length === 0) {
      issues.push({
        type: 'no_trade_basis',
        message: '持仓有数量但无对应交易流水记录，可能为异常持仓',
        severity: 'high',
      });
    }

    const buyTrades = tradeLogs.filter((t) => t.trade_type === 'buy');
    const sellTrades = tradeLogs.filter((t) => t.trade_type === 'sell');
    const totalBuyQty = buyTrades.reduce((sum, t) => sum + Number(t.trade_quantity || 0), 0);
    const totalSellQty = sellTrades.reduce((sum, t) => sum + Number(t.trade_quantity || 0), 0);
    const expectedQty = totalBuyQty - totalSellQty;

    if (Math.abs(expectedQty - Number(holding.total_quantity || 0)) > 1) {
      issues.push({
        type: 'quantity_mismatch',
        message: `持仓数量(${holding.total_quantity})与交易流水计算数量(${expectedQty})不一致`,
        severity: 'high',
      });
    }

    const totalBuyAmount = buyTrades.reduce((sum, t) => sum + Number(t.trade_amount || 0), 0);
    const totalSellAmount = sellTrades.reduce((sum, t) => sum + Number(t.trade_amount || 0), 0);
    const expectedCost = totalBuyAmount - totalSellAmount;

    if (Number(holding.total_cost || 0) > 0 && Math.abs(Number(holding.total_cost) - expectedCost) > 1) {
      issues.push({
        type: 'cost_mismatch',
        message: `持仓成本(${holding.total_cost})与交易流水计算成本(${expectedCost.toFixed(2)})不一致`,
        severity: 'medium',
      });
    }

    return {
      passed: issues.filter((i) => i.severity === 'high').length === 0,
      issues,
    };
  }

  checkMarketValuePrecision(holding: any) {
    const issues: Array<{ field: string; message: string }> = [];
    const totalQty = Number(holding.total_quantity || 0);
    const currentPrice = Number(holding.current_price || 0);
    const marketValue = Number(holding.market_value || 0);

    const expectedMarketValue = Number((totalQty * currentPrice).toFixed(2));
    if (marketValue > 0 && Math.abs(marketValue - expectedMarketValue) > 0.01) {
      issues.push({
        field: 'market_value',
        message: `市值(${marketValue})与计算值(${expectedMarketValue})精度不一致`,
      });
    }

    const totalCost = Number(holding.total_cost || 0);
    const floatingProfit = Number(holding.floating_profit || 0);
    const expectedProfit = Number((marketValue - totalCost).toFixed(2));
    if (Math.abs(floatingProfit - expectedProfit) > 0.01) {
      issues.push({
        field: 'floating_profit',
        message: `浮动盈亏(${floatingProfit})与计算值(${expectedProfit})精度不一致`,
      });
    }

    const floatingProfitRate = Number(holding.floating_profit_rate || 0);
    const expectedRate = totalCost > 0 ? Number(((floatingProfit / totalCost) * 100).toFixed(4)) : 0;
    if (Math.abs(floatingProfitRate - expectedRate) > 0.0001) {
      issues.push({
        field: 'floating_profit_rate',
        message: `盈亏比例(${floatingProfitRate})与计算值(${expectedRate})精度不一致`,
      });
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  async syncCustomerAsset(customerId: number) {
    const holdings = await customerHoldingDAO.findByCustomerId(customerId);
    const totalMarketValue = holdings.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + Number(h.total_cost || 0), 0);
    const totalFloatingProfit = totalMarketValue - totalCost;

    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) return;

    const availableAmount = Number(customer.available_amount || 0);
    const frozenAmount = Number(customer.frozen_amount || 0);
    const totalAsset = Number((totalMarketValue + availableAmount + frozenAmount).toFixed(2));

    await db.CustomerAsset.update(
      {
        total_asset: totalAsset,
        total_profit: Number(totalFloatingProfit.toFixed(2)),
        total_cost: Number(totalCost.toFixed(2)),
      },
      { where: { id: customerId } },
    );
  }

  async clearHoldingCache(customerId: number) {
    await CacheUtil.del(`${CUSTOMER_CACHE_PREFIX}${customerId}`);
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
  }

  async freezeQuantity(customerId: number, stockId: number, quantity: number, t?: Transaction) {
    const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    if (!holding) {
      throw new AppError(404, 'Holding not found');
    }
    if (holding.lock_status === HoldingLockStatus.LOCKED) {
      throw new AppError(400, '持仓已锁定，无法发起卖出委托');
    }
    const availableQty = Number(holding.available_quantity || 0);
    if (availableQty < quantity) {
      throw new AppError(400, 'Insufficient available quantity');
    }
    await db.CustomerHolding.update(
      {
        available_quantity: Number((availableQty - quantity).toFixed(0)),
        frozen_quantity: Number((Number(holding.frozen_quantity || 0) + quantity).toFixed(0)),
      },
      { where: { id: holding.id }, transaction: t },
    );
    await this.clearHoldingCache(customerId);
  }

  async unfreezeQuantity(customerId: number, stockId: number, quantity: number, t?: Transaction) {
    const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    if (!holding) {
      throw new AppError(404, 'Holding not found');
    }
    const frozenQty = Number(holding.frozen_quantity || 0);
    if (frozenQty < quantity) {
      throw new AppError(400, 'Insufficient frozen quantity');
    }
    await db.CustomerHolding.update(
      {
        available_quantity: Number((Number(holding.available_quantity || 0) + quantity).toFixed(0)),
        frozen_quantity: Number((frozenQty - quantity).toFixed(0)),
      },
      { where: { id: holding.id }, transaction: t },
    );
    await this.clearHoldingCache(customerId);
  }

  async deductFrozenQuantity(customerId: number, stockId: number, quantity: number, t?: Transaction) {
    const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    if (!holding) {
      throw new AppError(404, 'Holding not found');
    }
    const frozenQty = Number(holding.frozen_quantity || 0);
    if (frozenQty < quantity) {
      throw new AppError(400, 'Insufficient frozen quantity');
    }
    const totalQty = Number(holding.total_quantity || 0);
    await db.CustomerHolding.update(
      {
        total_quantity: Number((totalQty - quantity).toFixed(0)),
        frozen_quantity: Number((frozenQty - quantity).toFixed(0)),
      },
      { where: { id: holding.id }, transaction: t },
    );
    await this.clearHoldingCache(customerId);
  }

  async updateHoldingAfterTrade(
    customerId: number,
    stockId: number,
    direction: string,
    quantity: number,
    price: number,
    amount: number,
    t?: Transaction,
  ) {
    let holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    const stock = await db.StockQuote.findByPk(stockId);

    if (direction === 'buy') {
      if (!holding) {
        holding = await db.CustomerHolding.create(
          {
            customer_id: customerId,
            stock_id: stockId,
            stock_code: stock?.stock_code,
            stock_name: stock?.stock_name,
            total_quantity: quantity,
            available_quantity: quantity,
            frozen_quantity: 0,
            cost_price: price,
            total_cost: amount,
            current_price: Number(stock?.current_price || price),
            first_buy_date: new Date().toISOString().split('T')[0],
            lock_status: HoldingLockStatus.NORMAL,
          },
          { transaction: t },
        );
      } else {
        const oldTotalQty = Number(holding.total_quantity || 0);
        const oldTotalCost = Number(holding.total_cost || 0);
        const newTotalQty = oldTotalQty + quantity;
        const newTotalCost = oldTotalCost + amount;
        const newCostPrice = newTotalQty > 0 ? Number((newTotalCost / newTotalQty).toFixed(4)) : 0;

        await db.CustomerHolding.update(
          {
            total_quantity: newTotalQty,
            available_quantity: Number(holding.available_quantity || 0) + quantity,
            total_cost: Number(newTotalCost.toFixed(2)),
            cost_price: newCostPrice,
          },
          { where: { id: holding.id }, transaction: t },
        );
      }
    } else if (direction === 'sell') {
      if (!holding) {
        throw new AppError(404, 'Holding not found');
      }
      if (holding.lock_status === HoldingLockStatus.LOCKED) {
        throw new AppError(400, '持仓已锁定，无法卖出');
      }
      const oldTotalQty = Number(holding.total_quantity || 0);
      const oldCostPrice = Number(holding.cost_price || 0);
      const newTotalQty = oldTotalQty - quantity;
      const newTotalCost = newTotalQty > 0 ? Number((oldCostPrice * newTotalQty).toFixed(2)) : 0;

      await db.CustomerHolding.update(
        {
          total_quantity: newTotalQty,
          total_cost: newTotalCost,
        },
        { where: { id: holding.id }, transaction: t },
      );
    }

    await this.calculateFloatingProfit(customerId, stockId, t);
    await this.syncCustomerAsset(customerId);
  }

  async calculateFloatingProfit(customerId: number, stockId: number, t?: Transaction) {
    const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    if (!holding) {
      return;
    }
    const stock = await db.StockQuote.findByPk(stockId);
    if (!stock) {
      return;
    }
    const currentPrice = Number(stock.current_price || stock.close_price || 0);
    const totalQty = Number(holding.total_quantity || 0);
    const totalCost = Number(holding.total_cost || 0);
    const marketValue = Number((currentPrice * totalQty).toFixed(2));
    const floatingProfit = Number((marketValue - totalCost).toFixed(2));
    const floatingProfitRate = totalCost > 0 ? Number(((floatingProfit / totalCost) * 100).toFixed(4)) : 0;

    await db.CustomerHolding.update(
      {
        current_price: currentPrice,
        market_value: marketValue,
        floating_profit: floatingProfit,
        floating_profit_rate: floatingProfitRate,
      },
      { where: { id: holding.id }, transaction: t },
    );

    await this.clearHoldingCache(customerId);
    return db.CustomerHolding.findByPk(holding.id);
  }

  async syncHoldingsMarketValue() {
    const allHoldings = await db.CustomerHolding.findAll();
    const results = [];
    for (const holding of allHoldings) {
      try {
        const updated = await this.calculateFloatingProfit(
          holding.customer_id,
          holding.stock_id,
        );
        results.push(updated);
      } catch (err) {
        console.error(`Failed to sync holding ${holding.id}:`, err);
      }
    }

    const customerIds = [...new Set(allHoldings.map((h) => h.customer_id))];
    for (const customerId of customerIds) {
      try {
        await this.syncCustomerAsset(customerId);
      } catch (err) {
        console.error(`Failed to sync customer asset ${customerId}:`, err);
      }
    }

    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return results;
  }
}

export default new CustomerHoldingService();
