import { Op } from 'sequelize';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';
import { daos } from '../dao';
import { userValidateService, USER_STATUS } from './UserValidateService';
import { userStatisticService } from './UserStatisticService';

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  username?: string;
  phone?: string;
  status?: number;
  level?: number;
  register_channel?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  risk_warning?: number;
  tags?: string;
}

export interface UserCreatePayload {
  username: string;
  nickname?: string;
  real_name?: string;
  id_card?: string;
  gender?: number;
  birthday?: Date;
  phone: string;
  email?: string;
  avatar?: string;
  status?: number;
  level?: number;
  tags?: string;
  register_channel?: string;
  remark?: string;
  operator_id?: number;
  operator_name?: string;
  operate_ip?: string;
}

export interface UserUpdatePayload {
  username?: string;
  nickname?: string;
  real_name?: string;
  id_card?: string;
  gender?: number;
  birthday?: Date;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: number;
  level?: number;
  tags?: string;
  remark?: string;
  frozen_reason?: string;
  operator_id?: number;
  operator_name?: string;
  operate_ip?: string;
}

export interface UserFullInfo {
  user: User;
  registerLog?: any;
  profiles?: UserProfile[];
  loginTraces?: any[];
  consumptionLedgers?: any[];
}

class UserService {
  private userDao = daos.userDao;
  private userProfileDao = daos.userProfileDao;
  private userRegisterLogDao = daos.userRegisterLogDao;

  async getList(params: UserQueryParams): Promise<PageResult<User>> {
    const { page = 1, pageSize = 10, username, phone, status, level, register_channel, start_date, end_date, min_amount, max_amount, risk_warning, tags } = params;

    const where: any = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }

    if (phone) {
      where.phone = { [Op.like]: `%${phone}%` };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (level !== undefined) {
      where.level = level;
    }

    if (register_channel) {
      where.register_channel = register_channel;
    }

    if (start_date) {
      where.created_at = { ...where.created_at, [Op.gte]: new Date(start_date) };
    }

    if (end_date) {
      where.created_at = { ...where.created_at, [Op.lte]: new Date(end_date + ' 23:59:59') };
    }

    if (min_amount !== undefined) {
      where.total_amount = { ...where.total_amount, [Op.gte]: min_amount };
    }

    if (max_amount !== undefined) {
      where.total_amount = { ...where.total_amount, [Op.lte]: max_amount };
    }

    if (risk_warning !== undefined) {
      where.risk_warning = risk_warning;
    }

    if (tags) {
      where.tags = { [Op.like]: `%${tags}%` };
    }

    return this.userDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<User> {
    const user = await this.userDao.findById(id);

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return user;
  }

  async getFullInfo(id: number): Promise<UserFullInfo> {
    const user = await this.getDetail(id);

    const [registerLog, profiles, loginTraces, consumptionLedgers] = await Promise.all([
      this.userRegisterLogDao.findOne({ where: { user_id: id } }),
      this.userProfileDao.findAll({ where: { user_id: id }, order: [['operate_time', 'DESC']], limit: 20 }),
      daos.userLoginTraceDao.findAll({ where: { user_id: id }, order: [['login_time', 'DESC']], limit: 10 }),
      daos.userConsumptionLedgerDao.findAll({ where: { user_id: id }, order: [['created_at', 'DESC']], limit: 20 }),
    ]);

    return {
      user,
      registerLog,
      profiles,
      loginTraces,
      consumptionLedgers,
    };
  }

  async create(payload: UserCreatePayload): Promise<User> {
    const validateResult = await userValidateService.validateCreateData(payload);
    if (!validateResult.valid) {
      throw new AppError('数据校验失败', 400, { errors: validateResult.errors });
    }

    const identityCheck = await userValidateService.checkFakeIdentity(payload.real_name || '', payload.id_card || '');
    if (identityCheck.isFake) {
      throw new AppError(`身份信息异常: ${identityCheck.reason}`, 400);
    }

    const user = await this.userDao.create({
      username: payload.username,
      nickname: payload.nickname,
      real_name: payload.real_name,
      id_card: payload.id_card,
      gender: payload.gender || 0,
      birthday: payload.birthday,
      phone: payload.phone,
      email: payload.email,
      avatar: payload.avatar,
      status: payload.status || USER_STATUS.NORMAL,
      level: payload.level || 1,
      tags: payload.tags,
      register_channel: payload.register_channel || 'admin',
      register_ip: payload.operate_ip,
      remark: payload.remark,
    });

    await this.userRegisterLogDao.create({
      user_id: user.id,
      username: payload.username,
      phone: payload.phone,
      email: payload.email,
      register_channel: payload.register_channel || 'admin',
      register_ip: payload.operate_ip,
      audit_status: 1,
    });

    await this.recordProfileLog(user.id, 'status', undefined, String(user.status), payload);
    await userStatisticService.updateStatistics();

    return user;
  }

  async update(id: number, payload: UserUpdatePayload): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const permission = await userValidateService.getUserEditPermission(user.status || USER_STATUS.NORMAL);
    if (!permission.editable) {
      throw new AppError(permission.reason || '该用户状态不支持编辑', 400);
    }

    for (const field of permission.readonlyFields) {
      if (field === '*') {
        throw new AppError('注销用户不支持编辑', 400);
      }
      if ((payload as any)[field] !== undefined && (payload as any)[field] !== (user as any)[field]) {
        throw new AppError(`字段 ${field} 不允许修改`, 400);
      }
    }

    const validateResult = await userValidateService.validateUpdateData(id, payload);
    if (!validateResult.valid) {
      throw new AppError('数据校验失败', 400, { errors: validateResult.errors });
    }

    if (payload.real_name || payload.id_card) {
      const identityCheck = await userValidateService.checkFakeIdentity(
        payload.real_name || user.real_name || '',
        payload.id_card || user.id_card || ''
      );
      if (identityCheck.isFake) {
        throw new AppError(`身份信息异常: ${identityCheck.reason}`, 400);
      }
    }

    const updateData: any = {};
    const profileLogs: Promise<any>[] = [];

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;
      if (['operator_id', 'operator_name', 'operate_ip'].includes(key)) continue;

      const oldValue = (user as any)[key];
      if (oldValue !== value) {
        updateData[key] = value;
        profileLogs.push(this.recordProfileLog(id, key, String(oldValue), String(value), payload));
      }
    }

    if (payload.status === USER_STATUS.FROZEN && user.status !== USER_STATUS.FROZEN) {
      updateData.frozen_time = new Date();
      updateData.frozen_reason = payload.frozen_reason || '管理员冻结';
    } else if (payload.status === USER_STATUS.NORMAL && user.status === USER_STATUS.FROZEN) {
      updateData.frozen_time = null;
      updateData.frozen_reason = null;
    } else if (payload.status === USER_STATUS.CANCELED && user.status !== USER_STATUS.CANCELED) {
      updateData.cancel_time = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await this.userDao.update(id, updateData);
      await Promise.all(profileLogs);
      await userStatisticService.updateStatistics();
    }

    const updatedUser = await this.userDao.findById(id);
    if (!updatedUser) {
      throw new AppError('用户不存在', 404);
    }

    return updatedUser;
  }

  async delete(id: number): Promise<void> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    await this.userDao.update(id, { status: USER_STATUS.CANCELED, cancel_time: new Date() } as any);
    await userStatisticService.updateStatistics();
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的用户', 400);
    }

    const count = await this.userDao.batchDelete(ids);
    await userStatisticService.updateStatistics();
    return count;
  }

  async updateStatus(id: number, status: number, reason?: string): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (![USER_STATUS.NORMAL, USER_STATUS.FROZEN, USER_STATUS.CANCELED].includes(status)) {
      throw new AppError('状态值无效', 400);
    }

    const updateData: any = { status };

    if (status === USER_STATUS.FROZEN) {
      updateData.frozen_time = new Date();
      updateData.frozen_reason = reason || '管理员冻结';
    } else if (status === USER_STATUS.NORMAL) {
      updateData.frozen_time = null;
      updateData.frozen_reason = null;
    } else if (status === USER_STATUS.CANCELED) {
      updateData.cancel_time = new Date();
    }

    await this.userDao.update(id, updateData);
    await userStatisticService.updateStatistics();

    const updatedUser = await this.userDao.findById(id);
    if (!updatedUser) {
      throw new AppError('用户不存在', 404);
    }

    return updatedUser;
  }

  private async recordProfileLog(
    userId: number,
    fieldName: string,
    oldValue: string | undefined,
    newValue: string,
    payload: { operator_id?: number; operator_name?: string; operate_ip?: string }
  ): Promise<UserProfile> {
    return this.userProfileDao.create({
      user_id: userId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      operator_id: payload.operator_id,
      operator_name: payload.operator_name,
      operate_ip: payload.operate_ip,
    });
  }

  async getProfileLogs(userId: number): Promise<UserProfile[]> {
    return this.userProfileDao.findAll({
      where: { user_id: userId },
      order: [['operate_time', 'DESC']],
    });
  }
}

export const userService = new UserService();
export default UserService;
