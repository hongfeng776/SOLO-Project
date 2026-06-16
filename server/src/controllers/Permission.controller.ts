import { Request, Response } from 'express';
import { permissionService } from '../services';
import ResponseUtils from '../utils/response';
import { PermissionCreationAttributes, PermissionAttributes } from '../models/Permission.model';

class PermissionController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: PermissionCreationAttributes = req.body;
      const result = await permissionService.create(data);
      ResponseUtils.created(res, result, '权限创建成功');
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

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<PermissionAttributes> = req.body;
      const result = await permissionService.update(id, data);
      ResponseUtils.success(res, result, '权限更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await permissionService.delete(id);
      ResponseUtils.success(res, null, '权限删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await permissionService.bulkDelete(ids);
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await permissionService.updateStatus(id, status);
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PermissionController();
