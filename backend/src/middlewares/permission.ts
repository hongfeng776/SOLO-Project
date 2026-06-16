import { Request, Response, NextFunction } from 'express';
import { ApiResult } from '../utils';
import { PermissionRepository, RoleRepository } from '../repositories';
import { UserVO } from '../types';

const permissionRepository = new PermissionRepository();
const roleRepository = new RoleRepository();

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserVO;

      if (!user || !user.roles || user.roles.length === 0) {
        res.status(200).json(ApiResult.forbidden('没有角色权限'));
        return;
      }

      const userRoles = user.roles.map(r => r.code);
      const hasRole = roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        res.status(200).json(ApiResult.forbidden('需要角色权限: ' + roles.join(', ')));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserVO;

      if (!user) {
        res.status(200).json(ApiResult.forbidden('请先登录'));
        return;
      }

      if (user.roles && user.roles.some(r => r.code === 'admin')) {
        next();
        return;
      }

      if (!user.roles || user.roles.length === 0) {
        res.status(200).json(ApiResult.forbidden('没有操作权限'));
        return;
      }

      const roleIds = user.roles.map(r => r.id);
      const userPermissions = await permissionRepository.findByRoleIds(roleIds);
      const permissionCodes = userPermissions.map(p => p.code);

      const hasPermission = permissions.some(perm =>
        permissionCodes.includes(perm)
      );

      if (!hasPermission) {
        res.status(200).json(ApiResult.forbidden('没有操作权限: ' + permissions.join(', ')));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserVO;

      if (!user) {
        res.status(200).json(ApiResult.forbidden('请先登录'));
        return;
      }

      if (user.roles && user.roles.some(r => r.code === 'admin')) {
        next();
        return;
      }

      if (!user.roles || user.roles.length === 0) {
        res.status(200).json(ApiResult.forbidden('没有操作权限'));
        return;
      }

      const roleIds = user.roles.map(r => r.id);
      const userPermissions = await permissionRepository.findByRoleIds(roleIds);
      const permissionCodes = userPermissions.map(p => p.code);

      const hasPermission = permissions.some(perm =>
        permissionCodes.includes(perm)
      );

      if (!hasPermission) {
        res.status(200).json(ApiResult.forbidden('没有操作权限'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAllPermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserVO;

      if (!user) {
        res.status(200).json(ApiResult.forbidden('请先登录'));
        return;
      }

      if (user.roles && user.roles.some(r => r.code === 'admin')) {
        next();
        return;
      }

      if (!user.roles || user.roles.length === 0) {
        res.status(200).json(ApiResult.forbidden('没有操作权限'));
        return;
      }

      const roleIds = user.roles.map(r => r.id);
      const userPermissions = await permissionRepository.findByRoleIds(roleIds);
      const permissionCodes = userPermissions.map(p => p.code);

      const hasAllPermissions = permissions.every(perm =>
        permissionCodes.includes(perm)
      );

      if (!hasAllPermissions) {
        res.status(200).json(ApiResult.forbidden('缺少必要的操作权限'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}