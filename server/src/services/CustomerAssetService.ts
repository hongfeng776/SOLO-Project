import { Op } from 'sequelize';
import customerAssetDAO from '@dao/CustomerAssetDAO';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';
import Trade from '@models/Trade';

class CustomerAssetService {
  async getCustomerList(params: { page: number; pageSize: number; riskLevel?: string; customerType?: string; status?: string; keyword?: string }) {
    const { page, pageSize, riskLevel, customerType, status, keyword } = params;
    const where: any = {};

    if (riskLevel) {
      where.risk_level = riskLevel;
    }

    if (customerType) {
      where.customer_type = customerType;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where[Op.or] = [
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { id_card: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.CustomerAsset.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getCustomerById(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    return customer;
  }

  async createCustomer(data: any) {
    const existing = await customerAssetDAO.findByIdCard(data.id_card);
    if (existing) {
      throw new AppError(409, 'ID card already exists');
    }
    return db.CustomerAsset.create(data);
  }

  async updateCustomer(id: number, data: any) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    await db.CustomerAsset.update(data, { where: { id } });
    return db.CustomerAsset.findByPk(id);
  }

  async deleteCustomer(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    await db.CustomerAsset.destroy({ where: { id } });
  }

  async freezeAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    const availableAmount = Number(customer.available_amount || 0);
    if (availableAmount < amount) {
      throw new AppError(400, 'Insufficient available amount');
    }
    await db.CustomerAsset.update(
      {
        available_amount: Number((availableAmount - amount).toFixed(2)),
        frozen_amount: Number((Number(customer.frozen_amount || 0) + amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async unfreezeAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    const frozenAmount = Number(customer.frozen_amount || 0);
    if (frozenAmount < amount) {
      throw new AppError(400, 'Insufficient frozen amount');
    }
    await db.CustomerAsset.update(
      {
        available_amount: Number((Number(customer.available_amount || 0) + amount).toFixed(2)),
        frozen_amount: Number((frozenAmount - amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async deductFrozenAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    const frozenAmount = Number(customer.frozen_amount || 0);
    if (frozenAmount < amount) {
      throw new AppError(400, 'Insufficient frozen amount');
    }
    await db.CustomerAsset.update(
      {
        frozen_amount: Number((frozenAmount - amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async updateAfterTrade(trade: Trade, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const holdings = await customerHoldingDAO.findByCustomerId(trade.customer_id);
    const totalMarketValue = holdings.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
    const totalFrozenAmount = Number(customer.frozen_amount || 0);
    const totalAvailableAmount = Number(customer.available_amount || 0);
    const totalCost = holdings.reduce((sum, h) => sum + Number(h.total_cost || 0), 0);

    const newTotalAsset = Number((totalMarketValue + totalFrozenAmount + totalAvailableAmount).toFixed(2));
    const newTotalProfit = Number((newTotalAsset - totalCost).toFixed(2));

    await db.CustomerAsset.update(
      {
        total_asset: newTotalAsset,
        total_profit: newTotalProfit,
        total_cost: Number(totalCost.toFixed(2)),
      },
      { where: { id: trade.customer_id }, transaction: t },
    );
  }

  async calculateRiskLevel(customerId: number) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    let score = 0;

    const totalAsset = Number(customer.total_asset || 0);
    if (totalAsset >= 1000000) score += 30;
    else if (totalAsset >= 500000) score += 25;
    else if (totalAsset >= 100000) score += 20;
    else if (totalAsset >= 50000) score += 15;
    else score += 10;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTrades = await db.Trade.findAndCountAll({
      where: {
        customer_id: customerId,
        created_at: { [Op.gte]: thirtyDaysAgo },
        trade_status: 'success',
      },
    });
    const tradeCount = recentTrades.count;
    if (tradeCount >= 50) score += 30;
    else if (tradeCount >= 30) score += 25;
    else if (tradeCount >= 15) score += 20;
    else if (tradeCount >= 5) score += 15;
    else score += 10;

    const holdings = await customerHoldingDAO.findByCustomerId(customerId);
    let concentrationScore = 10;
    if (totalAsset > 0) {
      const top3 = holdings.slice(0, 3);
      const top3MarketValue = top3.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
      const top3Ratio = top3MarketValue / totalAsset;
      if (top3Ratio <= 0.3) concentrationScore = 30;
      else if (top3Ratio <= 0.5) concentrationScore = 25;
      else if (top3Ratio <= 0.7) concentrationScore = 20;
      else concentrationScore = 10;
    }
    score += concentrationScore;

    let riskLevel = 'R1';
    if (score >= 80) riskLevel = 'R5';
    else if (score >= 65) riskLevel = 'R4';
    else if (score >= 50) riskLevel = 'R3';
    else if (score >= 35) riskLevel = 'R2';

    await db.CustomerAsset.update({ risk_level: riskLevel }, { where: { id: customerId } });

    return { riskLevel, score };
  }
}

export default new CustomerAssetService();
