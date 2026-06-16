import { BaseDao } from './BaseDao';
import { Penalty } from '../models/Penalty';
import { Op, WhereOptions } from 'sequelize';

export class PenaltyDao extends BaseDao<Penalty> {
  constructor() {
    super(Penalty);
  }

  async findActiveByMerchant(merchantId: number): Promise<Penalty[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        merchant_id: merchantId,
        status: 1,
        [Op.or]: [
          { expire_time: null },
          { expire_time: { [Op.gt]: now } },
        ],
      } as WhereOptions<Penalty>,
      order: [['created_at', 'DESC']],
    });
  }

  async findByMerchant(merchantId: number): Promise<Penalty[]> {
    return this.model.findAll({
      where: {
        merchant_id: merchantId,
      } as WhereOptions<Penalty>,
      order: [['created_at', 'DESC']],
    });
  }

  async findByTypeAndMerchant(merchantId: number, type: number): Promise<Penalty | null> {
    const now = new Date();
    return this.model.findOne({
      where: {
        merchant_id: merchantId,
        type,
        status: 1,
        [Op.or]: [
          { expire_time: null },
          { expire_time: { [Op.gt]: now } },
        ],
      } as WhereOptions<Penalty>,
      order: [['created_at', 'DESC']],
    });
  }

  async expirePenalties(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const [affectedCount] = await this.model.update(
      { status: 0 },
      {
        where: {
          id: ids,
          status: 1,
        } as WhereOptions<Penalty>,
      }
    );
    return affectedCount;
  }
}

export default PenaltyDao;
