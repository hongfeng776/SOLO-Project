import { BaseDao } from './BaseDao';
import { GoodsAudit } from '../models/GoodsAudit';

export class GoodsAuditDao extends BaseDao<GoodsAudit> {
  constructor() {
    super(GoodsAudit);
  }

  async findByGoodsId(goodsId: number): Promise<GoodsAudit[]> {
    return this.model.findAll({
      where: { goods_id: goodsId } as any,
      order: [['created_at', 'DESC']],
    });
  }

  async findLatestByGoodsId(goodsId: number): Promise<GoodsAudit | null> {
    return this.model.findOne({
      where: { goods_id: goodsId } as any,
      order: [['created_at', 'DESC']],
    });
  }
}

export default GoodsAuditDao;
