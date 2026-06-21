import { Op } from 'sequelize';
import { AppError } from '../middlewares/errorHandler';
import { daos } from '../dao';
import { PageResult } from '../dao/BaseDao';
import { USER_STATUS } from './UserValidateService';
import {
  PERMISSION_GROUPS,
} from './UserPermissionValidateService';
import { SystemPermission } from '../models/SystemPermission';
import { UserPermission } from '../models/UserPermission';
import { UserPermissionLog } from '../models/UserPermissionLog';

export interface ComplianceIssue {
  type: 'over_limit' | 'duplicate' | 'mismatch' | 'risk_blocked';
  severity: 'high' | 'medium' | 'low';
  code: string;
  message: string;
  permissionCode?: string;
  detail?: any;
}

export interface PermissionComplianceResult {
  passed: boolean;
  issues: ComplianceIssue[];
  score: number;
  duplicatePermissions: string[];
  overLimitPermissions: string[];
}

export interface PermissionTraceResult {
  permissionList: SystemPermission[];
  grantRecords: UserPermission[];
  revokeRecords: UserPermission[];
  changeLogs: UserPermissionLog[];
  complianceCheck: PermissionComplianceResult;
}

class UserPermissionTraceService {
  private userDao = daos.userDao;
  private systemPermissionDao = daos.systemPermissionDao;
  private userPermissionDao = daos.userPermissionDao;
  private userPermissionLogDao = daos.userPermissionLogDao;

  async getPermissionTrace(userId: number): Promise<PermissionTraceResult> {
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

    const grantRecords = userPermissions.filter(up => up.status === 1);
    const revokeRecords = userPermissions.filter(up => up.status !== 1);

    const activeCodes = grantRecords.map(up => up.permission_code);

    let permissionList: SystemPermission[] = [];
    if (activeCodes.length > 0) {
      permissionList = await this.systemPermissionDao.findAll({
        where: { permission_code: { [Op.in]: activeCodes } },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
    }

    const changeLogs = await this.userPermissionLogDao.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    const complianceCheck = await this.checkPermissionCompliance(userId);

    return {
      permissionList,
      grantRecords,
      revokeRecords,
      changeLogs,
      complianceCheck,
    };
  }

  async getPermissionLogs(
    userId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PageResult<UserPermissionLog>> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return this.userPermissionLogDao.findPage({
      page,
      pageSize,
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async checkPermissionCompliance(userId: number): Promise<PermissionComplianceResult> {
    if (!userId) {
      throw new AppError('用户ID不能为空', 400);
    }

    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const issues: ComplianceIssue[] = [];
    const duplicatePermissions: string[] = [];
    const overLimitPermissions: string[] = [];

    const userLevel = user.level || 1;
    const userStatus = user.status || USER_STATUS.NORMAL;
    const riskLevel = user.risk_level || 0;

    const activePermissions = await this.userPermissionDao.findAll({
      where: { user_id: userId, status: 1 },
    });

    const codeCountMap: Record<string, number> = {};
    for (const up of activePermissions) {
      codeCountMap[up.permission_code] = (codeCountMap[up.permission_code] || 0) + 1;
    }

    for (const [code, count] of Object.entries(codeCountMap)) {
      if (count > 1) {
        duplicatePermissions.push(code);
        issues.push({
          type: 'duplicate',
          severity: 'medium',
          code: 'DUPLICATE_PERMISSION',
          message: `权限${code}重复绑定${count}次`,
          permissionCode: code,
          detail: { count },
        });
      }
    }

    const activeCodes = activePermissions.map(up => up.permission_code);
    const uniqueCodes = Array.from(new Set(activeCodes));

    let systemPermissions: SystemPermission[] = [];
    if (uniqueCodes.length > 0) {
      systemPermissions = await this.systemPermissionDao.findAll({
        where: { permission_code: { [Op.in]: uniqueCodes } },
      });
    }

    const permMap = new Map(systemPermissions.map(p => [p.permission_code, p]));
    for (const up of activePermissions) {
      const perm = permMap.get(up.permission_code);
      if (!perm) continue;

      const blockReason = this.checkPermissionBlockedInternal(perm, userLevel, userStatus, riskLevel);
      if (blockReason) {
        overLimitPermissions.push(up.permission_code);
        const issueType = blockReason.includes('等级')
          ? 'over_limit'
          : blockReason.includes('风控') || blockReason.includes('高风控')
          ? 'risk_blocked'
          : 'mismatch';
        issues.push({
          type: issueType,
          severity: issueType === 'risk_blocked' ? 'high' : 'medium',
          code: issueType === 'over_limit' ? 'LEVEL_OVER_LIMIT' : issueType === 'risk_blocked' ? 'RISK_BLOCKED' : 'STATUS_MISMATCH',
          message: `权限${up.permission_code}：${blockReason}`,
          permissionCode: up.permission_code,
          detail: {
            userLevel,
            userStatus,
            riskLevel,
            requiredLevel: perm.required_level,
            allowedStatus: perm.allowed_status,
            allowedRiskLevels: perm.allowed_risk_levels,
          },
        });
      }
    }

    if (userStatus === USER_STATUS.CANCELED && activePermissions.length > 0) {
      issues.push({
        type: 'mismatch',
        severity: 'high',
        code: 'CANCELED_USER_WITH_PERMISSIONS',
        message: '注销用户仍持有活跃权限',
        detail: { activeCount: activePermissions.length },
      });
    }

    const baseScore = 100;
    let deduction = 0;
    for (const issue of issues) {
      if (issue.severity === 'high') deduction += 15;
      else if (issue.severity === 'medium') deduction += 8;
      else deduction += 3;
    }
    const score = Math.max(0, baseScore - deduction);

    return {
      passed: issues.length === 0,
      issues,
      score,
      duplicatePermissions,
      overLimitPermissions,
    };
  }

  private checkPermissionBlockedInternal(
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

    const highRiskBlockedGroups = [
      PERMISSION_GROUPS.MARKETING,
      PERMISSION_GROUPS.ORDER,
      PERMISSION_GROUPS.REVIEW,
    ];
    if (riskLevel === 2 && highRiskBlockedGroups.includes(perm.permission_group as any)) {
      return '高风控用户限制此组权限（营销/下单/评价）';
    }

    return null;
  }
}

export const userPermissionTraceService = new UserPermissionTraceService();
export default UserPermissionTraceService;
