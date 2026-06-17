import { BaseDao } from './BaseDao';
import { GoodsAuditResubmit } from '../models/GoodsAuditResubmit';
import { WhereOptions } from 'sequelize';

export class GoodsAuditResubmitDao extends BaseDao<GoodsAuditResubmit> {
  constructor() {
    super(GoodsAuditResubmit);
  }

  async findByAuditId(auditId: number): Promise<GoodsAuditResubmit[]> {
    return this.model.findAll({
      where: { audit_id: auditId } as WhereOptions<GoodsAuditResubmit>,
      order: [['resubmit_no', 'ASC']],
    });
  }

  async findByGoodsId(goodsId: number): Promise<GoodsAuditResubmit[]> {
    return this.model.findAll({
      where: { goods_id: goodsId } as WhereOptions<GoodsAuditResubmit>,
      order: [['resubmit_no', 'ASC']],
    });
  }

  async countByAuditId(auditId: number): Promise<number> {
    return this.model.count({
      where: { audit_id: auditId } as WhereOptions<GoodsAuditResubmit>,
    });
  }
}

export default GoodsAuditResubmitDao;
