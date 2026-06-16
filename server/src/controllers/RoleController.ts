import { Request, Response, NextFunction } from 'express';
import roleService from '@services/RoleService';
import { success, paginated } from '@utils/response';

export async function getRoleList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = req.query.keyword as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const result = await roleService.getRoleList({ page, pageSize, keyword, status });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getRoleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await roleService.getRoleById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await roleService.createRole(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await roleService.updateRole(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await roleService.deleteRole(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function assignPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const roleId = Number(req.params.id);
    const { permIds } = req.body;
    const result = await roleService.assignPermissions(roleId, permIds);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
