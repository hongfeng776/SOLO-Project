import { BaseDao } from './BaseDao';
import { GoodsAuditMain } from '../models/GoodsAuditMain';
import { Op, WhereOptions } from 'sequelize';

export class GoodsAuditMainDao extends BaseDao<GoodsAuditMain> {
  constructor() {
    super(GoodsAuditMain);
  }

  async findByGoodsId(goodsId: number): Promise<GoodsAuditMain[]> {
    return this.model.findAll({
      where: { goods_id: goodsId } as WhereOptions<GoodsAuditMain>,
      order: [['created_at', 'DESC']],
    });
  }

  async findPendingByGoodsId(goodsId: number): Promise<GoodsAuditMain[]> {
    return this.model.findAll({
      where: {
        goods_id: goodsId,
        status: { [Op.in]: [0, 1, 5] },
      } as WhereOptions<GoodsAuditMain>,
      order: [['created_at', 'DESC']],
    });
  }

  async findByAuditNo(auditNo: string): Promise<GoodsAuditMain | null> {
    return this.model.findOne({
      where: { audit_no: auditNo } as WhereOptions<GoodsAuditMain>,
    });
  }

  async countTodayAuditNo(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    return this.model.count({
      where: {
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay,
        },
      } as WhereOptions<GoodsAuditMain>,
    });
  }

  async findByStatus(status: number): Promise<GoodsAuditMain[]> {
    return this.model.findAll({
      where: { status } as WhereOptions<GoodsAuditMain>,
      order: [['submit_at', 'ASC']],
    });
  }

  async findByStatuses(statuses: number[]): Promise<GoodsAuditMain[]> {
    return this.model.findAll({
      where: {
        status: { [Op.in]: statuses },
      } as WhereOptions<GoodsAuditMain>,
      order: [['submit_at', 'ASC']],
    });
  }

  async findTimeoutCandidates(): Promise<GoodsAuditMain[]> {
    return this.model.findAll({
      where: {
        status: { [Op.in]: [0, 1, 5] },
        timeout_flag: 0,
        submit_at: { [Op.ne]: null },
      } as WhereOptions<GoodsAuditMain>,
      order: [['submit_at', 'ASC']],
    });
  }

  async countRejectedByGoodsId(goodsId: number): Promise<number> {
    return this.model.count({
      where: {
        goods_id: goodsId,
        status: { [Op.in]: [2, 4] },
      } as WhereOptions<GoodsAuditMain>,
    });
  }
}

export default GoodsAuditMainDao;
