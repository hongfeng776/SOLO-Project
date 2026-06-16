import { Request, Response } from 'express';
import { userService } from '../services/UserService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getUserList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, username, phone, status } = req.query;

  const result = await userService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    username: username as string | undefined,
    phone: phone as string | undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
  });

  ok(res, result, '获取用户列表成功');
});

export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const user = await userService.getDetail(userId);
  ok(res, user, '获取用户详情成功');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, phone, email, avatar, status } = req.body;

  if (!username) {
    badRequest(res, '缺少用户名');
    return;
  }

  const user = await userService.create({
    username,
    phone,
    email,
    avatar,
    status,
  });

  ok(res, user, '创建用户成功');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const { username, phone, email, avatar, status } = req.body;

  const user = await userService.update(userId, {
    username,
    phone,
    email,
    avatar,
    status,
  });

  ok(res, user, '更新用户成功');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  await userService.delete(userId);
  ok(res, null, '删除用户成功');
});

export const batchDeleteUsers = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的用户');
    return;
  }

  const userIds = ids.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的用户ID');
    }
    return parsed;
  });

  const count = await userService.batchDelete(userIds);
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const statusValue = parseInt(status, 10);
  if (isNaN(statusValue)) {
    badRequest(res, '状态值格式无效');
    return;
  }

  const user = await userService.updateStatus(userId, statusValue);
  ok(res, user, '更新用户状态成功');
});

export default {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  updateUserStatus,
};
