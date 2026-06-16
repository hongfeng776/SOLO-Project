import { Op } from 'sequelize';
import fundFlowDAO from '@dao/FundFlowDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';
import Trade from '@models/Trade';
import { CacheUtil } from '@utils/cache';

const LIST_CACHE_TTL = 30;
const LIST_CACHE_PREFIX = 'fund:flow:list:';

function generateFlowNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FF${dateStr}${random}`;
}

class FundFlowService {
  async getFlowById(id: number) {
    const flow = await db.FundFlow.findByPk(id);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    return flow;
  }

  async getFlowList(params: { page: number; pageSize: number; flowType?: string; flowStatus?: string; channel?: string; customerId?: number; startDate?: string; endDate?: string }) {
    const { page, pageSize, flowType, flowStatus, channel, customerId, startDate, endDate } = params;
    const filters = { flowType, flowStatus, channel, customerId, startDate, endDate };
    const cacheKey = `${LIST_CACHE_PREFIX}${page}:${pageSize}:${JSON.stringify(filters)}`;

    return CacheUtil.getOrSet(cacheKey, LIST_CACHE_TTL, async () => {
      const where: any = {};

      if (flowType) {
        where.flow_type = flowType;
      }

      if (flowStatus) {
        where.flow_status = flowStatus;
      }

      if (channel) {
        where.channel = channel;
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

      const { rows, count } = await db.FundFlow.findAndCountAll({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: [['created_at', 'DESC']],
      });

      return { list: rows, total: count, page, pageSize };
    });
  }

  async getFlowByNo(flowNo: string) {
    const flow = await fundFlowDAO.findByFlowNo(flowNo);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    return flow;
  }

  async createFlow(data: any) {
    const flow_no = generateFlowNo();
    const flow = await db.FundFlow.create({ ...data, flow_no });
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return flow;
  }

  async createFlowFromTrade(trade: Trade, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const flow_no = generateFlowNo();
    const balanceAfter = Number(customer.total_asset || 0);

    let flowType = '';
    let amount = 0;
    let remark = '';

    if (trade.direction === 'buy') {
      flowType = 'buy';
      amount = Number(trade.trade_amount || 0) + Number(trade.total_fee || 0);
      remark = `买入${trade.stock_name || trade.stock_code} ${trade.quantity}股，单价${trade.price}元`;
    } else {
      flowType = 'sell';
      amount = Number(trade.trade_amount || 0) - Number(trade.total_fee || 0);
      remark = `卖出${trade.stock_name || trade.stock_code} ${trade.quantity}股，单价${trade.price}元`;
    }

    const flow = await db.FundFlow.create(
      {
        flow_no,
        customer_id: trade.customer_id,
        asset_id: trade.stock_id,
        flow_type: flowType,
        amount: Number(amount.toFixed(2)),
        balance_after: Number(balanceAfter.toFixed(2)),
        flow_status: 'success',
        channel: 'trade',
        remark,
      },
      { transaction: t },
    );
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return flow;
  }

  async batchCreateFlows(flows: any[], t?: Transaction) {
    const records = flows.map((flow) => ({
      ...flow,
      flow_no: generateFlowNo(),
    }));
    const result = await db.FundFlow.bulkCreate(records, { transaction: t });
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return result;
  }

  async updateFlow(id: number, data: any) {
    const flow = await db.FundFlow.findByPk(id);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    await db.FundFlow.update(data, { where: { id } });
    const updatedFlow = await db.FundFlow.findByPk(id);
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
    return updatedFlow;
  }

  async deleteFlow(id: number) {
    const flow = await db.FundFlow.findByPk(id);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    await db.FundFlow.destroy({ where: { id } });
    await CacheUtil.deleteByPattern(`${LIST_CACHE_PREFIX}*`);
  }
}

export default new FundFlowService();
