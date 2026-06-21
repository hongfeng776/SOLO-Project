import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { USER_STATUS } from './UserValidateService';
import {
  GRANT_TYPES,
  LOG_TYPES,
  FREEZE_TYPES,
  CANCEL_TYPES,
  userPermissionValidateService,
} from './UserPermissionValidateService';
import { SystemPermission } from '../models/SystemPermission';
import { UserPermission } from '../models/UserPermission';

export interface OperatorPayload {
  operator_id?: number;
  operator_name?: string;
  operator_role?: string;
  operate_ip?: string;
}

export interface UserPermissionsResult {
  allPermissions: SystemPermission[];
  groupedPermissions: Record<string, SystemPermission[]>;
  grantedList: UserPermission[];
  revokedList: UserPermission[];
}

interface PermissionSnapshot {
  codes: string[];
  details: Record<string, any>;
}

class UserPermissionService {
  private userDao = daos.userDao;
  private systemPermissionDao = daos.systemPermissionDao;
  private userPermissionDao = daos.userPermissionDao;
  private userPermissionLogDao = daos.userPermissionLogDao;

  async changeStatusWithPermission(
    userId: number,
    newStatus: number,
    freezeType: number = FREEZE_TYPES.NONE,
    cancelType: number = CANCEL_TYPES.NONE,
    reason?: string,
    operatorPayload: OperatorPayload = {}
  ): Promise<any> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }
    if (![USER_STATUS.NORMAL, USER_STATUS.FROZEN, USER_STATUS.CANCELED].includes(newStatus)) {
      throw new AppError('无效的用户状态', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const oldStatus = user.status || USER_STATUS.NORMAL;

    if (oldStatus === USER_STATUS.CANCELED && newStatus !== USER_STATUS.CANCELED) {
      throw new AppError('注销用户无法恢复', 400);
    }

    const beforeSnapshot = await this.getPermissionSnapshot(userId);
    const beforePermissions = this.snapshotToJson(beforeSnapshot);

    const activeUserPermissions = await this.userPermissionDao.findAll({
      where: { user_id: userId, status: 1 },
    });

    const allowedCodes = userPermissionValidateService.getStatusAllowedPermissions(
      newStatus,
      freezeType,
      cancelType
    );

    const revokedCodes: string[] = [];
    const now = new Date();

    for (const up of activeUserPermissions) {
      const isAllowed = allowedCodes.length === 0 || allowedCodes.includes(up.permission_code);
      if (!isAllowed) {
        await this.userPermissionDao.update(up.id, {
          status: 0,
          revoke_reason: reason || `状态变更联动回收：${this.statusText(newStatus)}`,
          revoked_by: operatorPayload.operator_id,
          revoked_by_name: operatorPayload.operator_name,
          revoked_time: now,
        } as any);
        revokedCodes.push(up.permission_code);
      }
    }

    const userUpdateData: any = {
      status: newStatus,
    };
    if (newStatus === USER_STATUS.FROZEN) {
      userUpdateData.frozen_time = now;
      userUpdateData.frozen_reason = reason || '账号冻结';
    } else if (oldStatus === USER_STATUS.FROZEN && newStatus === USER_STATUS.NORMAL) {
      userUpdateData.frozen_time = null;
      userUpdateData.frozen_reason = null;
    } else if (newStatus === USER_STATUS.CANCELED) {
      userUpdateData.cancel_time = now;
    }

    await this.bumpPermissionVersion(userId, userUpdateData);
    await this.userDao.update(userId, userUpdateData);

    const afterSnapshot = await this.getPermissionSnapshot(userId);
    const afterPermissions = this.snapshotToJson(afterSnapshot);

    await this.userPermissionLogDao.create({
      user_id: userId,
      username: user.username,
      log_type: LOG_TYPES.STATUS_LINKAGE,
      permission_codes: revokedCodes.join(','),
      permission_details: JSON.stringify({ revoked: revokedCodes, freeze_type: freezeType, cancel_type: cancelType }),
      operator_id: operatorPayload.operator_id,
      operator_name: operatorPayload.operator_name,
      operator_role: operatorPayload.operator_role,
      operate_ip: operatorPayload.operate_ip,
      operate_scope: 'single',
      reason: reason || `状态变更：${this.statusText(oldStatus)} → ${this.statusText(newStatus)}`,
      before_status: oldStatus,
      after_status: newStatus,
      before_permissions: beforePermissions,
      after_permissions: afterPermissions,
    } as any);

    return {
      userId,
      oldStatus,
      newStatus,
      revokedCount: revokedCodes.length,
      revokedCodes,
    };
  }

  async grantPermissions(
    userId: number,
    permissionCodes: string[],
    grantType: number = GRANT_TYPES.MANUAL,
    expireTime?: Date,
    operatorPayload: OperatorPayload = {}
  ): Promise<any> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new AppError('权限编码列表不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    if (user.status === USER_STATUS.CANCELED) {
      throw new AppError('注销用户无法授予权限', 400);
    }

    const validateResult = await userPermissionValidateService.validatePermissionGrant(
      userId,
      permissionCodes
    );
    if (!validateResult.valid) {
      throw new AppError(
        `权限校验失败：${validateResult.errors[0]}`,
        400,
        validateResult
      );
    }

    const beforeSnapshot = await this.getPermissionSnapshot(userId);
    const beforePermissions = this.snapshotToJson(beforeSnapshot);

    const systemPermissions = validateResult.allowedPermissions;
    const grantedList: string[] = [];
    const now = new Date();

    for (const perm of systemPermissions) {
      const existing = await this.userPermissionDao.findOne({
        where: {
          user_id: userId,
          permission_id: perm.id,
          permission_code: perm.permission_code,
        },
      });

      if (existing) {
        if (existing.status === 1) {
          continue;
        }
        await this.userPermissionDao.update(existing.id, {
          status: 1,
          grant_type: grantType,
          granted_by: operatorPayload.operator_id,
          granted_by_name: operatorPayload.operator_name,
          granted_time: now,
          expire_time: expireTime || null,
          revoke_reason: null,
          revoked_by: null,
          revoked_by_name: null,
          revoked_time: null,
        } as any);
      } else {
        await this.userPermissionDao.create({
          user_id: userId,
          permission_id: perm.id,
          permission_code: perm.permission_code,
          grant_type: grantType,
          granted_by: operatorPayload.operator_id,
          granted_by_name: operatorPayload.operator_name,
          granted_time: now,
          expire_time: expireTime || null,
          status: 1,
        } as any);
      }
      grantedList.push(perm.permission_code);
    }

    await this.bumpPermissionVersion(userId);

    const afterSnapshot = await this.getPermissionSnapshot(userId);
    const afterPermissions = this.snapshotToJson(afterSnapshot);

    await this.userPermissionLogDao.create({
      user_id: userId,
      username: user.username,
      log_type: LOG_TYPES.GRANT,
      permission_codes: grantedList.join(','),
      permission_details: JSON.stringify({ granted: grantedList, grant_type: grantType, expire_time: expireTime }),
      operator_id: operatorPayload.operator_id,
      operator_name: operatorPayload.operator_name,
      operator_role: operatorPayload.operator_role,
      operate_ip: operatorPayload.operate_ip,
      operate_scope: 'single',
      reason: `授予权限${grantType === GRANT_TYPES.DEFAULT ? '（默认）' : grantType === GRANT_TYPES.UPGRADE ? '（升级）' : grantType === GRANT_TYPES.ACTIVITY ? '（活动）' : ''}`,
      before_status: user.status,
      after_status: user.status,
      before_permissions: beforePermissions,
      after_permissions: afterPermissions,
    } as any);

    return {
      userId,
      grantedCount: grantedList.length,
      grantedCodes: grantedList,
    };
  }

  async revokePermissions(
    userId: number,
    permissionCodes: string[],
    reason: string,
    operatorPayload: OperatorPayload = {}
  ): Promise<any> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new AppError('权限编码列表不能为空', 400);
    }
    if (!reason) {
      throw new AppError('回收原因不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const beforeSnapshot = await this.getPermissionSnapshot(userId);
    const beforePermissions = this.snapshotToJson(beforeSnapshot);

    const activePermissions = await this.userPermissionDao.findAll({
      where: {
        user_id: userId,
        permission_code: { [Op.in]: permissionCodes },
        status: 1,
      },
    });

    const revokedCodes: string[] = [];
    const now = new Date();

    for (const up of activePermissions) {
      await this.userPermissionDao.update(up.id, {
        status: 0,
        revoke_reason: reason,
        revoked_by: operatorPayload.operator_id,
        revoked_by_name: operatorPayload.operator_name,
        revoked_time: now,
      } as any);
      revokedCodes.push(up.permission_code);
    }

    await this.bumpPermissionVersion(userId);

    const afterSnapshot = await this.getPermissionSnapshot(userId);
    const afterPermissions = this.snapshotToJson(afterSnapshot);

    await this.userPermissionLogDao.create({
      user_id: userId,
      username: user.username,
      log_type: LOG_TYPES.REVOKE,
      permission_codes: revokedCodes.join(','),
      permission_details: JSON.stringify({ revoked: revokedCodes, reason }),
      operator_id: operatorPayload.operator_id,
      operator_name: operatorPayload.operator_name,
      operator_role: operatorPayload.operator_role,
      operate_ip: operatorPayload.operate_ip,
      operate_scope: 'single',
      reason,
      before_status: user.status,
      after_status: user.status,
      before_permissions: beforePermissions,
      after_permissions: afterPermissions,
    } as any);

    return {
      userId,
      revokedCount: revokedCodes.length,
      revokedCodes,
    };
  }

  async resetToDefaultPermissions(
    userId: number,
    operatorPayload: OperatorPayload = {}
  ): Promise<any> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    if (user.status === USER_STATUS.CANCELED) {
      throw new AppError('注销用户无法重置权限', 400);
    }

    const beforeSnapshot = await this.getPermissionSnapshot(userId);
    const beforePermissions = this.snapshotToJson(beforeSnapshot);

    const defaultPermissions = await this.systemPermissionDao.findAll({
      where: { is_default: 1, status: 1 },
    });

    const allActive = await this.userPermissionDao.findAll({
      where: { user_id: userId, status: 1 },
    });

    const defaultCodes = defaultPermissions.map(p => p.permission_code);
    const activeCodes = allActive.map(p => p.permission_code);

    const revokeCodes = activeCodes.filter(c => !defaultCodes.includes(c));
    const grantCodes = defaultCodes.filter(c => !activeCodes.includes(c));

    const now = new Date();

    for (const up of allActive) {
      if (revokeCodes.includes(up.permission_code)) {
        await this.userPermissionDao.update(up.id, {
          status: 0,
          revoke_reason: '权限重置：非默认权限回收',
          revoked_by: operatorPayload.operator_id,
          revoked_by_name: operatorPayload.operator_name,
          revoked_time: now,
        } as any);
      }
    }

    for (const perm of defaultPermissions) {
      if (grantCodes.includes(perm.permission_code)) {
        const existing = await this.userPermissionDao.findOne({
          where: {
            user_id: userId,
            permission_id: perm.id,
            permission_code: perm.permission_code,
          },
        });
        if (existing) {
          await this.userPermissionDao.update(existing.id, {
            status: 1,
            grant_type: GRANT_TYPES.DEFAULT,
            granted_by: operatorPayload.operator_id,
            granted_by_name: operatorPayload.operator_name,
            granted_time: now,
            expire_time: null,
            revoke_reason: null,
            revoked_by: null,
            revoked_by_name: null,
            revoked_time: null,
          } as any);
        } else {
          await this.userPermissionDao.create({
            user_id: userId,
            permission_id: perm.id,
            permission_code: perm.permission_code,
            grant_type: GRANT_TYPES.DEFAULT,
            granted_by: operatorPayload.operator_id,
            granted_by_name: operatorPayload.operator_name,
            granted_time: now,
            expire_time: null,
            status: 1,
          } as any);
        }
      }
    }

    await this.bumpPermissionVersion(userId);

    const afterSnapshot = await this.getPermissionSnapshot(userId);
    const afterPermissions = this.snapshotToJson(afterSnapshot);

    await this.userPermissionLogDao.create({
      user_id: userId,
      username: user.username,
      log_type: LOG_TYPES.RESET,
      permission_codes: [...revokeCodes, ...grantCodes].join(','),
      permission_details: JSON.stringify({ revoked: revokeCodes, granted: grantCodes, mode: 'default' }),
      operator_id: operatorPayload.operator_id,
      operator_name: operatorPayload.operator_name,
      operator_role: operatorPayload.operator_role,
      operate_ip: operatorPayload.operate_ip,
      operate_scope: 'single',
      reason: '重置为默认权限',
      before_status: user.status,
      after_status: user.status,
      before_permissions: beforePermissions,
      after_permissions: afterPermissions,
    } as any);

    return {
      userId,
      revokedCount: revokeCodes.length,
      grantedCount: grantCodes.length,
      revokedCodes: revokeCodes,
      grantedCodes: grantCodes,
    };
  }

  async getUserPermissions(userId: number): Promise<UserPermissionsResult> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const userPermissions = await this.userPermissionDao.findAll({
      where: { user_id: userId },
      order: [['granted_time', 'DESC']],
    });

    const grantedList = userPermissions.filter(up => up.status === 1);
    const revokedList = userPermissions.filter(up => up.status !== 1);

    const activeCodes = grantedList.map(up => up.permission_code);

    let allPermissions: SystemPermission[] = [];
    if (activeCodes.length > 0) {
      allPermissions = await this.systemPermissionDao.findAll({
        where: { permission_code: { [Op.in]: activeCodes }, status: 1 },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
    }

    const groupedPermissions: Record<string, SystemPermission[]> = {};
    for (const perm of allPermissions) {
      const group = perm.permission_group || 'other';
      if (!groupedPermissions[group]) {
        groupedPermissions[group] = [];
      }
      groupedPermissions[group].push(perm);
    }

    return {
      allPermissions,
      groupedPermissions,
      grantedList,
      revokedList,
    };
  }

  private async getPermissionSnapshot(userId: number): Promise<PermissionSnapshot> {
    const active = await this.userPermissionDao.findAll({
      where: { user_id: userId, status: 1 },
    });
    const codes = active.map(a => a.permission_code);
    const details: Record<string, any> = {};
    for (const a of active) {
      details[a.permission_code] = {
        grant_type: a.grant_type,
        granted_time: a.granted_time,
        expire_time: a.expire_time,
      };
    }
    return { codes, details };
  }

  private snapshotToJson(snapshot: PermissionSnapshot): string {
    return JSON.stringify(snapshot);
  }

  private async bumpPermissionVersion(userId: number, extraData?: any) {
    const user = await this.userDao.findById(userId);
    if (!user) return;

    const snapshot = await this.getPermissionSnapshot(userId);
    const currentVersion = (user as any).permission_version || 0;

    const updateData: any = {
      permissions: JSON.stringify(snapshot),
      permission_version: currentVersion + 1,
    };
    if (extraData) {
      Object.assign(updateData, extraData);
    }
    await this.userDao.update(userId, updateData);
  }

  private statusText(status: number): string {
    switch (status) {
      case USER_STATUS.NORMAL:
        return '正常';
      case USER_STATUS.FROZEN:
        return '冻结';
      case USER_STATUS.CANCELED:
        return '注销';
      default:
        return '未知';
    }
  }
}

export const userPermissionService = new UserPermissionService();
export default UserPermissionService;
