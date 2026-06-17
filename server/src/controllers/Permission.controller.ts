import { Request, Response } from 'express';
import { permissionService } from '../services';
import ResponseUtils from '../utils/response';
import { PermissionCreationAttributes, PermissionAttributes } from '../models/Permission.model';

class PermissionController {
  public async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const data: PermissionCreationAttributes & { visibleRange?: string } = req.body;
      const result = await permissionService.createPermission((req as any).user, data);
      ResponseUtils.created(res, result, '权限创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<PermissionAttributes> = req.body;
      const result = await permissionService.updatePermission((req as any).user, id, data);
      ResponseUtils.success(res, result, '权限更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatusBatch(req: Request, res: Response): Promise<void> {
    try {
      const { ids, status } = req.body;
      const result = await permissionService.updateStatusBatch((req as any).user, ids, status);
      ResponseUtils.success(res, result, '批量更新状态成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchSort(req: Request, res: Response): Promise<void> {
    try {
      const result = await permissionService.batchSort((req as any).user, req.body);
      ResponseUtils.success(res, result, '批量排序成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkDeleteDependencies(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await permissionService.checkDeleteDependencies(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await permissionService.deletePermission((req as any).user, id);
      ResponseUtils.success(res, null, '权限删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findIdlePermissions(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        keyword: req.query.keyword as string,
        type: req.query.type as string,
        module: req.query.module as string,
        status: req.query.status !== undefined ? parseInt(req.query.status as string) : undefined,
        level: req.query.level !== undefined ? parseInt(req.query.level as string) : undefined,
        unusedDays: req.query.unusedDays !== undefined ? parseInt(req.query.unusedDays as string) : undefined,
      };
      const result = await permissionService.findIdlePermissions(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findByModule(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.params;
      const result = await permissionService.findByModule(module);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await permissionService.findById(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findTree(req: Request, res: Response): Promise<void> {
    try {
      const result = await permissionService.findTree();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!ids || ids.length === 0) {
        ResponseUtils.error(res, '请选择要删除的记录', 400);
        return;
      }
      for (const id of ids) {
        await permissionService.deletePermission((req as any).user, id);
      }
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await permissionService.updateStatusBatch((req as any).user, [id], status);
      if (result.failed.length > 0) {
        ResponseUtils.error(res, result.failed[0].reason, 400);
        return;
      }
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PermissionController();
