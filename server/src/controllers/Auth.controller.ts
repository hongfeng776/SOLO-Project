import { Request, Response } from 'express';
import { authService } from '../services';
import ResponseUtils from '../utils/response';
import { LoginRequest, CreateUserRequest } from '../types';

class AuthController {
  public async login(req: Request, res: Response): Promise<void> {
    const data: LoginRequest = req.body;
    const result = await authService.login(data);
    ResponseUtils.success(res, result, 'Login successful');
  }

  public async register(req: Request, res: Response): Promise<void> {
    const data: CreateUserRequest = req.body;
    const result = await authService.register(data);
    ResponseUtils.created(res, result, 'Registration successful');
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    ResponseUtils.success(res, result, 'Token refreshed');
  }

  public async logout(_req: Request, res: Response): Promise<void> {
    ResponseUtils.success(res, null, 'Logout successful');
  }
}

export default new AuthController();
