import { Op, WhereOptions } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import FundFlow from '../models/FundFlow';

class FundFlowDAO extends BaseDAO<FundFlow> {
  constructor() {
    super(db.FundFlow);
  }

  async findByFlowNo(flowNo: string): Promise<FundFlow | null> {
    return this.model.findOne({ where: { flow_no: flowNo } });
  }

  async findByCustomerId(customerId: number): Promise<FundFlow[]> {
    return this.model.findAll({ where: { customer_id: customerId } });
  }

  async findByFlowType(flowType: string): Promise<FundFlow[]> {
    return this.model.findAll({ where: { flow_type: flowType } });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<FundFlow[]> {
    return this.model.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      } as WhereOptions,
    });
  }
}

export default new FundFlowDAO();
