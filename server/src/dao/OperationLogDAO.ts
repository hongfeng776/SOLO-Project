import { Op, WhereOptions } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import OperationLog from '../models/OperationLog';

class OperationLogDAO extends BaseDAO<OperationLog> {
  constructor() {
    super(db.OperationLog);
  }

  async findByUserId(userId: number): Promise<OperationLog[]> {
    return this.model.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
  }

  async findByModule(module: string): Promise<OperationLog[]> {
    return this.model.findAll({ where: { module } });
  }

  async findByOperationType(operationType: string): Promise<OperationLog[]> {
    return this.model.findAll({ where: { operation_type: operationType } });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<OperationLog[]> {
    return this.model.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        } as WhereOptions,
      },
      order: [['created_at', 'DESC']],
    });
  }
}

export default new OperationLogDAO();
