import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { USER_STATUS } from './UserValidateService';
import { SystemPermission } from '../models/SystemPermission';

export const PERMISSION_GROUPS = {
  BASIC: 'basic',
  MARKETING: 'marketing',
  ORDER: 'order',
  REVIEW: 'review',
  ACTIVITY: 'activity',
  INFO: 'info',
} as const;

export const GRANT_TYPES = {
  DEFAULT: 1,
  MANUAL: 2,
  UPGRADE: 3,
  ACTIVITY: 4,
} as const;

export const LOG_TYPES = {
  GRANT: 1,
  REVOKE: 2,
  RESET: 3,
  STATUS_LINKAGE: 4,
  BATCH: 5,
} as const;

export const FREEZE_TYPES = {
  NONE: 0,
  TEMPORARY: 1,
  PERMANENT: 2,
} as const;

export const CANCEL_TYPES = {
  NONE: 0,
  VOLUNTARY: 1,
  VIOLATION: 2,
} as const;

export interface ValidatePermissionResult {
  valid: boolean;
  errors: string[];
  allowedPermissions: SystemPermission[];
  blockedPermissions: { code: string; reason: string }[];
}

const HIGH_RISK_BLOCKED_GROUPS = [
  PERMISSION_GROUPS.MARKETING,
  PERMISSION_GROUPS.ORDER,
  PERMISSION_GROUPS.REVIEW,
];

const TEMPORARY_FREEZE_ALLOWED = ['login', 'view_profile', 'change_password'];
const PERMANENT_FREEZE_ALLOWED = ['view_profile'];
const VOLUNTARY_CANCEL_ALLOWED = ['view_profile', 'view_privacy'];
const VIOLATION_CANCEL_ALLOWED: string[] = [];

class UserPermissionValidateService {
  private userDao = daos.userDao;
  private systemPermissionDao = daos.systemPermissionDao;

  async validatePermissionGrant(
    userId: number,
    permissionCodes: string[]
  ): Promise<ValidatePermissionResult> {
    const result: ValidatePermissionResult = {
      valid: true,
      errors: [],
      allowedPermissions: [],
      blockedPermissions: [],
    };

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

    const systemPermissions = await this.systemPermissionDao.findAll({
      where: {
        permission_code: { [Op.in]: permissionCodes },
        status: 1,
      },
    });

    const foundCodes = systemPermissions.map(p => p.permission_code);
    const notFoundCodes = permissionCodes.filter(c => !foundCodes.includes(c));
    for (const code of notFoundCodes) {
      result.blockedPermissions.push({ code, reason: '权限不存在或已禁用' });
      result.errors.push(`权限${code}不存在或已禁用`);
    }

    for (const perm of systemPermissions) {
      const blockReason = this.checkPermissionBlocked(
        perm,
        user.level || 1,
        user.status || USER_STATUS.NORMAL,
        user.risk_level || 0
      );
      if (blockReason) {
        result.blockedPermissions.push({ code: perm.permission_code, reason: blockReason });
        result.errors.push(`权限${perm.permission_code}：${blockReason}`);
      } else {
        result.allowedPermissions.push(perm);
      }
    }

    result.valid = result.blockedPermissions.length === 0;
    return result;
  }

  async getFilteredPermissions(
    userLevel: number,
    userStatus: number,
    riskLevel: number,
    permissionGroup?: string
  ): Promise<SystemPermission[]> {
    const where: any = { status: 1 };
    if (permissionGroup) {
      where.permission_group = permissionGroup;
    }

    const allPermissions = await this.systemPermissionDao.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });

    return allPermissions.filter(perm => {
      return !this.checkPermissionBlocked(perm, userLevel, userStatus, riskLevel);
    });
  }

  private checkPermissionBlocked(
    perm: SystemPermission,
    userLevel: number,
    userStatus: number,
    riskLevel: number
  ): string | null {
    const requiredLevel = perm.required_level || 1;
    if (userLevel < requiredLevel) {
      return `用户等级不足（需要等级${requiredLevel}，当前等级${userLevel}）`;
    }

    const allowedStatus = perm.allowed_status ? perm.allowed_status.split(',').map(Number) : [USER_STATUS.NORMAL];
    if (!allowedStatus.includes(userStatus)) {
      const statusMap: Record<number, string> = {
        [USER_STATUS.NORMAL]: '正常',
        [USER_STATUS.FROZEN]: '冻结',
        [USER_STATUS.CANCELED]: '注销',
      };
      return `当前账号状态（${statusMap[userStatus] || '未知'}）不允许此权限`;
    }

    const allowedRiskLevels = perm.allowed_risk_levels
      ? perm.allowed_risk_levels.split(',').map(Number)
      : [0, 1];
    if (!allowedRiskLevels.includes(riskLevel)) {
      const riskMap: Record<number, string> = { 0: '低', 1: '中', 2: '高' };
      return `风控等级超限（当前为${riskMap[riskLevel] || '未知'}风险）`;
    }

    if (riskLevel === 2 && HIGH_RISK_BLOCKED_GROUPS.includes(perm.permission_group as any)) {
      return '高风控用户限制此组权限（营销/下单/评价）';
    }

    return null;
  }

  getStatusAllowedPermissions(
    status: number,
    freezeType: number = FREEZE_TYPES.NONE,
    cancelType: number = CANCEL_TYPES.NONE
  ): string[] {
    if (status === USER_STATUS.NORMAL) {
      return [];
    }
    if (status === USER_STATUS.FROZEN) {
      if (freezeType === FREEZE_TYPES.PERMANENT) {
        return [...PERMANENT_FREEZE_ALLOWED];
      }
      return [...TEMPORARY_FREEZE_ALLOWED];
    }
    if (status === USER_STATUS.CANCELED) {
      if (cancelType === CANCEL_TYPES.VIOLATION) {
        return [...VIOLATION_CANCEL_ALLOWED];
      }
      return [...VOLUNTARY_CANCEL_ALLOWED];
    }
    return [];
  }

  isPermissionAllowedForStatus(
    permissionCode: string,
    status: number,
    freezeType: number = FREEZE_TYPES.NONE,
    cancelType: number = CANCEL_TYPES.NONE
  ): boolean {
    const allowed = this.getStatusAllowedPermissions(status, freezeType, cancelType);
    if (allowed.length === 0) return true;
    return allowed.includes(permissionCode);
  }
}

export const userPermissionValidateService = new UserPermissionValidateService();
export default UserPermissionValidateService;
