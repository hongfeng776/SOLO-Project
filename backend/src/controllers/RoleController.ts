import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { RoleService } from '../services';
import { RoleQueryParams, CreateRoleRequest, UpdateRoleRequest } from '../types';

const roleService = new RoleService();

export class RoleController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: RoleQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined
      };
      const result = await roleService.getRoleList(params);
      sendSuccessPage(res, result, '获取角色列表成功');
    } catch (error) {
      next(error);
    }
  }

  async all(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      sendSuccess(res, roles, '获取所有角色成功');
    } catch (error) {
      next(error);
    }
  }

  async options(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      const options = roles.map(r => ({ label: r.name, value: r.id, code: r.code }));
      sendSuccess(res, options, '获取角色选项成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.getRoleById(req.params.id);
      sendSuccess(res, role, '获取角色详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.createRole(req.body as CreateRoleRequest);
      sendSuccess(res, role, '创建角色成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.updateRole(req.params.id, req.body as UpdateRoleRequest);
      sendSuccess(res, role, '更新角色成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await roleService.deleteRole(req.params.id);
      sendSuccess(res, null, '删除角色成功');
    } catch (error) {
      next(error);
    }
  }

  async batchDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await roleService.batchDeleteRoles(req.body.ids);
      sendSuccess(res, null, '批量删除角色成功');
    } catch (error) {
      next(error);
    }
  }
}
