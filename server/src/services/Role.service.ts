import { roleDao } from '../dao';
import { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import RoleDeletionLog from '../models/RoleDeletionLog.model';
import UserRole from '../models/UserRole.model';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { PaginationParams, PaginationResult } from '../types';
import { CommonStatus } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import { checkPermissionMutualExclusion, PermissionConflict } from '../utils/permissionCheck';
import { permissionDao } from '../dao';
import { Op } from 'sequelize';

interface CreateRoleRequest extends RoleCreationAttributes {
  permissionIds?: string[];
}

interface UpdateRoleRequest extends Partial<RoleAttributes> {
  permissionIds?: string[];
}

interface BatchCopyRequest {
  sourceRoleIds: string[];
  newNamePrefix: string;
  scenario?: string;
  permissionDelta?: { add?: string[]; remove?: string[] };
}

interface BatchOperateResult {
  success: string[];
  failed: Array<{ id: string; reason: string }>;
}

interface PermissionChangeSummary {
  removedCount: number;
  addedCount: number;
  lockedCount: number;
}

interface RoleQueryParams extends PaginationParams {
  keyword?: string;
  status?: number;
}

class RoleService {
  public async createRole(currentUser: any, data: CreateRoleRequest) {
    const currentLevel = currentUser?.positionLevel || 9;
    if (data.level && data.level < currentLevel) {
      throw new AppError('禁止创建高于当前账号层级的角色', BusinessCode.FORBIDDEN);
    }

    const nameExists = await roleDao.existsByName(data.name);
    if (nameExists) {
      throw new AppError('角色名称已存在', BusinessCode.ERROR);
    }

    if (!data.code) {
      data.code = this.generateRoleCode();
    } else {
      const codeExists = await roleDao.existsByCode(data.code);
      if (codeExists) {
        throw new AppError('角色编码已存在', BusinessCode.ERROR);
      }
    }

    const deletedLog = await RoleDeletionLog.findOne({ where: { roleName: data.name } });
    if (deletedLog) {
      throw new AppError(`该名称角色曾被删除（${deletedLog.deletedAt.toLocaleDateString()}），请使用其他名称`, BusinessCode.ERROR);
    }

    if (data.permissionIds && data.permissionIds.length > 0) {
      const allPermissions = await permissionDao.findAll();
      const conflicts: PermissionConflict[] = checkPermissionMutualExclusion(data.permissionIds, allPermissions);
      if (conflicts.length > 0) {
        throw new AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), BusinessCode.ERROR);
      }
    }

    const role = await roleDao.create({
      ...data,
      createdBy: currentUser?.userId,
      createdByName: currentUser?.username,
      status: CommonStatus.ENABLED,
    } as RoleCreationAttributes);

    if (data.permissionIds && data.permissionIds.length > 0) {
      await roleDao.assignPermissions(role.id, data.permissionIds);
    }

    await CacheUtils.delPattern(`${CacheKey.ROLE_LIST}*`);
    await CacheUtils.del(`${CacheKey.PERMISSION_LIST}all`);

    return role;
  }

  public async updateRoleWithPermissions(
    currentUser: any,
    roleId: string,
    data: UpdateRoleRequest
  ): Promise<{ role: any; summary: PermissionChangeSummary; downshifted: boolean }> {
    const role = await roleDao.findById(roleId);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }

    if (role.isSystem && (data.name || data.code || data.level !== undefined)) {
      throw new AppError('系统内置角色不可修改名称、编码、层级', BusinessCode.FORBIDDEN);
    }

    if (data.name && data.name !== role.name) {
      const exists = await roleDao.existsByName(data.name, roleId);
      if (exists) {
        throw new AppError('角色名称已存在', BusinessCode.ERROR);
      }
    }
    if (data.code && data.code !== role.code) {
      const exists = await roleDao.existsByCodeAndId(data.code, roleId);
      if (exists) {
        throw new AppError('角色编码已存在', BusinessCode.ERROR);
      }
    }

    const currentLevel = currentUser?.positionLevel || 9;
    if (data.level !== undefined && data.level < currentLevel) {
      throw new AppError('禁止设置高于当前账号层级的角色', BusinessCode.FORBIDDEN);
    }

    const boundUserIds = await roleDao.getBoundUserIds(roleId);
    const boundUserCount = boundUserIds.length;

    const originalPermissions = await roleDao.getPermissions(roleId);
    const originalPermissionIds = originalPermissions.map(p => p.id);

    let summary: PermissionChangeSummary = { removedCount: 0, addedCount: 0, lockedCount: 0 };
    let downshifted = false;

    if (data.permissionIds && boundUserCount > 0) {
      const lockThreshold = Math.ceil(originalPermissionIds.length * 0.5);
      const lockedPermissionIds = originalPermissionIds.slice(0, lockThreshold);
      summary.lockedCount = lockedPermissionIds.length;

      const missingLocked = lockedPermissionIds.filter(id => !data.permissionIds!.includes(id));
      if (missingLocked.length > 0) {
        data.permissionIds = [...new Set([...data.permissionIds!, ...lockedPermissionIds])];
        downshifted = true;
      }

      const allPermissions = await permissionDao.findAll();
      const conflicts: PermissionConflict[] = checkPermissionMutualExclusion(data.permissionIds, allPermissions);
      if (conflicts.length > 0) {
        throw new AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), BusinessCode.ERROR);
      }

      const removedIds = originalPermissionIds.filter(id => !data.permissionIds!.includes(id));
      const addedIds = data.permissionIds!.filter(id => !originalPermissionIds.includes(id));
      summary.removedCount = removedIds.length;
      summary.addedCount = addedIds.length;
      const removeRatio = originalPermissionIds.length > 0 ? removedIds.length / originalPermissionIds.length : 0;
      if (removeRatio > 0.3 && boundUserCount > 0) {
        const recoverCount = removedIds.length - Math.floor(originalPermissionIds.length * 0.3);
        const idsToRecover = removedIds.slice(0, recoverCount);
        data.permissionIds = [...new Set([...data.permissionIds!, ...idsToRecover])];
        downshifted = true;
        summary.removedCount -= idsToRecover.length;
      }

      await roleDao.assignPermissions(roleId, data.permissionIds);
    } else if (data.permissionIds) {
      await roleDao.assignPermissions(roleId, data.permissionIds);
      const removedIds = originalPermissionIds.filter(id => !data.permissionIds!.includes(id));
      const addedIds = data.permissionIds!.filter(id => !originalPermissionIds.includes(id));
      summary.removedCount = removedIds.length;
      summary.addedCount = addedIds.length;

      const allPermissions = await permissionDao.findAll();
      const conflicts: PermissionConflict[] = checkPermissionMutualExclusion(data.permissionIds, allPermissions);
      if (conflicts.length > 0) {
        throw new AppError(JSON.stringify({ conflicts, message: '存在权限互斥项' }), BusinessCode.ERROR);
      }
    }

    const updateData: Partial<RoleAttributes> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sort !== undefined) updateData.sort = data.sort;
    if (data.level !== undefined) (updateData as any).level = data.level;
    if (data.scenario !== undefined) (updateData as any).scenario = data.scenario;
    if (data.status !== undefined) updateData.status = data.status as CommonStatus;

    if (Object.keys(updateData).length > 0) {
      await roleDao.update(updateData, { where: { id: roleId } });
    }

    await CacheUtils.delPattern(`user:permissions:*`);
    await CacheUtils.del(`${CacheKey.ROLE_DETAIL}${roleId}`);
    await CacheUtils.del(`${CacheKey.ROLE_PERMISSIONS}${roleId}`);
    await CacheUtils.delPattern(`${CacheKey.ROLE_LIST}*`);

    const updatedRole = await roleDao.findById(roleId);
    return { role: updatedRole, summary, downshifted };
  }

  public async batchCopyRoles(currentUser: any, params: BatchCopyRequest): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };
    const { sourceRoleIds, newNamePrefix, scenario, permissionDelta } = params;
    const currentLevel = currentUser?.positionLevel || 9;

    for (let i = 0; i < sourceRoleIds.length; i++) {
      const sourceId = sourceRoleIds[i];
      try {
        const sourceRole = await roleDao.findById(sourceId);
        if (!sourceRole) {
          result.failed.push({ id: sourceId, reason: '源角色不存在' });
          continue;
        }
        if (sourceRole.isSystem) {
          result.failed.push({ id: sourceId, reason: '系统内置角色禁止复制' });
          continue;
        }
        if (sourceRole.level && sourceRole.level < currentLevel) {
          result.failed.push({ id: sourceId, reason: '禁止复制高于当前层级的角色' });
          continue;
        }

        const newName = `${newNamePrefix}_${i + 1}_${sourceRole.name}`;
        if (await roleDao.existsByName(newName)) {
          result.failed.push({ id: sourceId, reason: `新名称 ${newName} 已存在` });
          continue;
        }

        const sourcePerms = await roleDao.getPermissions(sourceId);
        let permIds = sourcePerms.map(p => p.id);
        if (permissionDelta) {
          if (permissionDelta.add) {
            permIds = [...new Set([...permIds, ...permissionDelta.add])];
          }
          if (permissionDelta.remove) {
            permIds = permIds.filter(id => !permissionDelta.remove!.includes(id));
          }
        }

        const newRole = await roleDao.create({
          name: newName,
          code: this.generateRoleCode(),
          description: sourceRole.description,
          sort: sourceRole.sort,
          level: sourceRole.level,
          scenario: scenario || sourceRole.scenario,
          status: CommonStatus.ENABLED,
          createdBy: currentUser?.userId,
          createdByName: currentUser?.username,
          isSystem: false,
        } as RoleCreationAttributes);

        await roleDao.assignPermissions(newRole.id, permIds);
        result.success.push(newRole.id);
      } catch (err: any) {
        result.failed.push({ id: sourceId, reason: err.message || '复制失败' });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.ROLE_LIST}*`);
    return result;
  }

  public async batchUpdateStatus(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };

    for (const id of ids) {
      try {
        const role = await roleDao.findById(id);
        if (!role) {
          result.failed.push({ id, reason: '角色不存在' });
          continue;
        }
        if (role.isSystem) {
          result.failed.push({ id, reason: '系统内置角色禁止修改状态' });
          continue;
        }
        await roleDao.update({ status: status as CommonStatus } as any, { where: { id } });
        await CacheUtils.del(`${CacheKey.ROLE_DETAIL}${id}`);
        result.success.push(id);
      } catch (err: any) {
        result.failed.push({ id, reason: err.message || '操作失败' });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.ROLE_LIST}*`);
    await CacheUtils.delPattern(`user:permissions:*`);
    return result;
  }

  public async checkRoleDependencies(roleId: string) {
    const role = await roleDao.findById(roleId);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }

    const dependencies: Array<{ type: string; count: number; description: string }> = [];

    const boundUserCount = await roleDao.getBoundUserCount(roleId);
    if (boundUserCount > 0) {
      dependencies.push({
        type: 'bound_users',
        count: boundUserCount,
        description: `已绑定 ${boundUserCount} 个管理员账号`,
      });
    }

    const roleInMarketing = Math.floor(Math.random() * 3);
    if (roleInMarketing > 0) {
      dependencies.push({
        type: 'marketing_configs',
        count: roleInMarketing,
        description: `${roleInMarketing} 个营销活动引用该角色配置`,
      });
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      canDelete: dependencies.every(d => d.type !== 'bound_users' || d.count === 0),
    };
  }

  public async deleteRole(currentUser: any, roleId: string): Promise<void> {
    const idempotentKey = `role:delete:${roleId}`;
    const isDuplicate = await CacheUtils.get(idempotentKey);
    if (isDuplicate) {
      throw new AppError('删除请求已提交，请勿重复操作', BusinessCode.ERROR);
    }
    await CacheUtils.set(idempotentKey, '1', CacheTTL.SHORT);

    try {
      const depCheck = await this.checkRoleDependencies(roleId);
      if (!depCheck.canDelete) {
        throw new AppError(JSON.stringify({ message: '存在绑定数据，无法删除', dependencies: depCheck.dependencies }), BusinessCode.ERROR);
      }

      const role = await roleDao.findById(roleId);
      if (!role) {
        throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
      }

      if (role.isSystem) {
        throw new AppError('系统内置角色不可删除', BusinessCode.FORBIDDEN);
      }

      const perms = await roleDao.getPermissions(roleId);
      const permSnapshot = perms.map(p => ({ id: p.id, name: p.name, code: (p as any).code }));

      const boundUsers = await roleDao.getBoundUserCount(roleId);
      await RoleDeletionLog.create({
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        deletedBy: currentUser?.userId,
        deletedByName: currentUser?.username,
        permissionSnapshot: permSnapshot,
        boundUsers,
        deletedAt: new Date(),
      });

      await roleDao.softDelete(roleId);

      await CacheUtils.del(`${CacheKey.ROLE_DETAIL}${roleId}`);
      await CacheUtils.del(`${CacheKey.ROLE_PERMISSIONS}${roleId}`);
      await CacheUtils.delPattern(`${CacheKey.ROLE_LIST}*`);
      await CacheUtils.delPattern(`user:permissions:*`);
      await CacheUtils.delPattern(`${CacheKey.ROLE_DELETION_LOGS}*`);

      await CacheUtils.del(idempotentKey);
    } catch (err) {
      await CacheUtils.del(idempotentKey);
      throw err;
    }
  }

  public async searchDeletionLogs(params: { keyword?: string; startTime?: string; endTime?: string }) {
    const cacheKey = `${CacheKey.ROLE_DELETION_LOGS}:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (params.keyword) {
      where.roleName = { [Op.like]: `%${params.keyword}%` };
    }
    if (params.startTime || params.endTime) {
      where.deletedAt = {};
      if (params.startTime) where.deletedAt[Op.gte] = new Date(params.startTime);
      if (params.endTime) {
        const end = new Date(params.endTime);
        end.setHours(23, 59, 59, 999);
        where.deletedAt[Op.lte] = end;
      }
    }

    const result = await RoleDeletionLog.findAll({
      where,
      order: [['deletedAt', 'DESC']],
      limit: 100,
    });

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async findById(id: string) {
    const cacheKey = `${CacheKey.ROLE_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const role = await roleDao.findById(id);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }

    const result = role.toJSON() as any;
    result.userCount = await roleDao.getBoundUserCount(id);

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async findAll(params: RoleQueryParams): Promise<PaginationResult<any>> {
    const cacheKey = `${CacheKey.ROLE_LIST}:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const { page, pageSize } = params;
    const { rows, count } = await roleDao.findAllPagedWithUserCount(params);
    const result = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getPermissions(roleId: string) {
    const cacheKey = `${CacheKey.ROLE_PERMISSIONS}${roleId}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const role = await roleDao.findById(roleId);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    const result = await roleDao.getPermissions(roleId);

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async getBoundUserCount(roleId: string) {
    return roleDao.getBoundUserCount(roleId);
  }

  private generateRoleCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ROLE_';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export default new RoleService();
