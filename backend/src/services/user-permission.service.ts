import { Op } from 'sequelize';
import userDao from '../dao/user.dao';
import permissionLogDao from '../dao/permission-log.dao';
import loginLogDao from '../dao/login-log.dao';
import companyDao from '../dao/company.dao';
import { NotFoundError, ForbiddenError, ParamError, ConflictError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import UserModel from '../models/user.model';
import PermissionLogModel from '../models/permission-log.model';
import LoginLogModel from '../models/login-log.model';
import {
  UserRole,
  AccountStatus,
  PermissionLogAction,
  DataScope,
  ROLE_PERMISSIONS,
  PASSWORD_COMPLEXITY,
  ANOMALY_LOGIN_THRESHOLDS,
  QualificationAuditStatus,
} from '../constants/recruitment.enum';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
}

interface ValidateResult {
  valid: boolean;
  errors: { field: string; message: string }[];
  warnings: string[];
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { userId: number; username: string; message: string }[];
}

class UserPermissionService {
  async getList(params: any, currentUser: CurrentUser): Promise<IPaginationResult<UserModel>> {
    const where: any = {};

    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.companyId) {
        throw new ForbiddenError('无权限访问');
      }
      where.companyId = currentUser.companyId;
    }

    return userDao.getList({ ...params, ...where });
  }

  async getById(id: number, currentUser: CurrentUser): Promise<UserModel> {
    const user = await userDao.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    this.checkUserPermission(user, currentUser);
    return user;
  }

  async checkCompanyQualification(companyId: number): Promise<{ approved: boolean; reason?: string }> {
    const company = await companyDao.findById(companyId);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }

    if (!(company as any).isQualificationApproved) {
      return { approved: false, reason: '企业资质未通过审核' };
    }

    return { approved: true };
  }

  getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  getDefaultDataScope(role: string): string {
    if (role === UserRole.ADMIN) return DataScope.ALL;
    if (role === UserRole.HR) return DataScope.DEPT;
    return DataScope.SELF;
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = PASSWORD_COMPLEXITY;

    if (password.length < minLength) {
      errors.push(`密码长度不能少于${minLength}位`);
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    if (requireNumber && !/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
    }
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return { valid: errors.length === 0, errors };
  }

  validateUserData(data: any, excludeId?: number): ValidateResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: string[] = [];

    if (!data.username || data.username.trim() === '') {
      errors.push({ field: 'username', message: '用户名不能为空' });
    } else if (data.username.length < 3 || data.username.length > 20) {
      errors.push({ field: 'username', message: '用户名长度应在3-20位之间' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push({ field: 'username', message: '用户名只能包含字母、数字和下划线' });
    }

    if (data.password) {
      const pwdResult = this.validatePassword(data.password);
      if (!pwdResult.valid) {
        errors.push({ field: 'password', message: pwdResult.errors.join('；') });
      }
    }

    if (data.phone) {
      if (!/^1[3-9]\d{9}$/.test(data.phone)) {
        errors.push({ field: 'phone', message: '手机号格式不正确' });
      }
    }

    if (data.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'email', message: '邮箱格式不正确' });
      }
    }

    if (data.role && !Object.values(UserRole).includes(data.role)) {
      errors.push({ field: 'role', message: '无效的用户角色' });
    }

    if (data.permissions && data.role) {
      const rolePerms = this.getRolePermissions(data.role);
      if (rolePerms[0] !== '*') {
        const perms = JSON.parse(data.permissions);
        const invalidPerms = perms.filter((p: string) => !rolePerms.includes(p));
        if (invalidPerms.length > 0) {
          errors.push({ field: 'permissions', message: `存在越权权限配置：${invalidPerms.join('、')}` });
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async checkUsernameUnique(username: string, excludeId?: number): Promise<boolean> {
    return userDao.checkUsernameExists(username, excludeId);
  }

  async createSubAccount(data: any, currentUser: CurrentUser): Promise<UserModel> {
    if (!currentUser.companyId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('无权限创建子账号');
    }

    const companyId = currentUser.role === UserRole.ADMIN ? data.companyId : currentUser.companyId;
    if (!companyId) {
      throw new ParamError('请指定所属企业');
    }

    const qualificationResult = await this.checkCompanyQualification(companyId);
    if (!qualificationResult.approved) {
      throw new ForbiddenError(`企业资质未通过审核，无法创建子账号：${qualificationResult.reason}`);
    }

    const isMain = await this.isMainAccount(currentUser.id);
    if (currentUser.role !== UserRole.ADMIN && !isMain) {
      throw new ForbiddenError('仅主账号可创建子账号');
    }

    const usernameExists = await this.checkUsernameUnique(data.username);
    if (usernameExists) {
      throw new ConflictError('用户名已存在');
    }

    const validation = this.validateUserData(data);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      throw new ParamError(`${firstError.field}：${firstError.message}`);
    }

    const role = data.role || UserRole.HR;
    const defaultPerms = JSON.stringify(this.getRolePermissions(role));
    const defaultDataScope = this.getDefaultDataScope(role);

    const company = await companyDao.findById(companyId);

    const userData = {
      username: data.username,
      password: data.password || 'Abc123456',
      realName: data.realName || '',
      email: data.email || '',
      phone: data.phone || '',
      role,
      companyId,
      companyName: company?.name,
      department: data.department || '',
      position: data.position || '',
      status: 1,
      accountStatus: AccountStatus.NORMAL,
      permissions: data.permissions || defaultPerms,
      dataScope: data.dataScope || defaultDataScope,
      isMainAccount: false,
      remark: data.remark || '',
    };

    const user = await userDao.create(userData);

    await this.writePermissionLog({
      userId: user.id,
      username: user.username,
      companyId,
      companyName: company?.name,
      action: PermissionLogAction.CREATE,
      changeType: '创建账号',
      newValue: JSON.stringify(userData),
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      operationRemark: '创建子账号',
    });

    return user;
  }

  async updateUser(id: number, data: any, currentUser: CurrentUser): Promise<UserModel> {
    const user = await this.getById(id, currentUser);

    if (data.username && data.username !== user.username) {
      const exists = await this.checkUsernameUnique(data.username, id);
      if (exists) {
        throw new ConflictError('用户名已存在');
      }
    }

    const validation = this.validateUserData(data, id);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      throw new ParamError(`${firstError.field}：${firstError.message}`);
    }

    const changedFields = this.getChangedFields(user, data);
    if (changedFields.length === 0) {
      throw new ConflictError('未检测到数据变更');
    }

    const oldData = this.extractUserData(user);

    if (data.role && data.role !== user.role) {
      data.permissions = JSON.stringify(this.getRolePermissions(data.role));
      data.dataScope = this.getDefaultDataScope(data.role);
    }

    await userDao.updateById(id, data);

    const newData = { ...oldData, ...data };
    await this.writePermissionLog({
      userId: id,
      username: user.username,
      companyId: user.companyId,
      companyName: (user as any).companyName,
      action: changedFields.includes('role') || changedFields.includes('permissions') || changedFields.includes('dataScope')
        ? PermissionLogAction.PERMISSION_CHANGE
        : PermissionLogAction.UPDATE,
      changeType: changedFields.join('、'),
      oldValue: JSON.stringify(oldData),
      newValue: JSON.stringify(newData),
      changedFields: changedFields.join(','),
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
    });

    return (await userDao.findById(id))!;
  }

  async updateAccountStatus(id: number, targetStatus: string, currentUser: CurrentUser, remark?: string): Promise<UserModel> {
    const user = await this.getById(id, currentUser);

    if (user.accountStatus === targetStatus) {
      throw new ConflictError(`账号已处于${AccountStatusLabel[targetStatus as keyof typeof AccountStatus] || targetStatus}状态`);
    }

    const oldStatus = user.accountStatus;
    const updateData: any = { accountStatus: targetStatus as any };

    if (targetStatus === AccountStatus.FROZEN) {
      updateData.status = 0;
    } else if (targetStatus === AccountStatus.NORMAL) {
      updateData.status = 1;
    }

    await userDao.updateById(id, updateData);

    const action = targetStatus === AccountStatus.FROZEN
      ? PermissionLogAction.FREEZE
      : targetStatus === AccountStatus.NORMAL && oldStatus === AccountStatus.FROZEN
        ? PermissionLogAction.UNFREEZE
        : PermissionLogAction.STATUS_CHANGE;

    await this.writePermissionLog({
      userId: id,
      username: user.username,
      companyId: user.companyId,
      companyName: (user as any).companyName,
      action,
      changeType: '账号状态',
      oldValue: oldStatus,
      newValue: targetStatus,
      changedFields: 'accountStatus',
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      operationRemark: remark,
    });

    return (await userDao.findById(id))!;
  }

  async freezeAccount(id: number, currentUser: CurrentUser, remark?: string): Promise<UserModel> {
    return this.updateAccountStatus(id, AccountStatus.FROZEN, currentUser, remark);
  }

  async unfreezeAccount(id: number, currentUser: CurrentUser): Promise<UserModel> {
    return this.updateAccountStatus(id, AccountStatus.NORMAL, currentUser);
  }

  async batchAssignPermissions(ids: number[], role: string, dataScope: string, currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    const isMain = await this.isMainAccount(currentUser.id);
    if (currentUser.role !== UserRole.ADMIN && !isMain) {
      throw new ForbiddenError('仅主账号可执行批量权限分配');
    }

    const users = await userDao.getByIds ? await userDao.getByIds(ids) : [];
    // 如果没有getByIds方法，使用findAll
    // 这里简化处理

    for (const id of ids) {
      try {
        const user = await this.getById(id, currentUser);
        const perms = JSON.stringify(this.getRolePermissions(role));

        await userDao.updateById(id, {
          role,
          permissions: perms,
          dataScope,
        });

        await this.writePermissionLog({
          userId: id,
          username: user.username,
          companyId: user.companyId,
          companyName: (user as any).companyName,
          action: PermissionLogAction.BATCH_ASSIGN,
          changeType: '批量分配权限',
          oldValue: JSON.stringify({ role: user.role, dataScope: user.dataScope }),
          newValue: JSON.stringify({ role, dataScope }),
          changedFields: 'role,permissions,dataScope',
          operatorId: currentUser.id,
          operatorName: currentUser.username,
          operatorRole: currentUser.role,
        });

        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          userId: id,
          username: '',
          message: err.message || '操作失败',
        });
      }
    }

    return result;
  }

  async batchFreezeAccounts(ids: number[], currentUser: CurrentUser, remark?: string): Promise<BatchResult> {
    const result: BatchResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    const isMain = await this.isMainAccount(currentUser.id);
    if (currentUser.role !== UserRole.ADMIN && !isMain) {
      throw new ForbiddenError('仅主账号可执行批量冻结');
    }

    for (const id of ids) {
      try {
        await this.freezeAccount(id, currentUser, remark);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          userId: id,
          username: '',
          message: err.message || '操作失败',
        });
      }
    }

    return result;
  }

  async getPermissionLogs(params: any, currentUser: CurrentUser): Promise<IPaginationResult<PermissionLogModel>> {
    const where: any = {};
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    return permissionLogDao.findWithFilters({ ...params, ...where });
  }

  async getPermissionLogsByUserId(userId: number, currentUser: CurrentUser): Promise<IPaginationResult<PermissionLogModel>> {
    const user = await this.getById(userId, currentUser);
    return permissionLogDao.findByUserId(userId);
  }

  async getLoginLogs(params: any, currentUser: CurrentUser): Promise<IPaginationResult<LoginLogModel>> {
    const where: any = {};
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    return loginLogDao.findWithFilters({ ...params, ...where });
  }

  async checkLoginAnomaly(userId: number, ip: string, device: string): Promise<{ isAnomaly: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const failedCount = await loginLogDao.countFailedByUserId(userId, oneDayAgo, now);
    if (failedCount >= ANOMALY_LOGIN_THRESHOLDS.maxFailedAttempts) {
      reasons.push(`24小时内登录失败次数达${failedCount}次`);
    }

    const dailyCount = await loginLogDao.countDailyLogin(userId, now);
    if (dailyCount >= ANOMALY_LOGIN_THRESHOLDS.maxDailyLogins) {
      reasons.push(`今日登录次数达${dailyCount}次`);
    }

    const locations = await loginLogDao.getUniqueLocations(userId, 7);
    if (locations.length >= ANOMALY_LOGIN_THRESHOLDS.maxLoginLocations) {
      reasons.push(`7天内登录地点达${locations.length}个`);
    }

    return { isAnomaly: reasons.length > 0, reasons };
  }

  async isMainAccount(userId: number): Promise<boolean> {
    const user = await userDao.findById(userId);
    return user ? (user as any).isMainAccount : false;
  }

  private checkUserPermission(user: UserModel, currentUser: CurrentUser): void {
    if (currentUser.role === UserRole.ADMIN) return;
    if (currentUser.companyId && user.companyId === currentUser.companyId) return;
    throw new ForbiddenError('无权限访问该用户数据');
  }

  private getChangedFields(oldUser: UserModel, newData: any): string[] {
    const fields = ['username', 'realName', 'email', 'phone', 'role', 'department', 'position', 'permissions', 'dataScope', 'status', 'accountStatus', 'remark'];
    const changed: string[] = [];
    for (const field of fields) {
      if (newData[field] !== undefined && newData[field] !== (oldUser as any)[field]) {
        changed.push(field);
      }
    }
    return changed;
  }

  private extractUserData(user: UserModel): any {
    return {
      username: user.username,
      realName: (user as any).realName,
      email: (user as any).email,
      phone: (user as any).phone,
      role: user.role,
      department: (user as any).department,
      position: (user as any).position,
      permissions: (user as any).permissions,
      dataScope: (user as any).dataScope,
      status: user.status,
      accountStatus: (user as any).accountStatus,
    };
  }

  private async writePermissionLog(data: any): Promise<void> {
    await permissionLogDao.create(data);
  }
}

export default new UserPermissionService();

const AccountStatusLabel: Record<string, string> = {
  normal: '正常',
  frozen: '冻结',
  expired: '过期',
};
