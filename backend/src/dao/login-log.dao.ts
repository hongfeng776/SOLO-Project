import { Op } from 'sequelize';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';
import { LoginLog } from '../models';
import LoginLogModel from '../models/login-log.model';

class LoginLogDao extends BaseDao<LoginLogModel> {
  constructor() {
    super(LoginLog);
  }

  async findByUserId(userId: number, page = 1, pageSize = 20): Promise<IPaginationResult<LoginLogModel>> {
    const { count, rows } = await this.model.findAndCountAll({
      where: { userId },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['loginTime', 'DESC']],
    });
    return { list: rows, total: count, page, pageSize };
  }

  async findWithFilters(params: IPaginationParams): Promise<IPaginationResult<LoginLogModel>> {
    const {
      page = 1,
      pageSize = 20,
      userId,
      username,
      companyId,
      status,
      isAnomaly,
      startTime,
      endTime,
      loginIp,
    } = params;
    const where: any = {};

    if (userId) where.userId = userId;
    if (username) where.username = { [Op.like]: `%${username}%` };
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (isAnomaly !== undefined && isAnomaly !== '') where.isAnomaly = isAnomaly;
    if (startTime) where.loginTime = { ...where.loginTime, [Op.gte]: startTime };
    if (endTime) where.loginTime = { ...where.loginTime, [Op.lte]: endTime };
    if (loginIp) where.loginIp = { [Op.like]: `%${loginIp}%` };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['loginTime', 'DESC']],
    });
    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async countFailedByUserId(userId: number, startTime: Date, endTime: Date): Promise<number> {
    return this.model.count({
      where: {
        userId,
        status: 'failed',
        loginTime: { [Op.between]: [startTime, endTime] },
      },
    });
  }

  async countDailyLogin(userId: number, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return this.model.count({
      where: {
        userId,
        loginTime: { [Op.between]: [startOfDay, endOfDay] },
      },
    });
  }

  async getUniqueLocations(userId: number, days: number = 7): Promise<string[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const logs = await this.model.findAll({
      where: {
        userId,
        loginTime: { [Op.gte]: startDate },
        loginLocation: { [Op.ne]: null },
      },
      attributes: ['loginLocation'],
      group: ['loginLocation'],
    });
    return logs.map(log => log.loginLocation!).filter(Boolean);
  }
}

export default new LoginLogDao();
