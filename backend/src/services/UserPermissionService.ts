import { Op } from 'sequelize';
import { PermissionConfig, UserPermission, UserPermissionLog, User } from '@/models';
import { AppError } from '@/middlewares/errorHandler';
import { PageResult } from '@/types';

export const USER_STATUS = {
  NORMAL: 1,
  FROZEN: 2,
  CANCELED: 3,
} as const;

export const FREEZE_TYPE = {
  TEMPORARY: 1,
  PERMANENT: 2,
} as const;

export const GRANT_TYPE = {
  DEFAULT: 1,
  MANUAL: 2,
  TEMPORARY: 3,
  BATCH: 4,
} as const;

export const OPERATION_TYPE = {
  GRANT: 'grant',
  REVOKE: 'revoke',
  BATCH_GRANT: 'batch_grant',
  BATCH_REVOKE: 'batch_revoke',
  RESET: 'reset',
  STATUS_CHANGE: 'status_change',
} as const;

export const OPERATION_SCOPE = {
  SINGLE: 'single',
  BATCH: 'batch',
  GLOBAL: 'global',
} as const;

export const PERMISSION_LEVEL = {
  BASIC: 1,
  ADVANCED: 2,
  SPECIAL: 3,
} as const;

export interface GrantOptions {
  grantType?: number;
  grantSource?: string;
  operatorId?: number;
  operatorName?: string;
  reason?: string;
}

export interface RevokeOptions {
  operatorId?: number;
  operatorName?: string;
  reason?: string;
}

export interface ResetOptions {
  operatorId?: number;
  operatorName?: string;
  reason?: string;
}

export interface BatchOptions {
  scope?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  reason?: string;
}

export interface PermissionLogParams {
  page?: number;
  pageSize?: number;
  operationType?: string;
}

export interface StatusChangeOptions {
  operatorId?: number;
  operatorName?: string;
}

class UserPermissionService {
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const permissions = await UserPermission.findAll({
      where: {
        user_id: userId,
        is_revoked: 0,
      },
      include: [
        {
          model: PermissionConfig,
          as: 'permissionConfig',
          where: { status: 1 },
          required: false,
        },
      ],
      order: [['granted_at', 'DESC']],
    });

    return permissions;
  }

  async getAvailablePermissions(
    userId: number,
    userLevel: number,
    riskLevel: number,
    status: number
  ): Promise<PermissionConfig[]> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const where: any = {
      status: 1,
      min_user_level: { [Op.lte]: userLevel },
      max_risk_level: { [Op.gte]: riskLevel },
    };

    const allPermissions = await PermissionConfig.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });

    const statusStr = String(status);
    const filteredPermissions = allPermissions.filter((perm) => {
      const allowedStatus = perm.allowed_status || '1';
      const statusList = allowedStatus.split(',').map((s) => s.trim());
      return statusList.includes(statusStr);
    });

    const result = this.applyRiskRestrictions(filteredPermissions, riskLevel);

    return result;
  }

  private applyRiskRestrictions(
    permissions: PermissionConfig[],
    riskLevel: number
  ): PermissionConfig[] {
    if (riskLevel < 2) {
      return permissions;
    }

    const restrictedTypes = ['marketing', 'order'];
    const restrictedCodes = ['review_product'];

    return permissions.filter((perm) => {
      if (restrictedTypes.includes(perm.permission_type)) {
        if (perm.permission_level && perm.permission_level > PERMISSION_LEVEL.BASIC) {
          return false;
        }
      }
      if (restrictedCodes.includes(perm.permission_code)) {
        return false;
      }
      return true;
    });
  }

  async validatePermissionGrant(
    userId: number,
    permissionId: number,
    operatorRole?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const user = await User.findByPk(userId);
    if (!user) {
      return { valid: false, reason: '用户不存在' };
    }

    const permission = await PermissionConfig.findByPk(permissionId);
    if (!permission) {
      return { valid: false, reason: '权限不存在' };
    }

    if (permission.status !== 1) {
      return { valid: false, reason: '该权限已禁用' };
    }

    const userLevel = user.level || 1;
    if (permission.min_user_level && userLevel < permission.min_user_level) {
      return { valid: false, reason: '用户等级不足，无法授予该权限' };
    }

    const riskLevel = user.risk_level || 0;
    if (permission.max_risk_level !== undefined && riskLevel > permission.max_risk_level) {
      return { valid: false, reason: '用户风险等级过高，无法授予该权限' };
    }

    const status = user.status || USER_STATUS.NORMAL;
    const allowedStatus = permission.allowed_status || '1';
    const statusList = allowedStatus.split(',').map((s) => s.trim());
    if (!statusList.includes(String(status))) {
      return { valid: false, reason: '当前用户状态不支持该权限' };
    }

    if (operatorRole && permission.permission_level && permission.permission_level >= PERMISSION_LEVEL.SPECIAL) {
      if (operatorRole !== 'super_admin') {
        return { valid: false, reason: '特殊权限需要超级管理员角色才能授予' };
      }
    }

    return { valid: true };
  }

  async grantPermission(
    userId: number,
    permissionId: number,
    options: GrantOptions = {}
  ): Promise<UserPermission> {
    const { grantType = GRANT_TYPE.MANUAL, grantSource = 'manual', operatorId, operatorName, reason } = options;

    const validateResult = await this.validatePermissionGrant(userId, permissionId);
    if (!validateResult.valid) {
      throw new AppError(validateResult.reason || '权限授予校验失败', 400);
    }

    const permission = await PermissionConfig.findByPk(permissionId);
    if (!permission) {
      throw new AppError('权限不存在', 404);
    }

    const existingPermission = await UserPermission.findOne({
      where: {
        user_id: userId,
        permission_id: permissionId,
      },
    });

    let userPermission: UserPermission;

    if (existingPermission) {
      if (existingPermission.is_revoked === 0) {
        throw new AppError('用户已拥有该权限', 400);
      }

      await existingPermission.update({
        is_revoked: 0,
        grant_type: grantType,
        grant_source: grantSource,
        granted_by: operatorId,
        granted_by_name: operatorName,
        granted_at: new Date(),
        revoked_by: null,
        revoked_by_name: null,
        revoked_at: null,
        revoke_reason: null,
        expire_time: null,
      });

      userPermission = existingPermission;
    } else {
      userPermission = await UserPermission.create({
        user_id: userId,
        permission_id: permissionId,
        permission_code: permission.permission_code,
        grant_type: grantType,
        grant_source: grantSource,
        granted_by: operatorId,
        granted_by_name: operatorName,
        granted_at: new Date(),
        is_revoked: 0,
      });
    }

    await this.recordPermissionLog(
      userId,
      permissionId,
      permission.permission_code,
      OPERATION_TYPE.GRANT,
      OPERATION_SCOPE.SINGLE,
      operatorId,
      operatorName,
      undefined,
      reason
    );

    return userPermission;
  }

  async revokePermission(
    userId: number,
    permissionId: number,
    options: RevokeOptions = {}
  ): Promise<void> {
    const { operatorId, operatorName, reason } = options;

    const userPermission = await UserPermission.findOne({
      where: {
        user_id: userId,
        permission_id: permissionId,
        is_revoked: 0,
      },
    });

    if (!userPermission) {
      throw new AppError('用户未拥有该权限或权限已回收', 400);
    }

    const permission = await PermissionConfig.findByPk(permissionId);

    await userPermission.update({
      is_revoked: 1,
      revoked_by: operatorId,
      revoked_by_name: operatorName,
      revoked_at: new Date(),
      revoke_reason: reason,
    });

    await this.recordPermissionLog(
      userId,
      permissionId,
      permission?.permission_code,
      OPERATION_TYPE.REVOKE,
      OPERATION_SCOPE.SINGLE,
      operatorId,
      operatorName,
      undefined,
      reason
    );
  }

  async resetUserPermissions(
    userId: number,
    options: ResetOptions = {}
  ): Promise<void> {
    const { operatorId, operatorName, reason } = options;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const beforePermissions = await this.getUserPermissionCodes(userId);

    await UserPermission.update(
      {
        is_revoked: 1,
        revoked_by: operatorId,
        revoked_by_name: operatorName,
        revoked_at: new Date(),
        revoke_reason: reason || '重置权限',
      },
      {
        where: {
          user_id: userId,
          is_revoked: 0,
        },
      }
    );

    const defaultPermissions = await this.getDefaultPermissions(
      user.level || 1,
      user.risk_level || 0,
      user.status || USER_STATUS.NORMAL
    );

    for (const perm of defaultPermissions) {
      const existing = await UserPermission.findOne({
        where: {
          user_id: userId,
          permission_id: perm.id,
        },
      });

      if (existing) {
        await existing.update({
          is_revoked: 0,
          grant_type: GRANT_TYPE.DEFAULT,
          grant_source: 'default',
          granted_by: null,
          granted_by_name: null,
          granted_at: new Date(),
          revoked_by: null,
          revoked_by_name: null,
          revoked_at: null,
          revoke_reason: null,
        });
      } else {
        await UserPermission.create({
          user_id: userId,
          permission_id: perm.id,
          permission_code: perm.permission_code,
          grant_type: GRANT_TYPE.DEFAULT,
          grant_source: 'default',
          is_revoked: 0,
        });
      }
    }

    const afterPermissions = await this.getUserPermissionCodes(userId);

    await this.recordPermissionLog(
      userId,
      undefined,
      undefined,
      OPERATION_TYPE.RESET,
      OPERATION_SCOPE.SINGLE,
      operatorId,
      operatorName,
      undefined,
      reason,
      JSON.stringify(beforePermissions),
      JSON.stringify(afterPermissions)
    );
  }

  private async getDefaultPermissions(
    userLevel: number,
    riskLevel: number,
    status: number
  ): Promise<PermissionConfig[]> {
    const where: any = {
      status: 1,
      permission_level: PERMISSION_LEVEL.BASIC,
      min_user_level: { [Op.lte]: userLevel },
      max_risk_level: { [Op.gte]: riskLevel },
    };

    const permissions = await PermissionConfig.findAll({
      where,
      order: [['sort_order', 'ASC']],
    });

    const statusStr = String(status);
    const filtered = permissions.filter((perm) => {
      const allowedStatus = perm.allowed_status || '1';
      const statusList = allowedStatus.split(',').map((s) => s.trim());
      return statusList.includes(statusStr);
    });

    return this.applyRiskRestrictions(filtered, riskLevel);
  }

  private async getUserPermissionCodes(userId: number): Promise<string[]> {
    const permissions = await UserPermission.findAll({
      where: {
        user_id: userId,
        is_revoked: 0,
      },
      attributes: ['permission_code'],
    });

    return permissions.map((p) => p.permission_code);
  }

  async batchGrantPermissions(
    userIds: number[],
    permissionIds: number[],
    options: BatchOptions = {}
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { scope = 'partial', operatorId, operatorName, operatorRole, reason } = options;

    if (!userIds || userIds.length === 0) {
      throw new AppError('请选择用户', 400);
    }

    if (!permissionIds || permissionIds.length === 0) {
      throw new AppError('请选择权限', 400);
    }

    if (scope === OPERATION_SCOPE.GLOBAL && operatorRole !== 'super_admin') {
      throw new AppError('全局批量操作需要超级管理员权限', 403);
    }

    const errors: string[] = [];
    let successCount = 0;

    for (const userId of userIds) {
      for (const permissionId of permissionIds) {
        try {
          await this.grantPermission(userId, permissionId, {
            grantType: GRANT_TYPE.BATCH,
            grantSource: 'batch',
            operatorId,
            operatorName,
            reason,
          });
          successCount++;
        } catch (err: any) {
          errors.push(`用户${userId}权限${permissionId}: ${err.message}`);
        }
      }
    }

    const scopeValue = scope === OPERATION_SCOPE.GLOBAL ? OPERATION_SCOPE.GLOBAL : OPERATION_SCOPE.BATCH;
    for (const userId of userIds) {
      await this.recordPermissionLog(
        userId,
        undefined,
        undefined,
        OPERATION_TYPE.BATCH_GRANT,
        scopeValue,
        operatorId,
        operatorName,
        operatorRole,
        reason
      );
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async batchRevokePermissions(
    userIds: number[],
    permissionIds: number[],
    options: BatchOptions = {}
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { scope = 'partial', operatorId, operatorName, operatorRole, reason } = options;

    if (!userIds || userIds.length === 0) {
      throw new AppError('请选择用户', 400);
    }

    if (!permissionIds || permissionIds.length === 0) {
      throw new AppError('请选择权限', 400);
    }

    if (scope === OPERATION_SCOPE.GLOBAL && operatorRole !== 'super_admin') {
      throw new AppError('全局批量操作需要超级管理员权限', 403);
    }

    const errors: string[] = [];
    let successCount = 0;

    for (const userId of userIds) {
      for (const permissionId of permissionIds) {
        try {
          await this.revokePermission(userId, permissionId, {
            operatorId,
            operatorName,
            reason,
          });
          successCount++;
        } catch (err: any) {
          errors.push(`用户${userId}权限${permissionId}: ${err.message}`);
        }
      }
    }

    const scopeValue = scope === OPERATION_SCOPE.GLOBAL ? OPERATION_SCOPE.GLOBAL : OPERATION_SCOPE.BATCH;
    for (const userId of userIds) {
      await this.recordPermissionLog(
        userId,
        undefined,
        undefined,
        OPERATION_TYPE.BATCH_REVOKE,
        scopeValue,
        operatorId,
        operatorName,
        operatorRole,
        reason
      );
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async batchResetPermissions(
    userIds: number[],
    options: BatchOptions = {}
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { scope = 'partial', operatorId, operatorName, operatorRole, reason } = options;

    if (!userIds || userIds.length === 0) {
      throw new AppError('请选择用户', 400);
    }

    if (scope === OPERATION_SCOPE.GLOBAL && operatorRole !== 'super_admin') {
      throw new AppError('全局批量操作需要超级管理员权限', 403);
    }

    const errors: string[] = [];
    let successCount = 0;

    for (const userId of userIds) {
      try {
        await this.resetUserPermissions(userId, {
          operatorId,
          operatorName,
          reason,
        });
        successCount++;
      } catch (err: any) {
        errors.push(`用户${userId}: ${err.message}`);
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async getPermissionLogs(
    userId: number,
    params: PermissionLogParams = {}
  ): Promise<PageResult<UserPermissionLog>> {
    const { page = 1, pageSize = 10, operationType } = params;

    const where: any = {
      user_id: userId,
    };

    if (operationType) {
      where.operation_type = operationType;
    }

    const { count, rows } = await UserPermissionLog.findAndCountAll({
      where,
      order: [['operate_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async handleStatusChange(
    userId: number,
    oldStatus: number,
    newStatus: number,
    freezeType?: number,
    options: StatusChangeOptions = {}
  ): Promise<void> {
    const { operatorId, operatorName } = options;

    if (oldStatus === newStatus) {
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const beforePermissions = await this.getUserPermissionCodes(userId);

    if (newStatus === USER_STATUS.CANCELED) {
      await this.revokeAllPermissions(userId, {
        operatorId,
        operatorName,
        reason: '用户注销，回收所有权限',
      });
    } else if (newStatus === USER_STATUS.FROZEN) {
      if (freezeType === FREEZE_TYPE.PERMANENT) {
        await this.revokeAllPermissions(userId, {
          operatorId,
          operatorName,
          reason: '永久冻结，回收所有权限',
        });
      } else {
        await this.revokeAdvancedPermissions(userId, {
          operatorId,
          operatorName,
          reason: '临时冻结，回收高级权限',
        });
      }
    } else if (newStatus === USER_STATUS.NORMAL && oldStatus === USER_STATUS.FROZEN) {
      await this.restoreDefaultPermissions(userId, {
        operatorId,
        operatorName,
        reason: '用户解冻，恢复默认权限',
      });
    }

    const afterPermissions = await this.getUserPermissionCodes(userId);

    await this.recordPermissionLog(
      userId,
      undefined,
      undefined,
      OPERATION_TYPE.STATUS_CHANGE,
      OPERATION_SCOPE.SINGLE,
      operatorId,
      operatorName,
      undefined,
      `状态从${oldStatus}变更为${newStatus}`,
      JSON.stringify(beforePermissions),
      JSON.stringify(afterPermissions)
    );
  }

  private async revokeAllPermissions(
    userId: number,
    options: RevokeOptions
  ): Promise<void> {
    const { operatorId, operatorName, reason } = options;

    await UserPermission.update(
      {
        is_revoked: 1,
        revoked_by: operatorId,
        revoked_by_name: operatorName,
        revoked_at: new Date(),
        revoke_reason: reason,
      },
      {
        where: {
          user_id: userId,
          is_revoked: 0,
        },
      }
    );
  }

  private async revokeAdvancedPermissions(
    userId: number,
    options: RevokeOptions
  ): Promise<void> {
    const { operatorId, operatorName, reason } = options;

    const advancedPermissionConfigs = await PermissionConfig.findAll({
      where: {
        permission_level: { [Op.gte]: PERMISSION_LEVEL.ADVANCED },
        status: 1,
      },
      attributes: ['id'],
    });

    const advancedPermissionIds = advancedPermissionConfigs.map((p) => p.id);

    if (advancedPermissionIds.length > 0) {
      await UserPermission.update(
        {
          is_revoked: 1,
          revoked_by: operatorId,
          revoked_by_name: operatorName,
          revoked_at: new Date(),
          revoke_reason: reason,
        },
        {
          where: {
            user_id: userId,
            permission_id: { [Op.in]: advancedPermissionIds },
            is_revoked: 0,
          },
        }
      );
    }
  }

  private async restoreDefaultPermissions(
    userId: number,
    options: ResetOptions
  ): Promise<void> {
    await this.resetUserPermissions(userId, options);
  }

  private async recordPermissionLog(
    userId: number,
    permissionId: number | undefined,
    permissionCode: string | undefined,
    operationType: string,
    operationScope: string,
    operatorId?: number,
    operatorName?: string,
    operatorRole?: string,
    reason?: string,
    beforePermissions?: string,
    afterPermissions?: string,
    remark?: string
  ): Promise<UserPermissionLog> {
    return UserPermissionLog.create({
      user_id: userId,
      permission_id: permissionId,
      permission_code: permissionCode,
      operation_type: operationType,
      operation_scope: operationScope,
      operator_id: operatorId,
      operator_name: operatorName,
      operator_role: operatorRole,
      operate_time: new Date(),
      reason,
      before_permissions: beforePermissions,
      after_permissions: afterPermissions,
      remark,
    });
  }

  async getAllPermissionConfigs(): Promise<PermissionConfig[]> {
    return PermissionConfig.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
  }
}

export const userPermissionService = new UserPermissionService();
export default UserPermissionService;
