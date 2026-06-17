import { Op } from 'sequelize';
import { BaseDao, IPaginationResult, IPaginationParams } from './base.dao';
import { User } from '../models';
import UserModel from '../models/user.model';

class UserDao extends BaseDao<UserModel> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string) {
    return this.findOne({ where: { username } });
  }

  async getList(params: IPaginationParams): Promise<IPaginationResult<UserModel>> {
    const { page = 1, pageSize = 10, keyword, role, accountStatus, companyId, isMainAccount, isAnomalyLogin, createStartTime, createEndTime, minOperationCount } = params;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (accountStatus) {
      where.accountStatus = accountStatus;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (isMainAccount !== undefined && isMainAccount !== '') {
      where.isMainAccount = isMainAccount;
    }
    if (isAnomalyLogin !== undefined && isAnomalyLogin !== '') {
      where.isAnomalyLogin = isAnomalyLogin;
    }
    if (createStartTime) {
      where.created_at = { ...where.created_at, [Op.gte]: createStartTime };
    }
    if (createEndTime) {
      where.created_at = { ...where.created_at, [Op.lte]: createEndTime };
    }
    if (minOperationCount !== undefined) {
      where.operationCount = { [Op.gte]: minOperationCount };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async getByCompanyId(companyId: number): Promise<UserModel[]> {
    return this.findAll({ where: { companyId } });
  }

  async checkUsernameExists(username: string, excludeId?: number): Promise<boolean> {
    const where: any = { username };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.model.count({ where });
    return count > 0;
  }

  async batchUpdateStatus(ids: number[], data: any): Promise<[number, UserModel[]]> {
    return this.model.update(data, {
      where: { id: { [Op.in]: ids } },
      returning: true,
    });
  }

  async batchFreeze(ids: number[], remark?: string): Promise<[number, UserModel[]]> {
    return this.model.update(
      { accountStatus: 'frozen', status: 0 },
      { where: { id: { [Op.in]: ids } }, returning: true }
    );
  }

  async batchUnfreeze(ids: number[]): Promise<[number, UserModel[]]> {
    return this.model.update(
      { accountStatus: 'normal', status: 1 },
      { where: { id: { [Op.in]: ids } }, returning: true }
    );
  }
}

export default new UserDao();
