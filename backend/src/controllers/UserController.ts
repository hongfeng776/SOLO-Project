import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { UserService } from '../services';
import { UserQueryParams, CreateUserRequest, UpdateUserRequest } from '../types';

const userService = new UserService();

export class UserController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: UserQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        role_id: req.query.role_id as string
      };
      const result = await userService.getUserList(params);
      sendSuccessPage(res, result, '获取用户列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, user, '获取用户详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(req.body as CreateUserRequest);
      sendSuccess(res, user, '创建用户成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id, req.body as UpdateUserRequest);
      sendSuccess(res, user, '更新用户成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id);
      sendSuccess(res, null, '删除用户成功');
    } catch (error) {
      next(error);
    }
  }

  async batchDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.batchDeleteUsers(req.body.ids);
      sendSuccess(res, null, '批量删除用户成功');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.updateUserStatus(req.params.id, req.body.status);
      sendSuccess(res, null, '更新用户状态成功');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.resetPassword(req.params.id, req.body.newPassword);
      sendSuccess(res, null, '重置密码成功');
    } catch (error) {
      next(error);
    }
  }
}
