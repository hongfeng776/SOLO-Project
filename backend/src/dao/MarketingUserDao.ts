import { BaseDao } from './BaseDao';
import { MarketingUser } from '../models/MarketingUser';
import { Op, WhereOptions } from 'sequelize';

export class MarketingUserDao extends BaseDao<MarketingUser> {
  constructor() {
    super(MarketingUser);
  }

  async findByUserAndMarketing(userId: number, marketingId: number): Promise<MarketingUser | null> {
    return this.model.findOne({
      where: {
        user_id: userId,
        marketing_id: marketingId,
      } as WhereOptions<MarketingUser>,
    });
  }

  async findAvailableByUser(userId: number): Promise<MarketingUser[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        user_id: userId,
        status: 0,
        expire_time: {
          [Op.gt]: now,
        },
      } as WhereOptions<MarketingUser>,
      order: [['expire_time', 'ASC']],
    });
  }

  async findByMarketing(marketingId: number): Promise<MarketingUser[]> {
    return this.model.findAll({
      where: {
        marketing_id: marketingId,
      } as WhereOptions<MarketingUser>,
      order: [['created_at', 'DESC']],
    });
  }

  async updateStatus(id: number, status: number, usedTime?: Date): Promise<number> {
    const updateData: any = { status };
    if (usedTime) {
      updateData.used_time = usedTime;
    }
    const [affectedCount] = await this.model.update(updateData, {
      where: { id } as WhereOptions<MarketingUser>,
    });
    return affectedCount;
  }

  async markExpired(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const [affectedCount] = await this.model.update(
      { status: 2 },
      {
        where: {
          id: ids,
          status: 0,
        } as WhereOptions<MarketingUser>,
      }
    );
    return affectedCount;
  }
}

export default MarketingUserDao;
