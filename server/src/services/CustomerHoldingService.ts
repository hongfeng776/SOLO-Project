import { Op } from 'sequelize';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';
import { CacheUtil } from '@utils/cache';

const LIST_CACHE_TTL = 60;
const DETAIL_CACHE_TTL = 60;
const LIST_CACHE_PREFIX = 'holding:list:';
const CUSTOMER_CACHE_PREFIX = 'holding:customer:';

class CustomerHoldingService {
  async getHoldingList(params: {
    page: number;
    pageSize: number;
    customerId?: number;
    productType?: string;
    status?: string;
    keyword?: string;
  }) {
    const { page, pageSize, customerId, keyword } = params;
    const filters = { customerId, keyword };
    const cacheKey = `${LIST_CACHE_PREFIX}${page}:${pageSize}:${JSON.stringify(filters)}`;

    return CacheUtil.getOrSet(cacheKey, LIST_CACHE_TTL, async () => {
      const where: any = {};

      if (customerId) {
        where.customer_id = customerId;
      }
      if (keyword) {
        where[Op.or] = [
          { stock_code: { [Op.like]: `%${keyword}%` } },
          { stock_name: { [Op.like]: `%${keyword}%` } },
        ];
      }

      const { rows, count } = await db.CustomerHolding.findAndCountAll({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: [['created_at', 'DESC']],
      });

      return { list: rows, total: count, page, pageSize };
    });
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

  async clearHoldingCache(customerId: number) {
    await CacheUtil.del(`${CUSTOMER_CACHE_PREFIX}${customerId}`);
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
  }

  async freezeQuantity(customerId: number, stockId: number, quantity: number, t?: Transaction) {
    const holding = await customerHoldingDAO.findByCustomerIdAndStock(customerId, stockId);
    if (!holding) {
      throw new AppError(404, 'Holding not found');
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
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return results;
  }
}

export default new CustomerHoldingService();
