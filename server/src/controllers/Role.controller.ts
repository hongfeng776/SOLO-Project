import { Request, Response } from 'express';
import { roleService } from '../services';
import ResponseUtils from '../utils/response';
import { RoleCreationAttributes, RoleAttributes } from '../models/Role.model';

class RoleController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: RoleCreationAttributes = req.body;
      const result = await roleService.create(data);
      ResponseUtils.created(res, result, '角色创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await roleService.findById(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        keyword: req.query.keyword as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
      };
      const result = await roleService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<RoleAttributes> = req.body;
      const result = await roleService.update(id, data);
      ResponseUtils.success(res, result, '角色更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await roleService.delete(id);
      ResponseUtils.success(res, null, '角色删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await roleService.bulkDelete(ids);
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await roleService.updateStatus(id, status);
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async assignPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      await roleService.assignPermissions(id, permissionIds || []);
      ResponseUtils.success(res, null, '权限分配成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await roleService.getPermissions(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new RoleController();
