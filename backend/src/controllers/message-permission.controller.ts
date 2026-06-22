import { Request, Response, NextFunction } from 'express';
import messagePermissionService from '../services/message-permission.service';
import { Result } from '../utils/result';
import { UserRole } from '../constants/recruitment.enum';

const getCurrentUser = (req: Request) => {
  return (req as any).user || {
    id: 1,
    username: 'admin',
    role: UserRole.ADMIN,
    companyId: 1,
    realName: '系统管理员',
  };
};

export const getPermissionList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getList(req.query, currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const getPermissionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getById(Number(id), currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const getMyPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getMyPermission(currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const getPermissionByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getByUserId(Number(userId), currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.createPermission(req.body, currentUser);
    res.json(Result.success(result, '创建成功'));
  } catch (error) {
    next(error);
  }
};

export const updatePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.updatePermission(Number(id), req.body, currentUser);
    res.json(Result.success(result, '更新成功'));
  } catch (error) {
    next(error);
  }
};

export const enablePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.enablePermission(Number(id), currentUser);
    res.json(Result.success(result, '启用成功'));
  } catch (error) {
    next(error);
  }
};

export const disablePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.disablePermission(Number(id), currentUser);
    res.json(Result.success(result, '停用成功'));
  } catch (error) {
    next(error);
  }
};

export const validatePermissionConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = messagePermissionService.validatePermissionConfig(req.body);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const batchUpdateByRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userRole, updateData } = req.body;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.batchUpdateByRole(userRole, updateData, currentUser);
    res.json(Result.success(result, '批量更新成功'));
  } catch (error) {
    next(error);
  }
};

export const batchUpdateByDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, updateData } = req.body;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.batchUpdateByDepartment(department, updateData, currentUser);
    res.json(Result.success(result, '批量更新成功'));
  } catch (error) {
    next(error);
  }
};

export const batchStandardize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.batchStandardize(currentUser);
    res.json(Result.success(result, '批量标准化成功'));
  } catch (error) {
    next(error);
  }
};

export const batchDisableRedundant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.batchDisableRedundant(req.body, currentUser);
    res.json(Result.success(result, '批量关闭成功'));
  } catch (error) {
    next(error);
  }
};

export const getPermissionLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getPermissionLogs(req.query, currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const getPermissionLogsByPermissionId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { permissionId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getPermissionLogsByPermissionId(
      Number(permissionId),
      currentUser,
      Number(page),
      Number(pageSize)
    );
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};

export const getPermissionStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = getCurrentUser(req);
    const result = await messagePermissionService.getPermissionStats(currentUser);
    res.json(Result.success(result));
  } catch (error) {
    next(error);
  }
};
