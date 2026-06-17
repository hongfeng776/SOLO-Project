import { userDao, roleDao, permissionDao, operationLogDao } from '../dao';
import { CreateUserRequest, UpdateUserRequest, PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import authService from './Auth.service';
import { UserAttributes } from '../models/User.model';
import { UserRole, UserStatus, AccountLevel, PERMISSION_MUTUAL_EXCLUSIONS } from '../constants/enum';
import { omit } from 'lodash';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import { checkPermissionMutualExclusion, PermissionConflict } from '../utils/permissionCheck';
import notificationService from './Notification.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateAdminRequest {
  username: string;
  password: string;
  nickname: string;
  email: string;
  phone: string;
  role: UserRole;
  roleId: string;
  permissionIds?: string[];
  position?: string;
  positionLevel?: number;
}

interface UpdateAdminRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  roleId?: string;
  permissionIds?: string[];
  status?: number;
  position?: string;
  positionLevel?: number;
}

interface UserQueryParams {
  page: number;
  pageSize: number;
  role?: string;
  status?: number;
  positionLevel?: number;
  permissionId?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

interface BatchOperateResult {
  success: string[];
  failed: Array<{ id: string; reason: string }>;
}

const MAX_ACCOUNT_QUOTA: Record<string, number> = {
  [UserRole.ADMIN]: 50,
  [UserRole.USER]: 500,
  [UserRole.GUEST]: 1000,
};

class UserService {
  public async create(data: CreateUserRequest) {
    const exists = await userDao.existsByUsername(data.username);
    if (exists) {
      throw new AppError('Username already exists', BusinessCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await authService.hashPassword(data.password);
    const user = await userDao.create({
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname || data.username,
      role: data.role as UserRole | undefined,
    });

    return this.sanitizeUser(user);
  }

  public async findById(id: string) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  public async findByUsername(username: string) {
    const user = await userDao.findByUsername(username);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  public async findAll(params: PaginationParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await userDao.findAndCountAll({
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const sanitizedList = rows.map((user) => this.sanitizeUser(user));

    return {
      list: sanitizedList,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: UpdateUserRequest) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }

    const updateData: Partial<UserAttributes> = {};

    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname;
    }
    if (data.password !== undefined) {
      updateData.password = await authService.hashPassword(data.password);
    }
    if (data.role !== undefined) {
      updateData.role = data.role as any;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    await userDao.update(updateData, { where: { id } });

    const updatedUser = await userDao.findById(id);
    return this.sanitizeUser(updatedUser!);
  }

  public async delete(id: string): Promise<void> {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    await userDao.destroy({ where: { id } });
  }

  public async createAdmin(currentUser: any, data: CreateAdminRequest) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError('仅超级管理员可创建管理员账号', BusinessCode.FORBIDDEN);
    }

    const roleCount = await userDao.countByRole(data.role);
    const quota = MAX_ACCOUNT_QUOTA[data.role] || 100;
    if (roleCount >= quota) {
      throw new AppError(`${data.role} 角色账号数量已达上限 (${quota})`, BusinessCode.ERROR);
    }

    if (data.positionLevel && currentUser.positionLevel && data.positionLevel <= currentUser.positionLevel) {
      throw new AppError('不能创建岗位层级高于或等于当前用户的账号', BusinessCode.FORBIDDEN);
    }

    const idempotentKey = `user:create:${data.username}:${data.email}:${data.phone}`;
    const isDuplicate = await CacheUtils.get(idempotentKey);
    if (isDuplicate) {
      throw new AppError('请勿重复提交', BusinessCode.ERROR);
    }
    await CacheUtils.set(idempotentKey, '1', CacheTTL.SHORT);

    if (await userDao.existsByUsername(data.username)) {
      throw new AppError('用户名已存在', BusinessCode.USER_ALREADY_EXISTS);
    }
    if (await userDao.existsByEmail(data.email)) {
      throw new AppError('邮箱已被使用', BusinessCode.ERROR);
    }
    if (await userDao.existsByPhone(data.phone)) {
      throw new AppError('手机号已被使用', BusinessCode.ERROR);
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.phone)) {
      throw new AppError('手机号格式不正确', BusinessCode.PARAM_ERROR);
    }
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError('邮箱格式不正确', BusinessCode.PARAM_ERROR);
    }

    const role = await roleDao.findById(data.roleId);
    if (!role) {
      throw new AppError('所选角色不存在', BusinessCode.NOT_FOUND);
    }

    let finalPermissionIds = data.permissionIds || [];
    if (finalPermissionIds.length > 0) {
      const allPermissions = await permissionDao.findAll();
      const conflicts = checkPermissionMutualExclusion(finalPermissionIds, allPermissions);
      if (conflicts.length > 0) {
        throw new AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), BusinessCode.ERROR);
      }
    }

    const hashedPassword = await authService.hashPassword(data.password);
    const activationToken = uuidv4();

    const user = await userDao.create({
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      role: data.role,
      position: data.position,
      positionLevel: data.positionLevel,
      status: UserStatus.ACTIVE,
      createdBy: currentUser.userId,
      createdByName: currentUser.username,
    } as any);

    if (data.roleId && finalPermissionIds.length === 0) {
      await roleDao.assignPermissions(data.roleId, finalPermissionIds);
    }

    await CacheUtils.set(`user:activation:${user.id}`, activationToken, CacheTTL.LONG);

    const smsPromise = notificationService.sendActivationSms(data.phone, data.username, activationToken);
    const emailPromise = notificationService.sendActivationEmail(data.email, data.username, activationToken);
    await Promise.all([smsPromise, emailPromise]).catch(() => {});

    await CacheUtils.delPattern(`${CacheKey.USER_LIST}*`);

    return this.sanitizeUser(user);
  }

  public async updateAdmin(currentUser: any, id: string, data: UpdateAdminRequest) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', BusinessCode.USER_NOT_FOUND);
    }

    const isDisabled = user.status === UserStatus.DISABLED;
    const hasPermissionChanges = data.permissionIds !== undefined || data.roleId !== undefined;
    if (isDisabled && hasPermissionChanges) {
      throw new AppError('禁用状态账号仅可编辑基础信息，无法修改权限配置', BusinessCode.ERROR);
    }

    if (hasPermissionChanges && data.permissionIds && data.permissionIds.length > 0) {
      const allPermissions = await permissionDao.findAll();
      const conflicts = checkPermissionMutualExclusion(data.permissionIds, allPermissions);
      if (conflicts.length > 0) {
        throw new AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), BusinessCode.ERROR);
      }
    }

    if (data.email && data.email !== user.email && await userDao.existsByEmail(data.email, id)) {
      throw new AppError('邮箱已被其他账号使用', BusinessCode.ERROR);
    }
    if (data.phone && data.phone !== user.phone && await userDao.existsByPhone(data.phone, id)) {
      throw new AppError('手机号已被其他账号使用', BusinessCode.ERROR);
    }

    const updateData: Partial<UserAttributes> = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.position !== undefined) (updateData as any).position = data.position;
    if (data.positionLevel !== undefined) (updateData as any).positionLevel = data.positionLevel;

    await userDao.update(updateData, { where: { id } });

    if (hasPermissionChanges) {
      await CacheUtils.del(`user:permissions:${id}`);
    }

    await CacheUtils.del(`${CacheKey.USER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.USER_LIST}*`);

    const updatedUser = await userDao.findById(id);
    return this.sanitizeUser(updatedUser!);
  }

  public async findAllAdvanced(params: UserQueryParams) {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.USER_LIST}:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const { rows, count } = await userDao.findAllPaged(params);
    const result = {
      list: rows.map(u => this.sanitizeUser(u)),
      total: count,
      page, pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async batchUpdateStatus(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };

    for (const id of ids) {
      try {
        const user = await userDao.findById(id);
        if (!user) {
          result.failed.push({ id, reason: '用户不存在' });
          continue;
        }
        if (user.role === UserRole.ADMIN && id !== currentUser.userId) {
          const isSuperAdmin = (user as any).positionLevel === AccountLevel.SUPER_ADMIN;
          if (isSuperAdmin) {
            result.failed.push({ id, reason: '超级管理员账号禁止批量操作' });
            continue;
          }
        }
        await userDao.update({ status } as any, { where: { id } });
        await CacheUtils.del(`${CacheKey.USER_DETAIL}${id}`);
        result.success.push(id);
      } catch (err: any) {
        result.failed.push({ id, reason: err.message || '操作失败' });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.USER_LIST}*`);
    return result;
  }

  public async batchResetPermissions(currentUser: any, ids: string[]): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };

    for (const id of ids) {
      try {
        const user = await userDao.findById(id);
        if (!user) {
          result.failed.push({ id, reason: '用户不存在' });
          continue;
        }
        const isSuperAdmin = (user as any).positionLevel === AccountLevel.SUPER_ADMIN;
        if (isSuperAdmin) {
          result.failed.push({ id, reason: '超级管理员账号禁止重置权限' });
          continue;
        }
        await CacheUtils.del(`user:permissions:${id}`);
        result.success.push(id);
      } catch (err: any) {
        result.failed.push({ id, reason: err.message || '操作失败' });
      }
    }

    return result;
  }

  public async checkDeleteDependencies(id: string) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', BusinessCode.USER_NOT_FOUND);
    }
    if ((user as any).positionLevel === AccountLevel.SUPER_ADMIN) {
      throw new AppError('超级管理员账号不可删除', BusinessCode.FORBIDDEN);
    }

    const dependencies: Array<{ type: string; count: number; description: string }> = [];

    const pendingLogs = await operationLogDao.findAllPaged({
      page: 1, pageSize: 1,
      userId: id,
      status: 0,
    }).catch(() => ({ count: 0 }));
    if (pendingLogs.count > 0) {
      dependencies.push({ type: 'unfinished_operations', count: pendingLogs.count, description: '存在未完结操作记录' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await operationLogDao.findAllPaged({
      page: 1, pageSize: 1,
      userId: id,
      startTime: sevenDaysAgo.toISOString(),
    }).catch(() => ({ count: 0 }));
    if (recentLogs.count > 0) {
      dependencies.push({ type: 'recent_logs', count: recentLogs.count, description: `存在 ${recentLogs.count} 条最近7天的操作日志（归档中）` });
    }

    const roleCount = await userDao.countByRole(user.role).catch(() => 0);
    if (roleCount > 0 && user.role !== UserRole.USER) {
      dependencies.push({ type: 'role_reference', count: 1, description: `该账号关联角色配置: ${user.role}` });
    }

    return { hasDependencies: dependencies.length > 0, dependencies, canDelete: dependencies.length === 0 || dependencies.every(d => d.type === 'recent_logs') };
  }

  public async deleteAdmin(currentUser: any, id: string): Promise<void> {
    const idempotentKey = `user:delete:${id}`;
    const isDuplicate = await CacheUtils.get(idempotentKey);
    if (isDuplicate) {
      throw new AppError('删除请求已提交，请勿重复操作', BusinessCode.ERROR);
    }
    await CacheUtils.set(idempotentKey, '1', CacheTTL.SHORT);

    const dependencyCheck = await this.checkDeleteDependencies(id);
    if (!dependencyCheck.canDelete) {
      throw new AppError(JSON.stringify({ message: '存在关联数据，无法删除', dependencies: dependencyCheck.dependencies }), BusinessCode.ERROR);
    }

    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', BusinessCode.USER_NOT_FOUND);
    }
    await userDao.destroy({ where: { id } });

    await CacheUtils.del(`user:permissions:${id}`);
    await CacheUtils.del(`${CacheKey.USER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.USER_LIST}*`);

    await CacheUtils.del(idempotentKey);
  }

  public async getUserTraceInfo(id: string) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', BusinessCode.USER_NOT_FOUND);
    }

    const userData = user.toJSON ? user.toJSON() : user;
    return {
      id: userData.id,
      username: userData.username,
      createdBy: userData.createdBy,
      createdByName: userData.createdByName,
      createdAt: userData.createdAt,
      activatedAt: userData.activatedAt,
      lastLoginAt: userData.lastLoginAt,
      lastActiveAt: userData.lastActiveAt,
    };
  }

  public getPermissionMutualExclusionRules() {
    return PERMISSION_MUTUAL_EXCLUSIONS || [];
  }

  private sanitizeUser(user: any) {
    const userData = user.toJSON ? user.toJSON() : user;
    return omit(userData, ['password', 'deletedAt']);
  }
}

export default new UserService();
