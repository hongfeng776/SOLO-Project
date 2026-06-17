import { BaseDao } from './BaseDao';
import { GoodsAuditTimeout } from '../models/GoodsAuditTimeout';
import { Op, WhereOptions } from 'sequelize';

export class GoodsAuditTimeoutDao extends BaseDao<GoodsAuditTimeout> {
  constructor() {
    super(GoodsAuditTimeout);
  }

  async findByAuditId(auditId: number): Promise<GoodsAuditTimeout[]> {
    return this.model.findAll({
      where: { audit_id: auditId } as WhereOptions<GoodsAuditTimeout>,
      order: [['created_at', 'DESC']],
    });
  }

  async findUnhandled(): Promise<GoodsAuditTimeout[]> {
    return this.model.findAll({
      where: { status: 0 } as WhereOptions<GoodsAuditTimeout>,
      order: [['deadline', 'ASC']],
    });
  }

  async findExpiredUnhandled(): Promise<GoodsAuditTimeout[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        status: 0,
        deadline: { [Op.lt]: now },
      } as WhereOptions<GoodsAuditTimeout>,
      order: [['deadline', 'ASC']],
    });
  }
}

export default GoodsAuditTimeoutDao;
