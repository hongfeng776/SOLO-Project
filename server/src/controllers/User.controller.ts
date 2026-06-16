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
}

export default new UserController();
