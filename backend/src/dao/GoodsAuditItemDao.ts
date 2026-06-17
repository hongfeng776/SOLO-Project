import { BaseDao } from './BaseDao';
import { GoodsAuditItem } from '../models/GoodsAuditItem';
import { WhereOptions } from 'sequelize';

export class GoodsAuditItemDao extends BaseDao<GoodsAuditItem> {
  constructor() {
    super(GoodsAuditItem);
  }

  async findByAuditId(auditId: number): Promise<GoodsAuditItem[]> {
    return this.model.findAll({
      where: { audit_id: auditId } as WhereOptions<GoodsAuditItem>,
      order: [['id', 'ASC']],
    });
  }

  async findByAuditIdAndCategory(auditId: number, category: string): Promise<GoodsAuditItem[]> {
    return this.model.findAll({
      where: { audit_id: auditId, category } as WhereOptions<GoodsAuditItem>,
      order: [['id', 'ASC']],
    });
  }

  async batchCreate(items: Partial<GoodsAuditItem>[]): Promise<GoodsAuditItem[]> {
    return this.model.bulkCreate(items as any);
  }

  async countFailedByAuditId(auditId: number): Promise<number> {
    return this.model.count({
      where: {
        audit_id: auditId,
        check_result: 2,
      } as WhereOptions<GoodsAuditItem>,
    });
  }

  async deleteByAuditId(auditId: number): Promise<number> {
    return this.model.destroy({
      where: { audit_id: auditId } as WhereOptions<GoodsAuditItem>,
    });
  }
}

export default GoodsAuditItemDao;
