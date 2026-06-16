import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { PermissionService } from '../services';
import { CreatePermissionRequest, UpdatePermissionRequest } from '../types';

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  async tree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keyword = req.query.keyword as string | undefined;
      const status = req.query.status ? Number(req.query.status) : undefined;
      const tree = await this.permissionService.getPermissionTree(keyword, status);
      sendSuccess(res, tree, '获取权限树成功');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      sendSuccess(res, permissions, '获取权限列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await this.permissionService.getPermissionById(id);
      sendSuccess(res, permission, '获取权限详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permission = await this.permissionService.createPermission(req.body as CreatePermissionRequest);
      sendSuccess(res, permission, '创建权限成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await this.permissionService.updatePermission(id, req.body as UpdatePermissionRequest);
      sendSuccess(res, permission, '更新权限成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.permissionService.deletePermission(id);
      sendSuccess(res, null, '删除权限成功');
    } catch (error) {
      next(error);
    }
  }
}
