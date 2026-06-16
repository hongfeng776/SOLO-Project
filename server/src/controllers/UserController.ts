import { Request, Response, NextFunction } from 'express';
import userService from '@services/UserService';
import { success, paginated } from '@utils/response';

export async function getUserList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = req.query.keyword as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const result = await userService.getUserList({ page, pageSize, keyword, status });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await userService.getUserById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.createUser(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await userService.updateUser(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function assignRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.id);
    const { roleIds } = req.body;
    const result = await userService.assignRoles(userId, roleIds);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
