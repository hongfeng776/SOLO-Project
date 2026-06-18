import { BaseDao } from './BaseDao';
import { UserStatistic } from '../models/UserStatistic';
import { Op } from 'sequelize';

export class UserStatisticDao extends BaseDao<UserStatistic> {
  constructor() {
    super(UserStatistic);
  }

  async getTodayStat(): Promise<UserStatistic | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.model.findOne({
      where: {
        stat_date: {
          [Op.eq]: today,
        },
      },
    });
  }
}

export default UserStatisticDao;
