import { Op, fn, col } from 'sequelize';
import { User } from '../models/User';
import { UserStatistic } from '../models/UserStatistic';
import { daos } from '../dao';
import { USER_STATUS } from './UserValidateService';

class UserStatisticService {
  private userStatisticDao = daos.userStatisticDao;

  async updateStatistics(): Promise<UserStatistic> {
    const today = new Date().toISOString().split('T')[0];

    const [totalResult, frozenResult, canceledResult, riskResult, levelResults, amountResult] = await Promise.all([
      User.count(),
      User.count({ where: { status: USER_STATUS.FROZEN } }),
      User.count({ where: { status: USER_STATUS.CANCELED } }),
      User.count({ where: { risk_warning: 1 } }),
      this.countByLevel(),
      this.sumTotalAmount(),
    ]);

    const newUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(today),
        },
      },
    });

    const activeUsers = await User.count({
      where: {
        last_login_time: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const statData = {
      stat_date: today,
      total_users: totalResult,
      new_users: newUsers,
      active_users: activeUsers,
      frozen_users: frozenResult,
      cancel_users: canceledResult,
      risk_users: riskResult,
      total_amount: amountResult,
      avg_user_amount: totalResult > 0 ? amountResult / totalResult : 0,
      level1_users: levelResults[1] || 0,
      level2_users: levelResults[2] || 0,
      level3_users: levelResults[3] || 0,
      level4_users: levelResults[4] || 0,
      level5_users: levelResults[5] || 0,
    };

    const existing = await this.userStatisticDao.getTodayStat();
    if (existing) {
      await this.userStatisticDao.update(existing.id, statData as any);
      return (await this.userStatisticDao.findById(existing.id))!;
    } else {
      return this.userStatisticDao.create(statData as any);
    }
  }

  private async countByLevel(): Promise<Record<number, number>> {
    const results = await User.findAll({
      attributes: ['level', [fn('COUNT', col('id')), 'count']],
      group: ['level'],
    });

    const counts: Record<number, number> = {};
    results.forEach((r: any) => {
      counts[r.level] = parseInt(r.dataValues.count, 10);
    });
    return counts;
  }

  private async sumTotalAmount(): Promise<number> {
    const result = await User.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'total']],
    });

    return parseFloat((result as any)?.dataValues?.total || 0);
  }

  async getTodayStatistics(): Promise<UserStatistic | null> {
    return this.userStatisticDao.getTodayStat();
  }

  async getStatistics(startDate: string, endDate: string): Promise<UserStatistic[]> {
    return this.userStatisticDao.findAll({
      where: {
        stat_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['stat_date', 'DESC']],
    });
  }
}

export const userStatisticService = new UserStatisticService();
export default UserStatisticService;
