import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { LoginRequest, LoginResponse, UserVO, ChangePasswordRequest } from '../types';
import { sendSuccess, ApiResult } from '../utils';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginRequest: LoginRequest = req.body;
      const result: LoginResponse = await this.authService.login(loginRequest, req);
      sendSuccess(res, {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      }, '登录成功');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.authService.logout(req.userId!);
      sendSuccess(res, null, '退出登录成功');
    } catch (error) {
      next(error);
    }
  }

  async getUserInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userInfo: UserVO = await this.authService.getUserInfo(req.userId!);
      const permissions: string[] = await this.authService.getUserPermissions(req.userId!);
      const menus: any[] = await this.authService.getUserMenus(req.userId!);
      sendSuccess(res, { ...userInfo, permissions, menus }, '获取用户信息成功');
    } catch (error) {
      next(error);
    }
  }

  async captcha(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const captchaData = {
        captchaId: 'captcha-' + Date.now(),
        base64: 'data:image/svg+xml;base64,' + Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#f0f0f0"/><text x="60" y="28" font-family="Arial" font-size="24" fill="#333" text-anchor="middle">${code}</text></svg>`
        ).toString('base64'),
        code: code
      };
      sendSuccess(res, captchaData, '获取验证码成功');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result: LoginResponse = await this.authService.refreshToken(refreshToken);
      sendSuccess(res, {
        token: result.accessToken,
        refreshToken: result.refreshToken
      }, '刷新令牌成功');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ChangePasswordRequest = req.body;
      await this.authService.changePassword(req.userId!, request);
      sendSuccess(res, null, '修改密码成功');
    } catch (error) {
      next(error);
    }
  }
}
