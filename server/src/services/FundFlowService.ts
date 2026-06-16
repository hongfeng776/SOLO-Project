import { Op } from 'sequelize';
import fundFlowDAO from '@dao/FundFlowDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

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
    return db.FundFlow.create({ ...data, flow_no });
  }

  async updateFlow(id: number, data: any) {
    const flow = await db.FundFlow.findByPk(id);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    await db.FundFlow.update(data, { where: { id } });
    return db.FundFlow.findByPk(id);
  }

  async deleteFlow(id: number) {
    const flow = await db.FundFlow.findByPk(id);
    if (!flow) {
      throw new AppError(404, 'Fund flow not found');
    }
    await db.FundFlow.destroy({ where: { id } });
  }
}

export default new FundFlowService();
