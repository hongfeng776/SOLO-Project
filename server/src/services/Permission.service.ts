import { permissionDao } from '../dao';
import { PermissionTree } from '../dao/Permission.dao';
import Permission, { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { PermissionType, CommonStatus, PermissionModule } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import { Op } from 'sequelize';
import { OperationLog } from '../models/OperationLog.model';
import RolePermission from '../models/RolePermission.model';
import permissionChangeLogService from './PermissionChangeLog.service';
import { ChangeAction, ChangeTargetType } from '../models/PermissionChangeLog.model';

const SYSTEM_MENU_PATHS = [
  '/dashboard', '/permission', '/channel', '/promoter', '/order',
  '/commission', '/marketing', '/withdraw', '/log',
];

interface PermissionQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  type?: string;
  module?: string;
  status?: number;
  level?: number;
}

interface BatchSortRequest {
  items: Array<{ id: string; sort: number; parentId?: string; level?: number }>;
}

interface BatchOperateResult {
  success: string[];
  failed: Array<{ id: string; reason: string }>;
}

interface PermissionDependencies {
  hasDependencies: boolean;
  canDelete: boolean;
  dependencies: Array<{ type: string; count: number; description: string }>;
}

class PermissionService {
  public async createPermission(currentUser: any, data: PermissionCreationAttributes & { visibleRange?: string }) {
    if ((data.type === PermissionType.MENU || (data.type as any) === 'directory') && data.path) {
      const pathExists = await permissionDao.existsByPath(data.path);
      if (pathExists) {
        throw new AppError('访问路径已存在', BusinessCode.ERROR);
      }
    }

    if (await permissionDao.existsByCode(data.code)) {
      throw new AppError('权限编码已存在', BusinessCode.ERROR);
    }

    let targetLevel = 1;
    if (data.parentId) {
      const parent = await permissionDao.findById(data.parentId);
      if (!parent) {
        throw new AppError('上级菜单不存在', BusinessCode.ERROR);
      }
      targetLevel = Number(parent.level || 1) + 1;
      if (targetLevel > 3) {
        throw new AppError('菜单最多支持三级，禁止越级创建', BusinessCode.ERROR);
      }
    }

    const permission = await permissionDao.create({
      ...data,
      level: targetLevel,
      status: CommonStatus.ENABLED,
      createdBy: currentUser?.userId,
      createdByName: currentUser?.username,
      isSystem: false,
    } as PermissionCreationAttributes);

    permissionChangeLogService.logChange({
      operatorId: currentUser?.userId,
      operatorName: currentUser?.username,
      targetId: permission.id,
      targetType: ChangeTargetType.PERMISSION,
      targetName: permission.name,
      action: ChangeAction.CREATE,
      module: data.module,
      afterData: permission.toJSON(),
      ip: currentUser?.ip || 'unknown',
      userAgent: currentUser?.userAgent,
      reason: (data as any).reason,
    });

    await this.clearPermissionCache();

    return permission;
  }

  public async updatePermission(currentUser: any, id: string, data: Partial<PermissionAttributes>) {
    const perm = await permissionDao.findById(id);
    if (!perm) {
      throw new AppError('菜单权限不存在', BusinessCode.NOT_FOUND);
    }

    if (perm.isSystem) {
      throw new AppError('系统内置菜单禁止修改', BusinessCode.FORBIDDEN);
    }

    const beforeData = perm.toJSON();

    if (data.path && data.path !== perm.path) {
      const exists = await permissionDao.existsByPath(data.path, id);
      if (exists) throw new AppError('访问路径已存在', BusinessCode.ERROR);
    }
    if (data.code && data.code !== perm.code) {
      const exists = await permissionDao.existsByCodeAndId(data.code, id);
      if (exists) throw new AppError('权限编码已存在', BusinessCode.ERROR);
    }

    const updateData: Partial<PermissionAttributes> = { ...data };
    if (updateData.parentId !== undefined && updateData.parentId !== perm.parentId) {
      const parent = updateData.parentId ? await permissionDao.findById(updateData.parentId) : null;
      updateData.level = parent ? Number(parent.level || 1) + 1 : 1;
    }
    await permissionDao.update(updateData, { where: { id } });

    const updated = await permissionDao.findById(id);

    permissionChangeLogService.logChange({
      operatorId: currentUser?.userId,
      operatorName: currentUser?.username,
      targetId: id,
      targetType: ChangeTargetType.PERMISSION,
      targetName: perm.name,
      action: ChangeAction.UPDATE,
      module: perm.module || data.module,
      beforeData,
      afterData: updated?.toJSON(),
      ip: currentUser?.ip || 'unknown',
      userAgent: currentUser?.userAgent,
      reason: (data as any).reason,
    });

    await this.clearPermissionCache();
    await CacheUtils.delPattern(`user:menus:*`);
    await CacheUtils.delPattern(`user:permissions:*`);

    return updated;
  }

  public async updateStatusBatch(currentUser: any, ids: string[], status: number): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };
    const successPerms: any[] = [];
    for (const id of ids) {
      try {
        const perm = await permissionDao.findById(id);
        if (!perm) {
          result.failed.push({ id, reason: '菜单不存在' });
          continue;
        }
        if (perm.isSystem) {
          result.failed.push({ id, reason: '系统内置菜单禁止修改状态' });
          continue;
        }
        const beforeData = perm.toJSON();
        await permissionDao.update({ status: status as any }, { where: { id } });
        result.success.push(id);
        successPerms.push({ perm, beforeData });
      } catch (err: any) {
        result.failed.push({ id, reason: err.message || '操作失败' });
      }
    }
    if (result.success.length > 0) {
      for (const { perm, beforeData } of successPerms) {
        permissionChangeLogService.logChange({
          operatorId: currentUser?.userId,
          operatorName: currentUser?.username,
          targetId: perm.id,
          targetType: ChangeTargetType.PERMISSION,
          targetName: perm.name,
          action: ChangeAction.UPDATE,
          module: perm.module,
          beforeData,
          afterData: { ...beforeData, status },
          ip: currentUser?.ip || 'unknown',
          userAgent: currentUser?.userAgent,
          reason: status === CommonStatus.ENABLED ? '批量启用菜单' : '批量禁用菜单',
        });
      }
      await this.clearPermissionCache();
      await CacheUtils.delPattern(`user:menus:*`);
    }
    return result;
  }

  public async batchSort(currentUser: any, req: BatchSortRequest): Promise<BatchOperateResult> {
    const result: BatchOperateResult = { success: [], failed: [] };
    const successItems: any[] = [];
    for (const item of req.items) {
      try {
        const perm = await permissionDao.findById(item.id);
        if (!perm) {
          result.failed.push({ id: item.id, reason: '菜单不存在' });
          continue;
        }
        if (perm.isSystem) {
          result.failed.push({ id: item.id, reason: '系统内置菜单禁止调整' });
          continue;
        }
        const beforeData = perm.toJSON();
        const updateData: any = { sort: item.sort };
        if (item.parentId !== undefined) updateData.parentId = item.parentId;
        if (item.level !== undefined) updateData.level = item.level;
        await permissionDao.update(updateData, { where: { id: item.id } });
        result.success.push(item.id);
        successItems.push({ perm, beforeData, updateData });
      } catch (err: any) {
        result.failed.push({ id: item.id, reason: err.message || '操作失败' });
      }
    }
    if (result.success.length > 0) {
      for (const { perm, beforeData, updateData } of successItems) {
        permissionChangeLogService.logChange({
          operatorId: currentUser?.userId,
          operatorName: currentUser?.username,
          targetId: perm.id,
          targetType: ChangeTargetType.PERMISSION,
          targetName: perm.name,
          action: ChangeAction.UPDATE,
          module: perm.module,
          beforeData,
          afterData: { ...beforeData, ...updateData },
          ip: currentUser?.ip || 'unknown',
          userAgent: currentUser?.userAgent,
          reason: '调整菜单排序/层级',
        });
      }
      await this.clearPermissionCache();
    }
    return result;
  }

  public async checkDeleteDependencies(id: string): Promise<PermissionDependencies> {
    const perm = await permissionDao.findById(id);
    if (!perm) throw new AppError('菜单不存在', BusinessCode.NOT_FOUND);

    const dependencies: Array<{ type: string; count: number; description: string }> = [];

    const hasChildren = await permissionDao.hasChildren(id);
    if (hasChildren) {
      const children = await permissionDao.getChildren(id);
      dependencies.push({ type: 'children', count: children.length, description: `存在 ${children.length} 个子菜单，需先删除子菜单` });
    }

    const roleCount = await permissionDao.getBoundRoleCount(id);
    if (roleCount > 0) {
      dependencies.push({ type: 'role_binding', count: roleCount, description: `已绑定 ${roleCount} 个角色权限` });
    }

    const accessCount = await permissionDao.getAccessLogCount(id, 30);
    if (accessCount > 0) {
      dependencies.push({ type: 'access_log', count: accessCount, description: `近30天存在 ${accessCount} 次访问记录` });
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      canDelete: dependencies.every(d => d.type === 'access_log'),
    };
  }

  public async deletePermission(currentUser: any, id: string): Promise<void> {
    const idempotentKey = `perm:delete:${id}`;
    if (await CacheUtils.get(idempotentKey)) {
      throw new AppError('删除请求已提交，请勿重复操作', BusinessCode.ERROR);
    }
    await CacheUtils.set(idempotentKey, '1', CacheTTL.SHORT);

    try {
      const depCheck = await this.checkDeleteDependencies(id);
      if (!depCheck.canDelete) {
        throw new AppError(JSON.stringify({ message: '存在使用记录，禁止删除', dependencies: depCheck.dependencies }), BusinessCode.ERROR);
      }

      const perm = await permissionDao.findById(id);
      if (!perm) throw new AppError('菜单不存在', BusinessCode.NOT_FOUND);
      if (perm.isSystem) throw new AppError('系统内置菜单禁止删除', BusinessCode.FORBIDDEN);

      const beforeData = perm.toJSON();

      await permissionDao.softDelete(id);

      await RolePermission.destroy({ where: { permissionId: id } });

      permissionChangeLogService.logChange({
        operatorId: currentUser?.userId,
        operatorName: currentUser?.username,
        targetId: id,
        targetType: ChangeTargetType.PERMISSION,
        targetName: perm.name,
        action: ChangeAction.DELETE,
        module: perm.module,
        beforeData,
        ip: currentUser?.ip || 'unknown',
        userAgent: currentUser?.userAgent,
      });

      await this.clearPermissionCache();
      await CacheUtils.delPattern(`user:menus:*`);
      await CacheUtils.delPattern(`user:permissions:*`);
      await CacheUtils.del(idempotentKey);
    } catch (err) {
      await CacheUtils.del(idempotentKey);
      throw err;
    }
  }

  public async findIdlePermissions(params: PermissionQueryParams & { unusedDays?: number }) {
    const all = await this.findTree();
    const filterFn = (list: any[]): any[] => {
      const result: any[] = [];
      for (const item of list) {
        const matched = item.status === CommonStatus.DISABLED;
        const children = item.children ? filterFn(item.children) : [];
        if (matched || children.length > 0) {
          result.push({ ...item, children: children.length ? children : undefined });
        }
      }
      return result;
    };
    return filterFn(all);
  }

  public async findTree(): Promise<PermissionTree[]> {
    const cacheKey = CacheKey.PERMISSION_TREE;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;
    const tree = await permissionDao.findTree();
    await CacheUtils.set(cacheKey, tree, CacheTTL.SHORT);
    return tree;
  }

  public async findById(id: string) {
    const cacheKey = `${CacheKey.PERMISSION_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;
    const perm = await permissionDao.findById(id);
    if (!perm) throw new AppError('权限不存在', BusinessCode.NOT_FOUND);
    await CacheUtils.set(cacheKey, perm, CacheTTL.MEDIUM);
    return perm;
  }

  public async findByModule(module: string) {
    const cacheKey = `${CacheKey.PERMISSION_MODULE}${module}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;
    const result = await permissionDao.findByModule(module);
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  private async clearPermissionCache(): Promise<void> {
    await CacheUtils.del(CacheKey.PERMISSION_TREE);
    await CacheUtils.delPattern(`${CacheKey.PERMISSION_DETAIL}*`);
    await CacheUtils.delPattern(`${CacheKey.PERMISSION_MODULE}*`);
  }
}

export default new PermissionService();
