import { Request, Response } from 'express';
import { userService } from '../services';
import ResponseUtils from '../utils/response';
import { CreateUserRequest, UpdateUserRequest, PaginationParams } from '../types';

class UserController {
  public async create(req: Request, res: Response): Promise<void> {
    const data: CreateUserRequest = req.body;
    const result = await userService.create(data);
    ResponseUtils.created(res, result, 'User created successfully');
  }

  public async findById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await userService.findById(id);
    ResponseUtils.success(res, result);
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '10', 10);
    const params: PaginationParams = { page, pageSize };
    const result = await userService.findAll(params);
    ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateUserRequest = req.body;
    const result = await userService.update(id, data);
    ResponseUtils.success(res, result, 'User updated successfully');
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await userService.delete(id);
    ResponseUtils.success(res, null, 'User deleted successfully');
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtils.unauthorized(res, 'User not authenticated');
      return;
    }
    const result = await userService.findById(userId);
    ResponseUtils.success(res, result);
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtils.unauthorized(res, 'User not authenticated');
      return;
    }
    const data: UpdateUserRequest = req.body;
    const result = await userService.update(userId, data);
    ResponseUtils.success(res, result, 'Profile updated successfully');
  }

  public async createAdmin(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    const data = req.body;
    const result = await userService.createAdmin(currentUser, data);
    ResponseUtils.created(res, result, '管理员账号创建成功');
  }

  public async updateAdmin(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    const { id } = req.params;
    const data = req.body;
    const result = await userService.updateAdmin(currentUser, id, data);
    ResponseUtils.success(res, result, '管理员账号更新成功');
  }

  public async findAllAdvanced(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '10', 10);
    const params = {
      page,
      pageSize,
      role: req.query.role as string | undefined,
      status: req.query.status !== undefined ? parseInt(req.query.status as string, 10) : undefined,
      positionLevel: req.query.positionLevel !== undefined ? parseInt(req.query.positionLevel as string, 10) : undefined,
      permissionId: req.query.permissionId as string | undefined,
      keyword: req.query.keyword as string | undefined,
      startTime: req.query.startTime as string | undefined,
      endTime: req.query.endTime as string | undefined,
    };
    const result = await userService.findAllAdvanced(params);
    ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
  }

  public async batchUpdateStatus(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    const { ids, status } = req.body;
    const result = await userService.batchUpdateStatus(currentUser, ids, status);
    ResponseUtils.success(res, result, '批量状态更新完成');
  }

  public async batchResetPermissions(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    const { ids } = req.body;
    const result = await userService.batchResetPermissions(currentUser, ids);
    ResponseUtils.success(res, result, '批量权限重置完成');
  }

  public async checkDeleteDependencies(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await userService.checkDeleteDependencies(id);
    ResponseUtils.success(res, result);
  }

  public async deleteAdmin(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    const { id } = req.params;
    await userService.deleteAdmin(currentUser, id);
    ResponseUtils.success(res, null, '管理员账号删除成功');
  }

  public async getUserTraceInfo(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await userService.getUserTraceInfo(id);
    ResponseUtils.success(res, result);
  }

  public async getPermissionMutualExclusionRules(req: Request, res: Response): Promise<void> {
    const result = userService.getPermissionMutualExclusionRules();
    ResponseUtils.success(res, result);
  }
}

export default new UserController();
