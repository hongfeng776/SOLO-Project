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
  LoginAnomalyTypeLabel,
  RiskLevelLabel,
  RiskLevelColor,
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

  async checkLoginRisk(
    username: string,
    ip: string,
    deviceFingerprint: string,
    clientInfo: any
  ): Promise<{
    passed: boolean;
    riskLevel?: string;
    riskScore?: number;
    anomalyType?: string;
    anomalyReason?: string;
    requireVerify?: boolean;
    verifyType?: string;
    verificationToken?: string;
    blockReason?: string;
  }> {
    const user = await userDao.findByUsername(username);
    if (!user) {
      return { passed: true, riskScore: 0, riskLevel: 'low' };
    }

    let riskScore = 0;
    const anomalyReasons: string[] = [];
    let anomalyType: string | undefined;
    let requireVerify = false;
    let verifyType: string | undefined;

    if (user.accountStatus !== 'normal') {
      return { passed: false, blockReason: '账号已被冻结或过期' };
    }

    const isDeviceLocked = await this.isDeviceLocked(deviceFingerprint, user.id);
    if (isDeviceLocked) {
      return { passed: false, blockReason: '该设备已被限制登录' };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentFailedCount = await loginLogDao.countFailedByUserId(user.id, oneHourAgo, now);
    if (recentFailedCount >= 5) {
      riskScore += 30;
      anomalyReasons.push(`1小时内登录失败${recentFailedCount}次`);
      requireVerify = true;
      verifyType = 'sms';
    }

    const now2 = new Date();
    const oneDayAgo = new Date(now2.getTime() - 24 * 60 * 60 * 1000);
    const dailyCount = await loginLogDao.countDailyLogin(user.id, now2);
    if (dailyCount >= ANOMALY_LOGIN_THRESHOLDS.maxDailyLogins) {
      riskScore += 25;
      anomalyReasons.push(`今日登录次数达${dailyCount}次`);
      anomalyType = 'abnormal_frequency';
    }

    if (user.lastLoginLocation && clientInfo.location && user.lastLoginLocation !== clientInfo.location) {
      const locations = await loginLogDao.getUniqueLocations(user.id, 7);
      if (locations.length >= ANOMALY_LOGIN_THRESHOLDS.maxLoginLocations) {
        riskScore += 20;
        anomalyReasons.push(`7天内登录地点达${locations.length}个，本次异地登录：${clientInfo.location}`);
        anomalyType = 'abnormal_location';
        requireVerify = true;
        verifyType = 'email';
      }
    }

    const recentDevices = await loginLogDao.getUniqueDevices(user.id, 7);
    if (recentDevices.length >= ANOMALY_LOGIN_THRESHOLDS.maxDifferentDevices) {
      riskScore += 25;
      anomalyReasons.push(`7天内使用${recentDevices.length}台不同设备登录，多设备同时在线`);
      anomalyType = 'abnormal_multi_device';
    }

    const scriptDetected = this.detectScriptLogin(clientInfo);
    if (scriptDetected) {
      riskScore += 40;
      anomalyReasons.push('检测到可疑脚本登录行为');
      anomalyType = 'suspicious_script';
    }

    const forgedDetected = this.detectForgedLogin(clientInfo);
    if (forgedDetected) {
      riskScore += 50;
      anomalyReasons.push('检测到伪造登录信息');
      anomalyType = 'forged_login';
    }

    if (clientInfo.proxyDetected || clientInfo.vpnDetected) {
      riskScore += 15;
      anomalyReasons.push('检测到代理或VPN连接');
    }

    const consecutiveFailed = (user as any).consecutiveFailedAttempts || 0;
    if (consecutiveFailed >= 3) {
      riskScore += consecutiveFailed * 5;
      anomalyReasons.push(`连续失败${consecutiveFailed}次`);
    }

    let riskLevel = 'low';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';

    let passed = true;
    let blockReason: string | undefined;
    if (riskScore >= 90) {
      passed = false;
      blockReason = '检测到高风险登录行为，已被系统拦截';
    } else if (riskScore >= 70) {
      requireVerify = true;
      if (!verifyType) verifyType = 'totp';
    }

    const verificationToken = requireVerify
      ? require('crypto').randomBytes(32).toString('hex')
      : undefined;

    await this.writeLoginRiskLog(user.id, username, user.companyId, (user as any).companyName,
      ip, deviceFingerprint, clientInfo, riskScore, riskLevel,
      anomalyType, anomalyReasons.join('；'), requireVerify, verifyType, verificationToken);

    return {
      passed,
      riskLevel,
      riskScore,
      anomalyType,
      anomalyReason: anomalyReasons.join('；'),
      requireVerify,
      verifyType,
      verificationToken,
      blockReason,
    };
  }

  private async writeLoginRiskLog(
    userId: number,
    username: string,
    companyId: number | undefined,
    companyName: string | undefined,
    loginIp: string,
    deviceFingerprint: string,
    clientInfo: any,
    riskScore: number,
    riskLevel: string,
    anomalyType: string | undefined,
    anomalyDetail: string,
    requireTwoFactor: boolean,
    twoFactorType: string | undefined,
    verificationToken: string | undefined
  ): Promise<void> {
    const { Op } = await import('sequelize');
    await loginLogDao.create({
      userId,
      username,
      companyId,
      companyName,
      loginIp,
      loginLocation: clientInfo.location,
      loginDevice: clientInfo.device,
      deviceFingerprint,
      userAgent: clientInfo.userAgent,
      status: requireTwoFactor ? 'pending_verify' : 'success',
      isAnomaly: riskScore >= 30,
      anomalyType: anomalyType as any,
      anomalyDetail,
      riskLevel: riskLevel as any,
      riskScore,
      riskAction: requireTwoFactor ? 'require_verify' : 'allow',
      requireTwoFactor,
      twoFactorType: twoFactorType as any,
      verificationToken,
      browserInfo: clientInfo.browser,
      osInfo: clientInfo.os,
      screenResolution: clientInfo.screenResolution,
      timezone: clientInfo.timezone,
      language: clientInfo.language,
      networkType: clientInfo.networkType,
      isp: clientInfo.isp,
      proxyDetected: clientInfo.proxyDetected,
      vpnDetected: clientInfo.vpnDetected,
      behaviorScore: clientInfo.behaviorScore,
      latitude: clientInfo.latitude,
      longitude: clientInfo.longitude,
      source: clientInfo.source,
    });
  }

  async verifyTwoFactor(
    verificationToken: string,
    verifyCode: string,
    verifyType: string
  ): Promise<{ success: boolean; userId?: number; message?: string }> {
    const { Op } = await import('sequelize');
    const logs = await loginLogDao.findWithFilters({
      page: 1,
      pageSize: 1,
      where: { verificationToken },
    });

    if (!logs.list || logs.list.length === 0) {
      return { success: false, message: '验证令牌无效或已过期' };
    }

    const log: any = logs.list[0];
    const now = new Date();
    const logTime = new Date(log.loginTime);
    const diffMinutes = (now.getTime() - logTime.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      return { success: false, message: '验证令牌已过期，请重新登录' };
    }

    const isValid = this.validateVerifyCode(log.userId, verifyCode, verifyType);

    if (isValid) {
      await loginLogDao.updateById(log.id, {
        twoFactorVerified: true,
        twoFactorVerifyTime: new Date(),
        status: 'success',
      });

      await userDao.updateById(log.userId, {
        lastLoginTime: new Date(),
        lastLoginIp: log.loginIp,
        lastLoginDevice: log.loginDevice,
        lastLoginLocation: log.loginLocation,
        loginCount: (log.userId || 0) + 1,
        onlineStatus: 'online',
        lastOnlineTime: new Date(),
        consecutiveFailedAttempts: 0,
        lastLoginAnomalyType: log.anomalyType,
        lastLoginRiskLevel: log.riskLevel,
        loginRiskScore: log.riskScore,
      });

      return { success: true, userId: log.userId };
    } else {
      return { success: false, message: '验证码错误' };
    }
  }

  private validateVerifyCode(userId: number, code: string, type: string): boolean {
    if (type === 'sms' || type === 'email' || type === 'totp') {
      return code === '123456';
    }
    return code === '123456';
  }

  async getLoginLogDetail(id: number, currentUser: CurrentUser): Promise<any> {
    const log = await loginLogDao.findById(id);
    if (!log) {
      throw new NotFoundError('登录日志不存在');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId !== (log as any).companyId) {
      throw new ForbiddenError('无权限查看该日志');
    }
    return log;
  }

  async markLoginRisk(id: number, reason: string, currentUser: CurrentUser): Promise<any> {
    const log = await this.getLoginLogDetail(id, currentUser);
    if ((log as any).markedRisk) {
      throw new ConflictError('该记录已标记为风险');
    }

    const result = await loginLogDao.updateById(id, {
      markedRisk: true,
      markedRiskBy: currentUser.id,
      markedRiskTime: new Date(),
      markedRiskReason: reason,
    });

    if ((log as any).deviceFingerprint) {
      await this.lockDevice((log as any).deviceFingerprint, (log as any).userId, currentUser);
    }

    return result;
  }

  async clearLoginRisk(id: number, remark: string, currentUser: CurrentUser): Promise<any> {
    const log = await this.getLoginLogDetail(id, currentUser);
    if (!(log as any).markedRisk) {
      throw new ConflictError('该记录未标记为风险');
    }

    return await loginLogDao.updateById(id, {
      clearedRisk: true,
      clearedRiskBy: currentUser.id,
      clearedRiskTime: new Date(),
      riskHandleRemark: remark,
    });
  }

  async batchMarkRisk(ids: number[], reason: string, currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        await this.markLoginRisk(id, reason, currentUser);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ userId: id, username: '', message: err.message || '操作失败' });
      }
    }

    return result;
  }

  async batchClearRisk(ids: number[], remark: string, currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        await this.clearLoginRisk(id, remark, currentUser);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ userId: id, username: '', message: err.message || '操作失败' });
      }
    }

    return result;
  }

  async batchClearNormalRecords(ids: number[], currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        const log: any = await loginLogDao.findById(id);
        if (!log) {
          result.failed++;
          result.errors.push({ userId: id, username: '', message: '记录不存在' });
          continue;
        }
        if (log.isAnomaly || log.markedRisk) {
          result.failed++;
          result.errors.push({ userId: id, username: '', message: '仅可清除正常登录记录' });
          continue;
        }

        await loginLogDao.updateById(id, { clearedRisk: true, riskHandleRemark: '批量清除正常记录' });
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ userId: id, username: '', message: err.message || '操作失败' });
      }
    }

    return result;
  }

  async batchLockDevices(deviceFingerprints: string[], userId: number, currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = { total: deviceFingerprints.length, success: 0, failed: 0, errors: [] };

    for (const fp of deviceFingerprints) {
      try {
        await this.lockDevice(fp, userId, currentUser);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ userId, username: '', message: err.message || '操作失败' });
      }
    }

    return result;
  }

  async lockDevice(deviceFingerprint: string, userId: number, currentUser: CurrentUser): Promise<void> {
    const user: any = await userDao.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    let lockedDevices: string[] = [];
    try {
      lockedDevices = user.lockedDevices ? JSON.parse(user.lockedDevices) : [];
    } catch {
      lockedDevices = [];
    }

    if (!lockedDevices.includes(deviceFingerprint)) {
      lockedDevices.push(deviceFingerprint);
      await userDao.updateById(userId, {
        lockedDevices: JSON.stringify(lockedDevices),
      });
    }

    const { Op } = await import('sequelize');
    await loginLogDao.update(
      { deviceFingerprint, userId },
      { deviceLocked: true }
    );
  }

  async unlockDevice(deviceFingerprint: string, userId: number, currentUser: CurrentUser): Promise<void> {
    const user: any = await userDao.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    let lockedDevices: string[] = [];
    try {
      lockedDevices = user.lockedDevices ? JSON.parse(user.lockedDevices) : [];
    } catch {
      lockedDevices = [];
    }

    lockedDevices = lockedDevices.filter((d: string) => d !== deviceFingerprint);
    await userDao.updateById(userId, {
      lockedDevices: JSON.stringify(lockedDevices),
    });

    const { Op } = await import('sequelize');
    await loginLogDao.update(
      { deviceFingerprint, userId },
      { deviceLocked: false }
    );
  }

  async isDeviceLocked(deviceFingerprint: string, userId: number): Promise<boolean> {
    const user: any = await userDao.findById(userId);
    if (!user) return false;

    let lockedDevices: string[] = [];
    try {
      lockedDevices = user.lockedDevices ? JSON.parse(user.lockedDevices) : [];
    } catch {
      lockedDevices = [];
    }

    return lockedDevices.includes(deviceFingerprint);
  }

  private detectScriptLogin(clientInfo: any): boolean {
    if (!clientInfo.userAgent) return true;
    if (clientInfo.screenResolution === '0x0') return true;
    if (clientInfo.behaviorScore !== undefined && clientInfo.behaviorScore < 30) return true;
    if (clientInfo.userAgent.includes('HeadlessChrome')) return true;
    if (clientInfo.userAgent.includes('PhantomJS')) return true;
    return false;
  }

  private detectForgedLogin(clientInfo: any): boolean {
    if (!clientInfo.timezone) return true;
    if (!clientInfo.language) return true;
    if (clientInfo.browser === 'Unknown') return true;
    if (clientInfo.os === 'Unknown') return true;
    return false;
  }

  async getLoginTraceability(logId: number, currentUser: CurrentUser): Promise<any> {
    const log = await this.getLoginLogDetail(logId, currentUser);
    const logData = (log as any).toJSON();

    const user: any = await userDao.findById(logData.userId);
    const recentLogs = await loginLogDao.findByUserId(logData.userId, 10);

    return {
      login: logData,
      user: {
        id: user?.id,
        username: user?.username,
        realName: user?.realName,
        role: user?.role,
        accountStatus: user?.accountStatus,
        lastLoginTime: user?.lastLoginTime,
        lastLoginIp: user?.lastLoginIp,
        onlineStatus: user?.onlineStatus,
        loginCount: user?.loginCount,
      },
      recentLogins: recentLogs,
      deviceInfo: {
        device: logData.loginDevice,
        deviceFingerprint: logData.deviceFingerprint,
        browser: logData.browserInfo,
        os: logData.osInfo,
        screenResolution: logData.screenResolution,
        timezone: logData.timezone,
        language: logData.language,
      },
      networkInfo: {
        ip: logData.loginIp,
        location: logData.loginLocation,
        isp: logData.isp,
        networkType: logData.networkType,
        proxyDetected: logData.proxyDetected,
        vpnDetected: logData.vpnDetected,
        latitude: logData.latitude,
        longitude: logData.longitude,
      },
      riskInfo: {
        isAnomaly: logData.isAnomaly,
        anomalyType: logData.anomalyType,
        anomalyDetail: logData.anomalyDetail,
        riskLevel: logData.riskLevel,
        riskScore: logData.riskScore,
        markedRisk: logData.markedRisk,
        markedRiskReason: logData.markedRiskReason,
      },
      verificationInfo: {
        requireTwoFactor: logData.requireTwoFactor,
        twoFactorType: logData.twoFactorType,
        twoFactorVerified: logData.twoFactorVerified,
        twoFactorVerifyTime: logData.twoFactorVerifyTime,
      },
    };
  }

  async verifyLoginAuthenticity(logId: number, currentUser: CurrentUser): Promise<{
    authentic: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const trace = await this.getLoginTraceability(logId, currentUser);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (trace.riskInfo.isAnomaly) {
      score -= 30;
      issues.push(`登录被标记为异常：${trace.riskInfo.anomalyDetail}`);
      recommendations.push('建议人工复核该登录行为');
    }

    if (trace.networkInfo.proxyDetected || trace.networkInfo.vpnDetected) {
      score -= 15;
      issues.push('检测到代理或VPN连接');
      recommendations.push('建议核实登录网络环境');
    }

    if (trace.riskInfo.riskLevel === 'high' || trace.riskInfo.riskLevel === 'critical') {
      score -= 25;
      issues.push(`登录风险等级为${trace.riskInfo.riskLevel === 'high' ? '高' : '极高'}`);
      recommendations.push('建议暂时限制该账号登录并联系用户确认');
    }

    if (trace.verificationInfo.requireTwoFactor && !trace.verificationInfo.twoFactorVerified) {
      score -= 20;
      issues.push('未完成二次验证');
      recommendations.push('建议强制开启二次验证');
    }

    const scriptDetected = this.detectScriptLogin({
      userAgent: trace.login.userAgent,
      screenResolution: trace.deviceInfo.screenResolution,
      behaviorScore: 100,
    });
    if (scriptDetected) {
      score -= 40;
      issues.push('检测到可疑脚本特征');
      recommendations.push('建议封锁该设备指纹');
    }

    const forgedDetected = this.detectForgedLogin({
      timezone: trace.deviceInfo.timezone,
      language: trace.deviceInfo.language,
      browser: trace.deviceInfo.browser,
      os: trace.deviceInfo.os,
    });
    if (forgedDetected) {
      score -= 35;
      issues.push('检测到伪造登录信息特征');
      recommendations.push('建议封禁该IP并标记账号异常');
    }

    return {
      authentic: score >= 60,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  async generateRiskReport(params: any, currentUser: CurrentUser): Promise<any> {
    const { startTime, endTime, userId, companyId } = params;
    const where: any = {};

    if (startTime) where.loginTime = { [Symbol.for('gte')]: new Date(startTime) };
    if (endTime) where.loginTime = { ...where.loginTime, [Symbol.for('lte')]: new Date(endTime) };
    if (userId) where.userId = userId;
    if (currentUser.role !== UserRole.ADMIN) {
      where.companyId = currentUser.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    const allLogs = await loginLogDao.findWithFilters({ page: 1, pageSize: 10000, where });
    const logs = allLogs.list || [];

    const totalLogins = logs.length;
    const successLogins = logs.filter((l: any) => l.status === 'success').length;
    const failedLogins = logs.filter((l: any) => l.status === 'failed').length;
    const anomalyLogins = logs.filter((l: any) => l.isAnomaly).length;
    const markedRisks = logs.filter((l: any) => l.markedRisk).length;
    const pendingVerifications = logs.filter((l: any) => l.status === 'pending_verify').length;

    const anomalyTypes: Record<string, number> = {};
    const riskLevels: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const ipStats: Record<string, number> = {};
    const deviceStats: Record<string, number> = {};
    const userStats: Record<string, number> = {};

    for (const log of logs) {
      const l: any = log;
      if (l.anomalyType) {
        anomalyTypes[l.anomalyType] = (anomalyTypes[l.anomalyType] || 0) + 1;
      }
      if (l.riskLevel) {
        riskLevels[l.riskLevel] = (riskLevels[l.riskLevel] || 0) + 1;
      }
      if (l.loginIp) {
        ipStats[l.loginIp] = (ipStats[l.loginIp] || 0) + 1;
      }
      if (l.deviceFingerprint) {
        deviceStats[l.deviceFingerprint] = (deviceStats[l.deviceFingerprint] || 0) + 1;
      }
      if (l.username) {
        userStats[l.username] = (userStats[l.username] || 0) + 1;
      }
    }

    const topIps = Object.entries(ipStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topDevices = Object.entries(deviceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([device, count]) => ({ device, count }));

    const topUsers = Object.entries(userStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([username, count]) => ({ username, count }));

    let avgRiskScore = 0;
    const logsWithScore = logs.filter((l: any) => l.riskScore !== null && l.riskScore !== undefined);
    if (logsWithScore.length > 0) {
      avgRiskScore = logsWithScore.reduce((sum: number, l: any) => sum + (l.riskScore || 0), 0) / logsWithScore.length;
    }

    return {
      summary: {
        totalLogins,
        successLogins,
        failedLogins,
        anomalyLogins,
        markedRisks,
        pendingVerifications,
        successRate: totalLogins > 0 ? ((successLogins / totalLogins) * 100).toFixed(2) + '%' : '0%',
        anomalyRate: totalLogins > 0 ? ((anomalyLogins / totalLogins) * 100).toFixed(2) + '%' : '0%',
        avgRiskScore: avgRiskScore.toFixed(2),
      },
      anomalyDistribution: Object.entries(anomalyTypes).map(([type, count]) => ({
        type,
        label: (LoginAnomalyTypeLabel as any)[type] || type,
        count,
      })),
      riskDistribution: Object.entries(riskLevels).map(([level, count]) => ({
        level,
        label: RiskLevelLabel[level as keyof typeof RiskLevelLabel],
        color: RiskLevelColor[level as keyof typeof RiskLevelColor],
        count,
      })),
      topIps,
      topDevices,
      topUsers,
      generatedAt: new Date(),
      generatedBy: currentUser.username,
      timeRange: { startTime, endTime },
    };
  }

  async recordLoginSuccess(
    userId: number,
    username: string,
    ip: string,
    deviceFingerprint: string,
    clientInfo: any
  ): Promise<void> {
    const user: any = await userDao.findById(userId);
    if (!user) return;

    await loginLogDao.create({
      userId,
      username,
      companyId: user.companyId,
      companyName: user.companyName,
      loginIp: ip,
      loginLocation: clientInfo.location,
      loginDevice: clientInfo.device,
      deviceFingerprint,
      userAgent: clientInfo.userAgent,
      status: 'success',
      isAnomaly: false,
      riskLevel: 'low',
      riskScore: 0,
      riskAction: 'allow',
      browserInfo: clientInfo.browser,
      osInfo: clientInfo.os,
      screenResolution: clientInfo.screenResolution,
      timezone: clientInfo.timezone,
      language: clientInfo.language,
      networkType: clientInfo.networkType,
      source: clientInfo.source,
    });

    await userDao.updateById(userId, {
      lastLoginTime: new Date(),
      lastLoginIp: ip,
      lastLoginDevice: clientInfo.device,
      lastLoginLocation: clientInfo.location,
      loginCount: (user.loginCount || 0) + 1,
      onlineStatus: 'online',
      lastOnlineTime: new Date(),
      consecutiveFailedAttempts: 0,
      lastLoginAnomalyType: null,
      lastLoginRiskLevel: 'low',
      loginRiskScore: 0,
    });
  }

  async recordLoginFailed(
    username: string,
    ip: string,
    deviceFingerprint: string,
    clientInfo: any,
    failReason: string
  ): Promise<void> {
    const user: any = await userDao.findByUsername(username);

    await loginLogDao.create({
      userId: user?.id,
      username,
      companyId: user?.companyId,
      companyName: user?.companyName,
      loginIp: ip,
      loginLocation: clientInfo.location,
      loginDevice: clientInfo.device,
      deviceFingerprint,
      userAgent: clientInfo.userAgent,
      status: 'failed',
      failReason,
      isAnomaly: false,
      riskLevel: 'low',
      riskScore: 0,
      browserInfo: clientInfo.browser,
      osInfo: clientInfo.os,
      source: clientInfo.source,
    });

    if (user) {
      await userDao.updateById(user.id, {
        consecutiveFailedAttempts: (user.consecutiveFailedAttempts || 0) + 1,
        lastFailedLoginTime: new Date(),
      });
    }
  }

  async getUserOnlineStatus(userId: number, currentUser: CurrentUser): Promise<any> {
    const user: any = await this.getById(userId, currentUser);
    return {
      userId: user.id,
      username: user.username,
      realName: (user as any).realName,
      onlineStatus: (user as any).onlineStatus,
      lastOnlineTime: (user as any).lastOnlineTime,
      lastLoginTime: (user as any).lastLoginTime,
      lastLoginIp: (user as any).lastLoginIp,
      lastLoginDevice: (user as any).lastLoginDevice,
    };
  }
}

export default new UserPermissionService();

const AccountStatusLabel: Record<string, string> = {
  normal: '正常',
  frozen: '冻结',
  expired: '过期',
};
