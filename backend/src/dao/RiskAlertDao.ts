import { BaseDao } from './BaseDao';
import { RiskAlert } from '../models/RiskAlert';
import { WhereOptions } from 'sequelize';

export class RiskAlertDao extends BaseDao<RiskAlert> {
  constructor() {
    super(RiskAlert);
  }

  async markAsHandled(id: number, handlerId: number): Promise<number> {
    const [affectedCount] = await RiskAlert.update(
      { status: 1, handler_id: handlerId, handled_at: new Date() },
      { where: { id } as WhereOptions<RiskAlert> }
    );
    return affectedCount;
  }

  async getUnhandledCount(): Promise<number> {
    return RiskAlert.count({ where: { status: 0 } as WhereOptions<RiskAlert> });
  }
}

export default RiskAlertDao;
