import { Request, Response, NextFunction } from 'express';
import permissionService from '@services/PermissionService';
import { success, paginated } from '@utils/response';

export async function getPermissionTree(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await permissionService.getPermissionTree();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getPermissionById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await permissionService.getPermissionById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getPermissionList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = req.query.keyword as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const result = await permissionService.getPermissionList({ page, pageSize, keyword, status });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function createPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await permissionService.createPermission(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updatePermission(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await permissionService.updatePermission(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deletePermission(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await permissionService.deletePermission(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}
