import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { USER_STATUS } from './UserValidateService';
import { LOG_TYPES, GRANT_TYPES } from './UserPermissionValidateService';
import UserPermissionService, { OperatorPayload } from './UserPermissionService';
import { BatchResult } from './UserBatchService';

class UserPermissionBatchService {
  private userDao = daos.userDao;
  private userPermissionDao = daos.userPermissionDao;
  private userPermissionLogDao = daos.userPermissionLogDao;
  private adminUserScopeDao = daos.adminUserScopeDao;

  async batchGrantPermissions(
    ids: number[],
    permissionCodes: string[],
    scope: 'partial' | 'global' = 'partial',
    isSuperAdmin: boolean = false,
    adminId?: number,
    operatorPayload: OperatorPayload = {}
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new AppError('权限编码列表不能为空', 400);
    }
    if (scope === 'global' && !isSuperAdmin) {
      throw new AppError('仅超级管理员允许全局操作', 403);
    }

    const allowedUserIds = await this.filterAllowedUserIds(ids, scope, isSuperAdmin, adminId);

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: allowedUserIds } },
    });

    const allGrantedCodes: string[] = [];

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法授予权限' });
          continue;
        }

        const grantResult = await this.safeGrantPermissions(
          user.id,
          permissionCodes,
          GRANT_TYPES.MANUAL,
          undefined,
          operatorPayload
        );

        if (grantResult) {
          allGrantedCodes.push(...grantResult);
          result.successCount++;
          const updatedUser = await this.userDao.findById(user.id);
          if (updatedUser) {
            result.updatedUsers.push(updatedUser);
          }
        } else {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '权限校验失败或无有效权限' });
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    await this.recordBatchLog(
      ids,
      LOG_TYPES.GRANT,
      permissionCodes,
      `批量授予权限：${permissionCodes.join(',')}`,
      scope,
      operatorPayload
    );

    return result;
  }

  async batchRevokePermissions(
    ids: number[],
    permissionCodes: string[],
    reason: string,
    scope: 'partial' | 'global' = 'partial',
    isSuperAdmin: boolean = false,
    adminId?: number,
    operatorPayload: OperatorPayload = {}
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new AppError('权限编码列表不能为空', 400);
    }
    if (!reason) {
      throw new AppError('回收原因不能为空', 400);
    }
    if (scope === 'global' && !isSuperAdmin) {
      throw new AppError('仅超级管理员允许全局操作', 403);
    }

    const allowedUserIds = await this.filterAllowedUserIds(ids, scope, isSuperAdmin, adminId);

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: allowedUserIds } },
    });

    for (const user of users) {
      try {
        const revokedCount = await this.safeRevokePermissions(
          user.id,
          permissionCodes,
          reason,
          operatorPayload
        );

        if (revokedCount >= 0) {
          result.successCount++;
          const updatedUser = await this.userDao.findById(user.id);
          if (updatedUser) {
            result.updatedUsers.push(updatedUser);
          }
        } else {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '回收操作失败' });
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    await this.recordBatchLog(
      ids,
      LOG_TYPES.REVOKE,
      permissionCodes,
      `批量回收权限：${reason}`,
      scope,
      operatorPayload
    );

    return result;
  }

  async batchResetPermissions(
    ids: number[],
    scope: 'partial' | 'global' = 'partial',
    isSuperAdmin: boolean = false,
    adminId?: number,
    operatorPayload: OperatorPayload = {}
  ): Promise<BatchResult> {
    const result: BatchResult = {
      successCount: 0,
      failCount: 0,
      failDetails: [],
      updatedUsers: [],
    };

    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的用户', 400);
    }
    if (scope === 'global' && !isSuperAdmin) {
      throw new AppError('仅超级管理员允许全局操作', 403);
    }

    const allowedUserIds = await this.filterAllowedUserIds(ids, scope, isSuperAdmin, adminId);

    const users = await this.userDao.findAll({
      where: { id: { [Op.in]: allowedUserIds } },
    });

    for (const user of users) {
      try {
        if (user.status === USER_STATUS.CANCELED) {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '注销用户无法重置权限' });
          continue;
        }

        const resetResult = await this.safeResetPermissions(user.id, operatorPayload);
        if (resetResult) {
          result.successCount++;
          const updatedUser = await this.userDao.findById(user.id);
          if (updatedUser) {
            result.updatedUsers.push(updatedUser);
          }
        } else {
          result.failCount++;
          result.failDetails.push({ id: user.id, message: '重置权限失败' });
        }
      } catch (err: any) {
        result.failCount++;
        result.failDetails.push({ id: user.id, message: err.message });
      }
    }

    await this.recordBatchLog(
      ids,
      LOG_TYPES.RESET,
      [],
      '批量重置为默认权限',
      scope,
      operatorPayload
    );

    return result;
  }

  private async filterAllowedUserIds(
    ids: number[],
    scope: 'partial' | 'global',
    isSuperAdmin: boolean,
    adminId?: number
  ): Promise<number[]> {
    if (isSuperAdmin) {
      return ids;
    }

    if (scope === 'global') {
      return [];
    }

    if (!adminId) {
      return ids;
    }

    const scopeRecords = await this.adminUserScopeDao.findAll({
      where: { admin_id: adminId },
    });

    const scopedUserIds = scopeRecords.map(s => s.user_id);
    return ids.filter(id => scopedUserIds.includes(id));
  }

  private async safeGrantPermissions(
    userId: number,
    permissionCodes: string[],
    grantType: number,
    expireTime: Date | undefined,
    operatorPayload: OperatorPayload
  ): Promise<string[] | null> {
    try {
      const userPermissionService = new UserPermissionService();
      const result = await (userPermissionService as any).grantPermissions(
        userId,
        permissionCodes,
        grantType,
        expireTime,
        operatorPayload
      );
      return result.grantedCodes || null;
    } catch (err) {
      return null;
    }
  }

  private async safeRevokePermissions(
    userId: number,
    permissionCodes: string[],
    reason: string,
    operatorPayload: OperatorPayload
  ): Promise<number> {
    try {
      const activePermissions = await this.userPermissionDao.findAll({
        where: {
          user_id: userId,
          permission_code: { [Op.in]: permissionCodes },
          status: 1,
        },
      });

      const now = new Date();
      const revokedCodes: string[] = [];

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

      await this.bumpUserPermissionVersion(userId);

      return revokedCodes.length;
    } catch (err) {
      return -1;
    }
  }

  private async safeResetPermissions(
    userId: number,
    operatorPayload: OperatorPayload
  ): Promise<boolean> {
    try {
      const userPermissionService = new UserPermissionService();
      await (userPermissionService as any).resetToDefaultPermissions(userId, operatorPayload);
      return true;
    } catch (err) {
      return false;
    }
  }

  private async bumpUserPermissionVersion(userId: number) {
    const user = await this.userDao.findById(userId);
    if (!user) return;

    const activePermissions = await this.userPermissionDao.findAll({
      where: { user_id: userId, status: 1 },
    });
    const codes = activePermissions.map(a => a.permission_code);
    const details: Record<string, any> = {};
    for (const a of activePermissions) {
      details[a.permission_code] = {
        grant_type: a.grant_type,
        granted_time: a.granted_time,
        expire_time: a.expire_time,
      };
    }
    const snapshot = { codes, details };

    const currentVersion = (user as any).permission_version || 0;
    await this.userDao.update(userId, {
      permissions: JSON.stringify(snapshot),
      permission_version: currentVersion + 1,
    } as any);
  }

  private async recordBatchLog(
    userIds: number[],
    logType: number,
    permissionCodes: string[],
    reason: string,
    scope: 'partial' | 'global',
    operatorPayload: OperatorPayload
  ) {
    const sampleUser = await this.userDao.findById(userIds[0]);
    await this.userPermissionLogDao.create({
      user_id: userIds[0],
      username: sampleUser?.username,
      log_type: LOG_TYPES.BATCH,
      permission_codes: permissionCodes.join(','),
      permission_details: JSON.stringify({
        batch_user_ids: userIds,
        batch_count: userIds.length,
        log_type: logType,
        permission_codes: permissionCodes,
      }),
      operator_id: operatorPayload.operator_id,
      operator_name: operatorPayload.operator_name,
      operator_role: operatorPayload.operator_role,
      operate_ip: operatorPayload.operate_ip,
      operate_scope: scope === 'global' ? 'global' : 'batch',
      reason,
    } as any);
  }
}

export const userPermissionBatchService = new UserPermissionBatchService();
export default UserPermissionBatchService;
